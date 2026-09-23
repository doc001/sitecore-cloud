/**
 * archive-logs.mjs
 * ─────────────────────────────────────────────────────────────
 * Move PM2 logs off this machine and into OneDrive, filed by week and by day.
 *
 * WHY
 * `logs/` is append-only and nothing prunes it. `pipeline-out.log` grows ~2 MB a
 * day and reached 4 MB within three days. More to the point, every log this
 * project produces lives on ONE laptop: if it is rebuilt, lost, or simply off,
 * the entire record of what the pipeline and the watchers saw goes with it —
 * including the SiS timings the SiS team is being asked to act on. OneDrive is
 * backed up and shareable; `C:\wamp64` is neither.
 *
 * WHAT IT DOES
 * Splits each log by the date prefix PM2 writes (`time: true`), then appends
 * each day's lines to
 *
 *   <archive>/<ISO week>/<YYYY-MM-DD>/<logname>.log
 *   e.g. .../Open Cart/2026-W34/2026-08-19/sis-health-out.log
 *
 * and rewrites the local file with only the lines it did not archive.
 *
 * ONLY COMPLETE DAYS ARE MOVED. Today's lines stay local, because the day is
 * still being written — archiving them would split one day across two runs and
 * leave the archive looking complete when it is not.
 *
 * NOTHING IS DELETED FROM THE ARCHIVE. This moves logs, it does not rotate them
 * out of existence; pruning is a separate decision for a human.
 *
 * SAFETY ORDER: every archive write for a file succeeds before that file is
 * truncated. If OneDrive is unavailable the run reports and leaves the local log
 * untouched — losing a log to a failed archive step would be worse than the disk
 * usage it was trying to fix.
 *
 * Usage:
 *   node archive-logs.mjs --dry-run   # report what would move, touch nothing
 *   node archive-logs.mjs             # archive and truncate
 * ─────────────────────────────────────────────────────────────
 */

import { fileURLToPath } from 'url';
import { dirname, join, basename } from 'path';
import {
  readFileSync,
  writeFileSync,
  appendFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
} from 'fs';
import { execFileSync } from 'child_process';

const ROOT = dirname(fileURLToPath(import.meta.url));
const LOG_DIR = join(ROOT, 'logs');

// Overridable so the same script can archive somewhere else without an edit.
const ARCHIVE_ROOT =
  process.env.LOG_ARCHIVE_DIR ??
  'C:\\Users\\jcueto\\OneDrive - Bow Valley College\\General\\Matrix\\Open Cart';

const DRY_RUN = process.argv.includes('--dry-run');

/**
 * Log files PM2 currently holds open FOR THIS PROCESS. When the archiver runs
 * under PM2 its own stdout is being appended while it works, so rewriting that
 * file would truncate the very run doing the writing and interleave the result.
 * PM2 publishes the paths in the environment; outside PM2 these are undefined
 * and a manual run archives everything, which is what you want interactively.
 */
const OWN_LOGS = new Set(
  [process.env.pm_out_log_path, process.env.pm_err_log_path]
    .filter(Boolean)
    .map((p) => basename(p))
);

const ts = () => new Date().toISOString();
const log = (m) => console.log(`[${ts()}] ${m}`);

// PM2 writes `2026-08-19T08:45:12: ` on every line when `time: true`. That is a
// LOCAL timestamp, and only its date portion is used, as a grouping key — so no
// timezone conversion is involved or wanted.
const LINE_DATE = /^(\d{4}-\d{2}-\d{2})T\d{2}:\d{2}:\d{2}: /;

/** Local calendar date, formatted the same way the log prefix is. */
function todayKey() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * ISO-8601 week, as `2026-W34`. Uses the ISO week-YEAR, not the calendar year —
 * they differ around New Year, and getting that wrong would file 2026-12-31 and
 * 2027-01-01 into folders that misrepresent the same week.
 */
