#!/usr/bin/env node
/**
 * Rename course-outline PDFs to ASCII-safe filenames, and rewrite every
 * generated/hand-maintained URL that points at them.
 *
 * WHY THIS EXISTS
 * ---------------
 * Vercel's static host 404s any file whose name contains a non-ASCII byte.
 * Verified against production: an ASCII name with spaces and parentheses
 * serves 200, while the same file carrying U+00A0 / U+2013 / U+2019 in its
 * name 404s no matter how the URL is percent-encoded. The file uploads fine
 * and sits in .vercel/output/static — it simply cannot be addressed.
 *
 * The upstream DB export re-emits those characters on every run (Word-style
 * smart punctuation in course titles), so this is not a one-time cleanup:
 * it runs as part of the data pipeline, BEFORE the generators read the
 * directory to resolve `pdfFilename`.
 *
 * The program-requirements datasets are hand-maintained JSON with the outline
 * URL typed in, so renaming the file alone would leave those links pointing at
 * a name that no longer exists. Both ends move together here.
 *
 * USAGE
 *   node scripts/sanitize-outline-filenames.mjs --dry-run   # report, touch nothing
 *   node scripts/sanitize-outline-filenames.mjs             # rename + rewrite
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PDF_DIR = path.join(APP_ROOT, 'public', 'data', 'course-outlines-pdf');

// Directories whose JSON may carry an outline URL. src/data is gitignored and
// absent on a clean clone; public/data is the tracked mirror. Both are rewritten
// when present so a local tree and a fresh checkout end up identical.
const JSON_DIRS = [
  'public/data/static/program-requirements',
  'public/data/static/program-requirements-by-code',
  'src/data/static/program-requirements',
  'src/data/static/program-requirements-by-code',
].map((p) => path.join(APP_ROOT, p));

// Stale build artefacts. A full pipeline run wipes .vercel/output and repackages
// from out/, but a leftover out/ from an earlier build would carry the old names
// forward, so the old file is dropped from both.
const ARTEFACT_DIRS = [
  path.join(APP_ROOT, 'out', 'data', 'course-outlines-pdf'),
  path.join(APP_ROOT, '.vercel', 'output', 'static', 'data', 'course-outlines-pdf'),
];

const DRY_RUN = process.argv.includes('--dry-run');

/**
 * Map the punctuation the export actually produces onto its ASCII equivalent,
 * then drop anything still non-ASCII rather than guessing at it — an
 * unrecognised character must not survive into a filename that will 404.
 */
const REPLACEMENTS = [
  [/ /g, ' '],  // no-break space
  [/[–—]/g, '-'],  // en dash, em dash
  [/[‘’]/g, "'"],  // curly single quotes
  [/[“”]/g, '"'],  // curly double quotes
  [/…/g, '...'],  // ellipsis
];

export function sanitize(name) {
  // Only names carrying a non-ASCII byte are touched. A plain-ASCII name is
  // already addressable however odd it looks — SODV1400 ships a double space
  // and serves 200 — and renaming it would churn files for no gain.
  if (!/[^ -~]/.test(name)) return name;
  let out = name;
  for (const [pattern, replacement] of REPLACEMENTS) out = out.replace(pattern, replacement);
  // Fold accents to their base letter before stripping, so a French course
  // title degrades to "Cafe" rather than "Caf". NFD splits e-acute into "e"
  // plus a combining accent; the accent then falls in the range removed below.
  out = out.normalize('NFD').replace(/[̀-ͯ]/g, '');
  // Anything still outside printable ASCII is dropped rather than guessed at,
  // then runs of spaces collapsed so a removed character leaves no double space.
  out = out.replace(/[^\x20-\x7e]/g, '').replace(/ {2,}/g, ' ');
  return out;
}

function main() {
  if (!fs.existsSync(PDF_DIR)) {
    console.log('No course-outlines-pdf directory — nothing to sanitize.');
    return;
  }

  const files = fs.readdirSync(PDF_DIR).filter((f) => /\.pdf$/i.test(f));
  const existing = new Set(files);
  const renames = [];

  for (const file of files) {
    const clean = sanitize(file);
    if (clean === file) continue;
    if (existing.has(clean)) {
      // Never overwrite a real file. The ASCII twin is the one already being
      // served, so leaving the odd-named duplicate in place is harmless.
      console.warn(`SKIP (target exists): ${clean}`);
      continue;
    }
    renames.push([file, clean]);
    existing.add(clean);
  }

  console.log(`${files.length} outline PDFs, ${renames.length} need renaming.`);

  if (!renames.length) return;

  for (const [from, to] of renames) {
    if (DRY_RUN) {
      console.log(`  would rename: ${from}\n             -> ${to}`);
      continue;
    }
    fs.renameSync(path.join(PDF_DIR, from), path.join(PDF_DIR, to));
    // Drop the stale copy from any packaged output so it cannot be re-uploaded.
    for (const dir of ARTEFACT_DIRS) {
      const stale = path.join(dir, from);
      if (fs.existsSync(stale)) fs.rmSync(stale, { force: true });
    }
  }
  if (!DRY_RUN) console.log(`Renamed ${renames.length} file(s).`);

  // Rewrite URLs. Matching is done on the raw and the percent-encoded form,
  // since a hand-typed URL may carry either.
  let filesChanged = 0;
  let urlsChanged = 0;
  for (const dir of JSON_DIRS) {
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
      const file = path.join(dir, name);
      const before = fs.readFileSync(file, 'utf8');
      let after = before;
      for (const [from, to] of renames) {
        const forms = [from, encodeURIComponent(from), encodeURI(from)];
        for (const form of new Set(forms)) {
          if (!after.includes(form)) continue;
          after = after.split(form).join(form === from ? to : encodeURI(to).replace(/%20/g, ' '));
          urlsChanged++;
        }
      }
      if (after === before) continue;
      filesChanged++;
      if (!DRY_RUN) fs.writeFileSync(file, after, 'utf8');
    }
  }
  console.log(
    `${DRY_RUN ? 'Would rewrite' : 'Rewrote'} ${urlsChanged} URL(s) across ${filesChanged} JSON file(s).`
  );
}

// Only act when run as a script. Importing this module (the tests import
// sanitize()) must never rename anything.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
