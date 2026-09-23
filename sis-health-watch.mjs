/**
 * sis-health-watch.mjs
 * ─────────────────────────────────────────────────────────────
 * Independent watcher for the SiS Extended Education API — the backend the
 * Open Studies / Extended Ed cart calls at runtime.
 *
 * WHY THIS EXISTS
 * Nothing else watches it. `sitecore-fee-watch.mjs` polls Sitecore Edge, a
 * different system holding catalogue data. `fee-guard.mjs` inspects an already
 * built dataset. Neither touches the live API a shopper hits when they press
 * Add to Cart — so when that API degrades, the first and only report is a
 * student who cannot register.
 *
 * WHAT IT WATCHES FOR — LATENCY, NOT ERRORS
 * Measured 2026-08-18 against production, 15 identical requests to
 * `courseofferings/2428`: min 2.8 s, median 10.9 s, max 90.3 s, mean 31.5 s.
 * **Every one returned HTTP 200.** SiS does not fail by answering wrong; it
 * fails by answering late. The 504 the browser shows is the Vercel proxy giving
 * up on a call SiS would eventually have completed.
 *
 * A status-code check would therefore have reported everything healthy through
 * the entire outage. This watcher treats elapsed time as the signal and the
 * status code as secondary.
 *
 * The control that localises the fault: `/api/mstoken` is served by the SAME
 * Vercel project as the cart endpoints and stayed at 0.29–0.90 s across the same
 * window. The proxy is healthy; the leg it forwards to the SiS backend is not.
 * This watcher probes both, so every alert carries that comparison and nobody
 * has to re-derive it at 2 AM.
 *
 * WHICH BACKEND — asked, never assumed. The proxy reports its upstream in the
 * `X-Api-Base` header on a HEAD, answered from proxy config without calling SiS,
 * so every reading names the host it actually measured. Prod resolves to
 * `api.bowvalleycollege.ca`; UAT to `apim-bvc-uat-001.azure-api.net`. This was
 * previously a hardcoded `devapi.bvc.dev` in a comment and in the alert text —
 * already wrong for prod, and it is the one fact the SiS team needs in order to
 * trust a report at all.
 *
 * It only ever READS. No cart is created, no registration is submitted.
 *
 * Usage:
 *   node sis-health-watch.mjs            # one poll, prints per-probe timings
 *   node sis-health-watch.mjs --history  # print recorded incidents and exit
 * ─────────────────────────────────────────────────────────────
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import dotenv from 'dotenv';
import { sendTeams, pingHeartbeat } from './notify.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const BVC_APP = join(ROOT, 'src', 'bvc-app');
const STATE_DIR = join(ROOT, '.pipeline-state');
const LAST_SEEN = join(STATE_DIR, 'sis-watch-last.json');
const HISTORY = join(STATE_DIR, 'sis-watch-history.jsonl');

dotenv.config({ path: join(BVC_APP, '.env.local') });

const API_ORIGIN = process.env.SIS_API_ORIGIN ?? 'https://bvc-api-proxy.vercel.app';

// A real, bookable Open Studies offering. Any stable id works — we are timing the
// backend, not asserting on the payload. Override if this section is withdrawn.
const SKU = process.env.SIS_WATCH_SKU ?? '2428';

// SLOW is the point where a shopper has already given up, not where the API breaks.
// The incident median was 10.9 s and a healthy call is ~2 s, so 8 s sits above
// normal and below the incident median: it fires during a degradation and stays
// quiet on a healthy day.
const SLOW_MS = Number(process.env.SIS_WATCH_SLOW_MS ?? 8_000);

// Past this we stop waiting and call it failed. A call this slow has already
// produced a 504 in the browser, so continuing to wait measures nothing a real
// user would ever have seen.
const TIMEOUT_MS = Number(process.env.SIS_WATCH_TIMEOUT_MS ?? 30_000);

// This backend is genuinely erratic — a single slow call is not an outage.
// Require consecutive bad polls so one unlucky sample cannot page anyone.
const FAILS_BEFORE_ALERT = Number(process.env.SIS_WATCH_FAILS_BEFORE_ALERT ?? 2);
const COOLDOWN_H = Number(process.env.SIS_WATCH_COOLDOWN_H ?? 1);

const ts = () => new Date().toISOString();
const warn = (m) => console.warn(`[${ts()}] ${m}`);

/** Time one request. Never throws: a failure IS the measurement. */
async function timed(label, url, init = {}, endpoint = null) {
  const started = Date.now();
  try {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
    // Drain the body so the timing covers a full response rather than just the
    // headers — a backend that stalls mid-stream would otherwise look fast.
    await res.text().catch(() => '');
    return { label, endpoint, ms: Date.now() - started, status: res.status, ok: res.ok };
  } catch (err) {
    const timedOut = err.name === 'TimeoutError' || err.name === 'AbortError';
    return {
      label,
      endpoint,
      ms: Date.now() - started,
      status: timedOut ? 'timeout' : 'error',
      ok: false,
      error: err.message,
    };
  }
}