function isoWeek(dateKey) {
  const t = new Date(`${dateKey}T12:00:00Z`); // noon: immune to any DST edge
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day); // shift to that week's Thursday
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t - yearStart) / 86_400_000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function humanSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function archiveOne(file, today) {
  const path = join(LOG_DIR, file);
  const before = statSync(path).size;
  if (before === 0) return null;

  const raw = readFileSync(path, 'utf8');
  const lines = raw.split('\n');
  if (lines[lines.length - 1] === '') lines.pop();

  // Group by day. A line with no parseable prefix inherits the day of the line
  // above it, so a future wrapped or multi-line entry stays with its own record
  // instead of being silently dropped. (None exist today — all 56k lines match.)
  const byDay = new Map();
  const keep = [];
  let lastDay = null;
  for (const line of lines) {
    const m = LINE_DATE.exec(line);
    const day = m ? m[1] : lastDay;
    if (m) lastDay = day;

    if (day && day < today) {
      if (!byDay.has(day)) byDay.set(day, []);
      byDay.get(day).push(line);
    } else {
      keep.push(line); // today, or unattributable before any dated line
    }
  }

  if (byDay.size === 0) return { file, days: [], moved: 0, before };

  // Write EVERY day before truncating anything. A partial archive followed by a
  // truncate would lose logs outright.
  const written = [];
  for (const [day, dayLines] of [...byDay].sort()) {
    const dir = join(ARCHIVE_ROOT, isoWeek(day), day);
    const target = join(dir, basename(file));
    const body = dayLines.join('\n') + '\n';
    if (!DRY_RUN) {
      mkdirSync(dir, { recursive: true });
      // Append: a day may legitimately be archived across two runs, and a re-run
      // cannot duplicate, because archived lines are removed locally.
      appendFileSync(target, body, 'utf8');
    }
    written.push({ day, lines: dayLines.length, bytes: Buffer.byteLength(body), target });
  }

  const kept = keep.length ? keep.join('\n') + '\n' : '';
  if (!DRY_RUN) writeFileSync(path, kept, 'utf8');

  return {
    file,
    days: written,
    moved: written.reduce((a, d) => a + d.lines, 0),
    before,
    after: Buffer.byteLength(kept),
  };
}

function main() {
  if (!existsSync(LOG_DIR)) {
    log(`No logs/ directory at ${LOG_DIR} — nothing to do.`);
    return;
  }
  if (!DRY_RUN && !existsSync(ARCHIVE_ROOT)) {
    // Do not create the OneDrive tree ourselves. If the path is wrong, or
    // OneDrive has not mounted yet, silently creating a local folder of the same
    // name would archive into a directory that never syncs anywhere — the logs
    // would look safely filed away while still living on one disk.
    log(`ARCHIVE ROOT MISSING: ${ARCHIVE_ROOT}`);
    log('Refusing to archive — local logs left untouched.');
    process.exitCode = 1;
    return;
  }

  const today = todayKey();
  log(`${DRY_RUN ? '[DRY RUN] ' : ''}Archiving log lines dated before ${today}`);
  log(`  from ${LOG_DIR}`);
  log(`  to   ${ARCHIVE_ROOT}\\<ISO week>\\<day>\\`);

  const files = readdirSync(LOG_DIR).filter((f) => f.endsWith('.log') && !OWN_LOGS.has(f));
  if (OWN_LOGS.size) log(`  (skipping this run's own PM2 logs: ${[...OWN_LOGS].join(', ')})`);
  let totalLines = 0;
  let totalFreed = 0;
  let touched = 0;

  for (const file of files) {
    let r;
    try {
      r = archiveOne(file, today);
    } catch (err) {
      log(`  ${file}: FAILED — ${err.message} (left untouched)`);
      process.exitCode = 1;
      continue;
    }
    if (!r) {
      log(`  ${file}: empty, skipped`);
      continue;
    }
    if (!r.days.length) {
      log(`  ${file}: only today's lines, nothing to move`);
      continue;
    }

    touched++;
    totalLines += r.moved;
    totalFreed += r.before - (r.after ?? 0);
    log(
      `  ${file}: ${r.moved} lines over ${r.days.length} day(s), ` +
        `${humanSize(r.before)} → ${humanSize(r.after ?? 0)}`
    );
    for (const d of r.days) {
      log(`      ${isoWeek(d.day)}\\${d.day}  ${String(d.lines).padStart(6)} lines  ${humanSize(d.bytes)}`);
    }
  }

  if (!touched) {
    log('Nothing to archive.');
    return;
  }
  log(`${DRY_RUN ? '[DRY RUN] ' : ''}${totalLines} lines archived, ${humanSize(totalFreed)} freed locally.`);

  // PM2 keeps a file handle with its own write offset. Once the file shrinks,
  // that offset sits past the new end and PM2 pads the gap with NUL bytes.
  // reloadLogs makes it close and reopen every log — the same call logrotate
  // integrations use, and skipping it is what corrupts rotated logs.
  if (!DRY_RUN) {
    try {
      execFileSync('pm2', ['reloadLogs'], { stdio: 'pipe', shell: true });
      log('pm2 reloadLogs — file handles reopened.');
    } catch (err) {
      log(
        `pm2 reloadLogs failed (${err.message.split('\n')[0]}) — logs are archived, ` +
          'but restart the PM2 apps if new lines look corrupt.'
      );
    }
  }
}

main();
