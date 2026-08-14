/**
 * fee-guard.mjs
 * ─────────────────────────────────────────────────────────────
 * Deploy safety check for catalog-wide fee changes.
 *
 * WHY THIS EXISTS
 * The SIS → Sitecore sync runs hourly and finishes around :06. On
 * 2026-08-12/13 it was observed emitting two *different* datasets on
 * alternating runs — e.g. ANAT1101-20 Domestic flipped 1020 → 1000 → 1020
 * every hour, catalog-wide, with International amounts also swapping
 * between sections. Our pipeline is a faithful reader, so it dutifully
 * published whichever half of the flip it happened to catch, and roughly
 * every second hourly deploy shipped wrong prices.
 *
 * A legitimate price update touches a handful of courses. A sync fault
 * touches nearly all of them at once. This guard compares the fees just
 * extracted against the last set we successfully deployed and blocks the
 * deploy when too large a share of sections changed at once.
 *
 * The baseline is only advanced on a deploy that passes, so while the sync
 * is flapping the site stays pinned to the last accepted dataset instead of
 * oscillating with it.
 *
 * Override for a genuine catalog-wide change (annual tuition increase, etc.):
 *   node pipeline.mjs --skip-fee-guard      (or SKIP_FEE_GUARD=1)
 * Tune with FEE_GUARD_THRESHOLD (default 0.25) and FEE_GUARD_MIN_CHANGED
 * (default 10).
 * ─────────────────────────────────────────────────────────────
 */

import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';

// Both catalogues share the same course JSON shape:
//   { sisId, sections: [ { name, fees: { domestic: {amount,tax}, international: {...} } } ] }
const FEE_SOURCES = [
  ['ee', ['public', 'data', 'courses']],
  ['os', ['public', 'data', 'oScourses']],
];

const money = (v) => (v === undefined || v === null ? '-' : String(v));

/**
 * Flatten every section's fees into { "os:ANAT1101/ANAT1101-20": "1020/0|1894/0" }.
 * Keyed by catalogue + course + section so a section that appears or
 * disappears is distinguishable from one whose price moved.
 */
export function collectFees(bvcAppDir) {
  const fees = {};
  for (const [kind, relParts] of FEE_SOURCES) {
    const dir = join(bvcAppDir, ...relParts);
    if (!existsSync(dir)) continue;

    for (const entry of readdirSync(dir)) {
      if (!entry.startsWith('course-') || !entry.endsWith('.json')) continue;

      let course;
      try {
        course = JSON.parse(readFileSync(join(dir, entry), 'utf8'));
      } catch {
        continue; // a malformed file is the build's problem to report, not ours
      }

      const sisId = course.sisId ?? entry.slice('course-'.length, -'.json'.length);
      for (const section of course.sections ?? []) {
        const d = section.fees?.domestic;
        const i = section.fees?.international;
        const key = `${kind}:${sisId}/${section.name ?? section.sisId ?? '?'}`;
        fees[key] = `${money(d?.amount)}/${money(d?.tax)}|${money(i?.amount)}/${money(i?.tax)}`;
      }
    }
  }
  return fees;
}

/** Diff two fee maps. Only keys present in both count toward the change ratio. */
export function compareFees(current, baseline) {
  const changes = [];
  let compared = 0;

  for (const [key, value] of Object.entries(current)) {
    if (!(key in baseline)) continue;
    compared++;
    if (baseline[key] !== value) changes.push({ key, from: baseline[key], to: value });
  }

  const added = Object.keys(current).filter((k) => !(k in baseline));
  const removed = Object.keys(baseline).filter((k) => !(k in current));

  return {
    total: Object.keys(current).length,
    compared,
    changed: changes.length,
    ratio: compared === 0 ? 0 : changes.length / compared,
    added: added.length,
    removed: removed.length,
    changes,
  };
}

/**
 * Run the guard.
 * Returns { ok, reason, stats, commit } — call commit() only after the
 * deploy actually succeeds, so a blocked or failed run leaves the baseline
 * pointing at the last known-good dataset.
 */
export function checkFeeGuard({ bvcAppDir, statePath, threshold, minChanged, skip, log = console.log }) {
  const current = collectFees(bvcAppDir);
  const commit = () => {
    mkdirSync(dirname(statePath), { recursive: true });
    writeFileSync(statePath, JSON.stringify({ savedAt: new Date().toISOString(), fees: current }, null, 0));
  };

  if (skip) {
    log(`Fee guard: SKIPPED by request (${Object.keys(current).length} sections extracted)`);
    return { ok: true, reason: 'skipped', stats: null, commit };
  }

  if (Object.keys(current).length === 0) {
    // Nothing to compare and nothing worth pinning — let the build's own
    // checks decide whether an empty catalogue is a failure.
    log('Fee guard: no fee data found; skipping check');
    return { ok: true, reason: 'no-data', stats: null, commit: () => {} };
  }

  if (!existsSync(statePath)) {
    log(`Fee guard: no baseline yet — establishing one from ${Object.keys(current).length} sections`);
    return { ok: true, reason: 'baseline-established', stats: null, commit };
  }

  let baseline;
  try {
    baseline = JSON.parse(readFileSync(statePath, 'utf8')).fees ?? {};
  } catch {
    log('Fee guard: baseline unreadable — re-establishing');
    return { ok: true, reason: 'baseline-reset', stats: null, commit };
  }

  const stats = compareFees(current, baseline);
  const pct = (stats.ratio * 100).toFixed(1);
  log(
    `Fee guard: ${stats.changed}/${stats.compared} sections changed (${pct}%), ` +
      `+${stats.added} new, -${stats.removed} gone`
  );

  for (const c of stats.changes.slice(0, 5)) log(`  ~ ${c.key}: ${c.from} → ${c.to}`);
  if (stats.changes.length > 5) log(`  ... and ${stats.changes.length - 5} more`);

  if (stats.changed >= minChanged && stats.ratio > threshold) {
    return {
      ok: false,
      reason: `${stats.changed} of ${stats.compared} sections (${pct}%) changed price in one run — over the ${(threshold * 100).toFixed(0)}% limit`,
      stats,
      commit,
    };
  }

  return { ok: true, reason: 'within-limits', stats, commit };
}