/**
 * Ask the proxy which SiS backend it forwards to. Answered from proxy config on
 * a HEAD — no SiS call, nothing measurable — so it costs nothing to state the
 * host on every poll rather than trust a comment. Returns null rather than
 * throwing: not knowing the backend must never fail a poll.
 */
async function discoverBackend() {
  try {
    const res = await fetch(`${API_ORIGIN}/api/bvcpayment`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(10_000),
    });
    return res.headers.get('x-api-base');
  } catch {
    return null;
  }
}

async function mintToken() {
  const res = await fetch(`${API_ORIGIN}/api/mstoken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const json = await res.json();
  return json?.access_token ?? null;
}

async function runProbes() {
  // The token probe doubles as the control: same Vercel project as the cart
  // endpoints, so if this is fast while the others are slow, the proxy is
  // exonerated and the SiS backend is not.
  const token = await timed('mstoken (proxy control)', `${API_ORIGIN}/api/mstoken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  }, '/api/mstoken (proxy-local, not SiS)');

  if (!token.ok) return { token, probes: [], fatal: `token endpoint returned ${token.status}` };

  let access = null;
  try {
    access = await mintToken();
  } catch (err) {
    return { token, probes: [], fatal: `could not mint token: ${err.message}` };
  }
  if (!access) return { token, probes: [], fatal: 'no access_token in token response' };

  const auth = {
    Authorization: `Bearer ${access}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  const via = (endpoint) => `${API_ORIGIN}/api/bvcpayment?endpoint=${encodeURIComponent(endpoint)}`;

  // The three calls the cart actually depends on. All three were observed
  // degrading together on 2026-08-18, so probing only one would under-report;
  // probing all three tells the SiS team whether a fault is backend-wide or
  // confined to a single handler.
  // The SiS paths are named constants so every log line, history row and Teams
  // card can state WHICH endpoint was slow. The proxy is never the suspect — it
  // is the control — so the path behind it is the part the SiS team needs to
  // match against their own logs.
  const OFFERINGS = `thesissitecorexm.api/courseofferings/${SKU}`;
  const VALIDATION = 'thesissitecorexm.api/validation';
  const FEE = `thesissitecorexm.api/fee/${SKU}/`;

  const probes = [
    await timed('courseofferings (add to cart)', via(OFFERINGS), { headers: auth }, OFFERINGS),
    // `validation` must take a JSON BODY — on the query string it answers 415.
    await timed('validation (seat check)', `${API_ORIGIN}/api/bvcpayment?endpoint=${VALIDATION}`, {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ studentId: '0', courseBeingAdded: Number(SKU), coursesInCart: [] }),
    }, VALIDATION),
    // Trailing slash is required and may be empty — that is the anonymous
    // fee preview. The literal string 'null' 404s. See docs/sis-api.md.
    await timed('fee (checkout total)', via(FEE), { headers: auth }, FEE),
  ];

  return { token, probes, fatal: null };
}

function classify({ probes, fatal }) {
  if (fatal) return { state: 'DOWN', reason: fatal };

  const failed = probes.filter((p) => !p.ok);
  if (failed.length) {
    return { state: 'DOWN', reason: failed.map((p) => `${p.label} → ${p.status}`).join('; ') };
  }

  const slow = probes.filter((p) => p.ms >= SLOW_MS);
  if (slow.length) {
    return { state: 'DEGRADED', reason: slow.map((p) => `${p.label} ${(p.ms / 1000).toFixed(1)}s`).join('; ') };
  }

  return { state: 'OK', reason: null };
}

function printHistory() {
  if (!existsSync(HISTORY)) return console.log('No SiS incidents recorded yet.');
  const rows = readFileSync(HISTORY, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
  console.log(`${rows.length} state change(s) recorded:\n`);
  for (const r of rows) {
    console.log(`${r.at}  ${r.from} → ${r.to}`);
    if (r.reason) console.log(`    ${r.reason}`);
    if (r.timings) console.log(`    ${r.timings}`);
  }
}

async function main() {
  if (process.argv.includes('--history')) return printHistory();

  const backend = await discoverBackend();
  const result = await runProbes();
  const { state, reason } = classify(result);

  const line = (p) =>
    `  ${p.label.padEnd(30)} ${String((p.ms / 1000).toFixed(2) + 's').padStart(8)}  ${p.status}` +
    (p.endpoint ? `  ${p.endpoint}` : '');
  console.log(`[${ts()}] SiS health: ${state}`);
  // Which environment produced this reading. Without it, a line from a run with
  // SIS_API_ORIGIN pointed at UAT is indistinguishable from a prod one — and
  // these logs are handed to the SiS team as evidence.
  console.log(`  via proxy ${API_ORIGIN}  ·  sku ${SKU}`);
  console.log(`  SiS backend ${backend ?? '(proxy reported no X-Api-Base)'}`);
  console.log(line(result.token));
  result.probes.forEach((p) => console.log(line(p)));
  if (reason) console.log(`  → ${reason}`);

  const timings = [result.token, ...result.probes]
    .map((p) => `${p.label}=${(p.ms / 1000).toFixed(1)}s/${p.status}${p.endpoint ? ` [${p.endpoint}]` : ''}`)
    .join('  ');

  // The Teams card renders these instead of the flat `timings` string, which is
  // kept only for the history file. Reusing `line()` means the card and the
  // console show byte-identical rows — one format to learn, not two.
  const monoLines = [result.token, ...result.probes].map((p) => line(p).trimStart());

  // Environment as structured rows rather than prose. Every card carries it,
  // including recovery — "it recovered" is useless without "which one".
  const cardFacts = [
    { title: 'Proxy', value: API_ORIGIN },
    { title: 'SiS backend', value: backend ?? 'unreported' },
    { title: 'Offering', value: SKU },
  ];

  const previous = existsSync(LAST_SEEN) ? JSON.parse(readFileSync(LAST_SEEN, 'utf8')) : {};
  const badRun = state === 'OK' ? 0 : (previous.badRun ?? 0) + 1;

  const current = {
    at: ts(),
    state,
    origin: API_ORIGIN,
    backend,
    sku: SKU,
    reason,
    timings,
    badRun,
    lastAlertAt: previous.lastAlertAt ?? null,
    alertedState: previous.alertedState ?? 'OK',
  };

  mkdirSync(STATE_DIR, { recursive: true });

  // The heartbeat is what catches THIS watcher dying, the machine sleeping, or
  // the cron being deleted — none of which any local check can report, because a
  // local watchdog dies with the machine it watches. It gets its own URL because
  // "SiS is unhealthy" and "the deploy pipeline failed" are different conditions
  // needing different alarms.
  //
  // IT USES THE SAME DEBOUNCE AS TEAMS, and must. Pinging the raw per-poll
  // verdict flipped the check UP/DOWN on every blip: 15 transitions in three
  // hours on 2026-08-19, arriving 8–10 min apart, from a backend that is erratic
  // by nature. That is the exact noise `FAILS_BEFORE_ALERT` exists to absorb —
  // one unlucky sample must not page anyone — so the channel meant to catch
  // SILENCE had become the loudest one. A single bad poll now still pings
  // success; only a sustained fault flips the check.
  //
  // The dead-man's-switch property is untouched: a poll that never runs sends
  // nothing at all, which is what the monitor escalates on.
  await pingHeartbeat({
    baseUrl: process.env.HEARTBEAT_SIS_URL,
    suffix: badRun >= FAILS_BEFORE_ALERT ? '/fail' : '',
    log: warn,
  });

  const shouldAlert = badRun >= FAILS_BEFORE_ALERT && current.alertedState === 'OK';
  const recovered = state === 'OK' && current.alertedState !== 'OK';

  if (shouldAlert || recovered) {
    appendFileSync(
      HISTORY,
      JSON.stringify({
        at: current.at,
        from: current.alertedState,
        to: state,
        origin: API_ORIGIN,
        backend,
        sku: SKU,
        reason,
        timings,
      }) + '\n'
    );
  }

  if (recovered) {
    await sendTeams({
      url: process.env.TEAMS_WEBHOOK_URL,
      title: 'SiS API recovered',
      message:
        'The SiS Extended Education API is responding normally again.\n\n' +
        'Add to Cart and checkout should be working. Run "node sis-health-watch.mjs --history" ' +
        'for the incident timeline.',
      isFailure: false,
      extra: { facts: cardFacts, mono: monoLines },
      log: warn,
    });
    current.alertedState = 'OK';
    writeFileSync(LAST_SEEN, JSON.stringify(current, null, 1));
    return;
  }

  if (!shouldAlert) {
    if (state !== 'OK') {
      console.log(`[${ts()}] ${state} on ${badRun} consecutive poll(s) — alert fires at ${FAILS_BEFORE_ALERT}.`);
    }
    writeFileSync(LAST_SEEN, JSON.stringify(current, null, 1));
    return;
  }

  // Cooldown so a multi-hour degradation does not repeat every 5 minutes. The
  // heartbeat keeps failing throughout, so silence here never means "resolved".
  const lastAlert = previous.lastAlertAt ? Date.parse(previous.lastAlertAt) : 0;
  const hoursSince = (Date.now() - lastAlert) / 3_600_000;
  if (hoursSince < COOLDOWN_H) {
    console.log(
      `[${ts()}] Teams alert suppressed — last sent ${hoursSince.toFixed(1)}h ago (cooldown ${COOLDOWN_H}h).`
    );
    writeFileSync(LAST_SEEN, JSON.stringify(current, null, 1));
    return;
  }

  const sent = await sendTeams({
    url: process.env.TEAMS_WEBHOOK_URL,
    title: state === 'DOWN' ? 'SiS API DOWN — cart is broken' : 'SiS API degraded — cart is slow',
    message:
      `The SiS Extended Education API behind Add to Cart and checkout is ${state.toLowerCase()}.\n\n` +
      `${reason}\n\n` +
      `The mstoken probe is the control — it runs on the same Vercel proxy project, so if it is fast ` +
      `while the others are slow, the fault is the SiS backend, not the proxy.\n\n` +
      `Shoppers see "Failed to check course availability" and cannot add courses. ` +
      `Sustained for ${badRun} consecutive poll(s). Further alerts suppressed for ${COOLDOWN_H}h.`,
    isFailure: true,
    extra: { facts: cardFacts, mono: monoLines },
    log: warn,
  });

  if (sent) current.lastAlertAt = new Date().toISOString();
  current.alertedState = state;
  writeFileSync(LAST_SEEN, JSON.stringify(current, null, 1));
}

// Monitoring must never fail loudly enough to matter — always exit 0.
main().catch((err) => warn(`sis health watch failed: ${err.message}`));
