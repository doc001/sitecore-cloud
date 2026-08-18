/**
 * sitecore-fee-watch.mjs
 * ─────────────────────────────────────────────────────────────
 * Independent watcher for the upstream SIS → Sitecore fee flip.
 *
 * WHY THIS EXISTS, SEPARATELY FROM fee-guard.mjs
 * The fee guard sees the catalogue once an hour, only while the pipeline runs,
 * and only reports a percentage. It answers "should we deploy this?" — not
 * "when exactly did the data change, and to what?"
 *
 * This watcher polls Sitecore Edge directly every few minutes. It needs no
 * build, keeps working when the pipeline is disabled, and pins the flip to a
 * few minutes rather than an hour. That precision is what the SIS team needs to
 * find the job responsible: a timestamp they can match against their own logs.
 *
 * It only ever READS. Nothing in this repo writes to Sitecore.
 *
 * Usage:
 *   node sitecore-fee-watch.mjs            # one poll, prints current state
 *   node sitecore-fee-watch.mjs --history  # print recorded flips and exit
 * ─────────────────────────────────────────────────────────────
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import dotenv from 'dotenv';
import { sendTeams } from './notify.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const BVC_APP = join(ROOT, 'src', 'bvc-app');
const STATE_DIR = join(ROOT, '.pipeline-state');
const LAST_SEEN = join(STATE_DIR, 'fee-watch-last.json');
const HISTORY = join(STATE_DIR, 'fee-watch-history.jsonl');

dotenv.config({ path: join(BVC_APP, '.env.local') });

const SIS_ROOT = '/sitecore/content/BVC/BVC/Data/SisData';

// A small sample is enough: the fault moves the whole catalogue at once (229 of
// 298 sections, every time). Probes span both trees so we can tell whether a
// future fault is catalogue-wide or confined to one of them.
const PROBES = [
  { key: 'os:ANAT1101-20', path: `${SIS_ROOT}/Credit Courses/ANAT1101/ANAT1101-20/Fees` },
  { key: 'os:ACCT1103-01', path: `${SIS_ROOT}/Credit Courses/ACCT1103/ACCT1103-01/Fees` },
  { key: 'os:CHEM1901-01', path: `${SIS_ROOT}/Credit Courses/CHEM1901/CHEM1901-01/Fees` },
  { key: 'ee:ACCT9101-91', path: `${SIS_ROOT}/Courses/ACCT9101/ACCT9101-91/Fees` },
];

const QUERY = `query($p:String!){item(path:$p,language:"en"){children(first:20){results{
  name amount:field(name:"Amount"){value} updated:field(name:"__Updated"){value}
}}}}`;

const ts = () => new Date().toISOString();
const warn = (m) => console.warn(`[${ts()}] ${m}`);

async function probe({ key, path }) {
  const res = await fetch(process.env.SITECORE_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', sc_apikey: process.env.SC_APIKEY },
    body: JSON.stringify({ query: QUERY, variables: { p: path } }),
    signal: AbortSignal.timeout(20_000),
  });
  const json = await res.json();
  const items = json?.data?.item?.children?.results;
  if (!items?.length) return { key, error: json?.errors?.[0]?.message ?? 'no fee items returned' };

  const by = Object.fromEntries(items.map((i) => [i.name, i]));
  const amount = (n) => by[n]?.amount?.value?.split('.')[0] ?? '-';
  return {
    key,
    value: `D$${amount('Domestic')} I$${amount('International')}`,
    // __Updated is the field that proves a *write* rather than a stale cache:
    // a cache would keep serving an old timestamp.
    updated: by.Domestic?.updated?.value ?? by.International?.updated?.value ?? '-',
  };
}

function printHistory() {
  if (!existsSync(HISTORY)) return console.log('No flips recorded yet.');
  const rows = readFileSync(HISTORY, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
  console.log(`${rows.length} change event(s) recorded:\n`);
  for (const r of rows) {
    console.log(`${r.at}  ${r.key}`);
    console.log(`    ${r.from} → ${r.to}    __Updated=${r.updated}`);
  }
}

async function main() {
  if (process.argv.includes('--history')) return printHistory();

  if (!process.env.SITECORE_GRAPHQL_ENDPOINT || !process.env.SC_APIKEY) {
    warn('SITECORE_GRAPHQL_ENDPOINT / SC_APIKEY missing — cannot poll');
    return;
  }

  const results = [];
  for (const p of PROBES) {
    try {
      results.push(await probe(p));
    } catch (err) {
      results.push({ key: p.key, error: err.message });
    }
  }

  const previous = existsSync(LAST_SEEN) ? JSON.parse(readFileSync(LAST_SEEN, 'utf8')) : {};
  const current = {};
  const changes = [];

  for (const r of results) {
    if (r.error) {
      warn(`${r.key}: ${r.error}`);
      continue;
    }
    current[r.key] = { value: r.value, updated: r.updated };
    const before = previous[r.key];
    console.log(`  ${r.key.padEnd(16)} ${r.value.padEnd(18)} __Updated=${r.updated}`);
    if (before && before.value !== r.value) {
      changes.push({ at: ts(), key: r.key, from: before.value, to: r.value, updated: r.updated });
    }
  }

  // Carry the alert cooldown across polls — it lives in the same file, and
  // every quiet poll rewrites that file.
  if (previous.__lastAlertAt) current.__lastAlertAt = previous.__lastAlertAt;

  mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(LAST_SEEN, JSON.stringify(current, null, 1));

  if (!changes.length) return;

  for (const c of changes) appendFileSync(HISTORY, JSON.stringify(c) + '\n');

  const detail = changes.map((c) => `${c.key}: ${c.from} → ${c.to} (__Updated ${c.updated})`).join('\n');
  console.log(`\n[${ts()}] FEE CHANGE DETECTED\n${detail}`);

  // History records EVERY flip — that is the artefact for the SIS team.
  // Teams does not, because the known fault flips twice an hour: alerting on
  // each one would be ~48 messages a day, and an alert nobody reads is worse
  // than no alert. Cooldown keeps the channel meaningful while the underlying
  // issue is open; raise or lower it with FEE_WATCH_ALERT_COOLDOWN_H.
  const cooldownH = Number(process.env.FEE_WATCH_ALERT_COOLDOWN_H ?? 6);
  const lastAlert = previous.__lastAlertAt ? Date.parse(previous.__lastAlertAt) : 0;
  const hoursSince = (Date.now() - lastAlert) / 3_600_000;

  if (hoursSince < cooldownH) {
    console.log(
      `[${ts()}] Teams alert suppressed — last sent ${hoursSince.toFixed(1)}h ago ` +
        `(cooldown ${cooldownH}h). Flip still recorded in fee-watch-history.jsonl.`
    );
    // Carry the timestamp forward so the cooldown does not reset every poll.
    current.__lastAlertAt = previous.__lastAlertAt;
    writeFileSync(LAST_SEEN, JSON.stringify(current, null, 1));
    return;
  }

  const total = existsSync(HISTORY)
    ? readFileSync(HISTORY, 'utf8').trim().split('\n').filter(Boolean).length
    : changes.length;

  const sent = await sendTeams({
    url: process.env.TEAMS_WEBHOOK_URL,
    title: 'Sitecore fee data changed',
    message:
      `Upstream fee values changed in Sitecore (direct Edge poll, no build involved):\n\n${detail}\n\n` +
      `${total} change event(s) recorded so far. Further alerts suppressed for ${cooldownH}h; ` +
      `run \`node sitecore-fee-watch.mjs --history\` for the full list.`,
    isFailure: true,
    log: warn,
  });

  if (sent) {
    current.__lastAlertAt = new Date().toISOString();
    writeFileSync(LAST_SEEN, JSON.stringify(current, null, 1));
  }
}

// Monitoring must never fail loudly enough to matter — always exit 0.
main().catch((err) => warn(`fee watch failed: ${err.message}`));
