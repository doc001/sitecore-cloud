#!/usr/bin/env node
/**
 * Generate /data/static/program-tuition.json for the Program Tuition embed.
 *
 * WHY THIS EXISTS
 * ---------------
 * Program pages used to render tuition from a Webflow CMS collection with one
 * item per program per term, each price typed in by hand as a string. On
 * 2026-09-15 that produced, among others:
 *   - PN missing Term 1 entirely, so its total was one term short;
 *   - PSYN showing four empty International rows over a "$0" total;
 *   - DDAS carrying its non-ETI price ($3,932) marked as the ETI price;
 *   - DD Term 4 typed as "$4.290*" — read back by the summing script as $4.29.
 * The Finance workbook is the actual source, so this reads it directly.
 *
 * INPUT
 *   Annual Tuition (Submitted)v2.xlsx, three sheets:
 *     "Domestic Tuition Non-ETI"   every program
 *     "Domestic Tuition ETI"       the programs that carry an ETI price
 *     "International Tuition"      programs open to international students
 *   src/data/cms/programs.json     Webflow Programs collection (slug → code)
 *
 * OUTPUT
 *   public/data/static/program-tuition.json   TRACKED. The workbook lives on
 *   OneDrive, not in the repo, so nothing in the build can regenerate this —
 *   it is written straight to public/ and committed, and the hourly job ships
 *   it as-is. Re-run this script when Finance updates the workbook.
 *
 * USAGE
 *   node scripts/generateProgramTuition.mjs                 # write + report
 *   node scripts/generateProgramTuition.mjs --check         # report only
 *   node scripts/generateProgramTuition.mjs --file <xlsx>   # another workbook
 *   PROGRAM_TUITION_XLSX=<xlsx> node scripts/generateProgramTuition.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { readXlsx } from './lib/read-xlsx.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, '..');

const DEFAULT_XLSX = 'C:\\Users\\jcueto\\OneDrive - Bow Valley College\\General\\Matrix\\Tuition & Fees_Matrix\\Annual Tuition (Submitted)v2.xlsx';
const CMS_PROGRAMS = [
  path.join(APP_ROOT, 'src', 'data', 'cms', 'programs.json'),
  // Tracked mirror — present on a clean clone even when src/data (gitignored) is not.
  path.join(APP_ROOT, 'public', 'data', 'cms', 'Programs.json'),
];
const OUT_FILE = path.join(APP_ROOT, 'public', 'data', 'static', 'program-tuition.json');

const SHEETS = {
  domestic: 'Domestic Tuition Non-ETI',
  eti: 'Domestic Tuition ETI',
  international: 'International Tuition',
};

/**
 * Workbook code → Webflow `code`, where the two disagree for the same program.
 * The same four pairs are overridden in generateProgramRequirements.mjs.
 *
 * NOT mapped, on purpose, because the match is a guess:
 *   EAP "English for Academic Purposes" / ELL "English Language Learning" —
 *     Webflow's english-for-academic-purposes page carries code ELL, while the
 *     workbook has BOTH codes, with different prices and different names.
 *   ITP "Indigenous Foundational Pathways" — nearest Webflow page is
 *     indigenous-foundational-learning (UPGR-IFL); the names differ.
 * Unmapped pages keep whatever Webflow renders. Add a line here once someone
 * who owns the data confirms the pairing.
 */
const CODE_ALIASES = {
  CSS: 'CSD',
  ITSS: 'ITSD',
  JS: 'JSG',
  PON: 'PNRN-LPN',
};

/**
 * Workbook codes left out of the output even though they match a Webflow code.
 * An exact code match is normally what makes a pairing safe; these are the
 * cases where it is not.
 */
const EXCLUDED_CODES = {
  // Matches the english-for-academic-purposes page (Webflow code ELL) on code,
  // but the workbook's ELL row is "English Language Learning" — international
  // only, $9,423 annual — while "English for Academic Purposes" is its own EAP
  // row at $3,911 / $4,712. Publishing ELL would put the wrong program's price
  // on that page.
  ELL: 'workbook ELL is "English Language Learning"; the ELL page is English for Academic Purposes (workbook EAP)',
};

const args = process.argv.slice(2);
const CHECK_ONLY = args.includes('--check');
const fileArg = args.indexOf('--file');
const XLSX_PATH = (fileArg !== -1 && args[fileArg + 1]) || process.env.PROGRAM_TUITION_XLSX || DEFAULT_XLSX;

const warnings = [];
const warn = (msg) => warnings.push(msg);

const colLetter = (i) => String.fromCharCode(65 + i);
const cents = (n) => Math.round(n * 100) / 100;

/**
 * One sheet → { code: { name, terms: [{ term, amount }], total } }.
 *
 * The layout is located from the header row rather than hardcoded: the row
 * whose column A starts with "Program", term numbers 0–6 across the following
 * columns, and a "… Tuition Total" column. A sheet that does not look like
 * that throws — silently reading the wrong columns would publish wrong prices.
 */
function parseTuitionSheet(sheet) {
  const { cells } = sheet;
  const maxRow = Math.max(...Object.keys(cells).map((ref) => Number(ref.replace(/^[A-Z]+/, ''))));

  let headerRow = 0;
  for (let r = 1; r <= Math.min(maxRow, 10); r++) {
    if (/^program/i.test(String(cells[`A${r}`] ?? '').trim())) { headerRow = r; break; }
  }
  if (!headerRow) throw new Error(`Sheet "${sheet.name}": no header row with "Program" in column A.`);

  const termCols = [];
  let totalCol = null;
  let academicYear = null;
  for (let c = 2; c < 26; c++) {
    const col = colLetter(c);
    const head = cells[`${col}${headerRow}`];
    if (typeof head === 'number' && Number.isInteger(head)) {
      termCols.push({ col, term: head });
    } else if (/tuition total/i.test(String(head ?? ''))) {
      totalCol = col;
      academicYear = (String(head).match(/\d{4}-\d{2}/) || [null])[0];
    }
  }
  if (!termCols.length) throw new Error(`Sheet "${sheet.name}": no numbered term columns in header row ${headerRow}.`);
  if (!totalCol) throw new Error(`Sheet "${sheet.name}": no "Tuition Total" column in header row ${headerRow}.`);

  const programs = {};
  for (let r = headerRow + 1; r <= maxRow; r++) {
    const code = String(cells[`A${r}`] ?? '').trim().toUpperCase();
    if (!code) continue;
    const name = String(cells[`B${r}`] ?? '').trim();

    if (programs[code]) {
      throw new Error(`Sheet "${sheet.name}": program ${code} appears twice (rows ${programs[code].row} and ${r}).`);
    }

    const values = termCols.map(({ col, term }) => {
      const raw = cells[`${col}${r}`];
      if (raw != null && typeof raw !== 'number') {
        throw new Error(`Sheet "${sheet.name}" ${col}${r} (${code} term ${term}): "${raw}" is not a number.`);
      }
      return { term, amount: raw ? cents(raw) : 0 };
    });

    // Blank and 0 both mean "no such term". Term 0 is the annual figure for
    // programs with no term structure (UT, UPGR, OS …).
    const terms = values.filter((v) => v.amount > 0);
    if (!terms.length) {
      warn(`${sheet.name}: ${code} (row ${r}) has no tuition in any term — skipped.`);
      continue;
    }

    const last = terms[terms.length - 1].term;
    const gaps = values.filter((v) => v.term > 0 && v.term < last && v.amount === 0).map((v) => v.term);
    if (gaps.length) warn(`${sheet.name}: ${code} has no tuition for term ${gaps.join(', ')} between priced terms.`);
    if (terms.some((t) => t.term === 0) && terms.some((t) => t.term > 0)) {
      warn(`${sheet.name}: ${code} has both an annual (term 0) figure and per-term figures.`);
    }

    const sum = cents(terms.reduce((acc, t) => acc + t.amount, 0));
    const sheetTotal = cells[`${totalCol}${r}`];
    if (typeof sheetTotal !== 'number') {
      warn(`${sheet.name}: ${code} has no value in the total column — using the sum of its terms (${sum}).`);
    } else if (Math.abs(sheetTotal - sum) > 0.05) {
      warn(`${sheet.name}: ${code} total column says ${cents(sheetTotal)} but its terms sum to ${sum}.`);
    }

    programs[code] = { row: r, name, terms };
  }

  return { programs, academicYear };
}

function loadCmsSlugs() {
  const file = CMS_PROGRAMS.find((f) => fs.existsSync(f));
  if (!file) {
    warn('No Webflow programs.json found — bySlug will be empty; pages must set data-program-code.');
    return {};
  }
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  const items = Array.isArray(raw) ? raw : raw.items || Object.values(raw).find(Array.isArray) || [];
  const bySlug = {};
  for (const item of items) {
    if (item.isArchived) continue;
    const f = item.fieldData || {};
    const code = String(f.code || '').trim().toUpperCase();
    if (f.slug && code) bySlug[f.slug] = code;
  }
  return bySlug;
}

function main() {
  if (!fs.existsSync(XLSX_PATH)) {
    console.error(`❌ Workbook not found: ${XLSX_PATH}\n   Pass --file <path> or set PROGRAM_TUITION_XLSX. Is OneDrive mounted?`);
    process.exit(1);
  }

  const sheets = readXlsx(XLSX_PATH);
  const byName = (name) => {
    const sheet = sheets.find((s) => s.name.trim().toLowerCase() === name.toLowerCase());
    if (!sheet) throw new Error(`Workbook has no sheet named "${name}". Sheets: ${sheets.map((s) => s.name).join(', ')}`);
    return sheet;
  };

  const domestic = parseTuitionSheet(byName(SHEETS.domestic));
  const eti = parseTuitionSheet(byName(SHEETS.eti));
  const international = parseTuitionSheet(byName(SHEETS.international));

  const years = new Set([domestic.academicYear, eti.academicYear, international.academicYear].filter(Boolean));
  if (years.size > 1) throw new Error(`Sheets disagree on the academic year: ${[...years].join(', ')}.`);
  const academicYear = [...years][0] || null;

  // Refuse to write an empty dataset: every page would lose its tuition table.
  if (!Object.keys(domestic.programs).length && !Object.keys(international.programs).length) {
    throw new Error('No programs parsed from the workbook — refusing to write an empty dataset.');
  }

  const toWebflow = (code) => CODE_ALIASES[code] || code;
  const block = (entry, extra) => entry && {
    ...extra,
    terms: entry.terms,
    total: cents(entry.terms.reduce((acc, t) => acc + t.amount, 0)),
  };

  for (const code of Object.keys(eti.programs)) {
    if (!domestic.programs[code]) warn(`${SHEETS.eti}: ${code} has an ETI price but no Non-ETI row.`);
  }

  const codes = new Set([...Object.keys(domestic.programs), ...Object.keys(international.programs)]);
  const programs = {};
  for (const sheetCode of [...codes].sort()) {
    if (EXCLUDED_CODES[sheetCode]) {
      warn(`${sheetCode} excluded: ${EXCLUDED_CODES[sheetCode]}.`);
      continue;
    }
    const d = domestic.programs[sheetCode];
    const e = eti.programs[sheetCode];
    const i = international.programs[sheetCode];
    const code = toWebflow(sheetCode);
    programs[code] = {
      name: (d || e || i).name,
      ...(code !== sheetCode ? { workbookCode: sheetCode } : {}),
      // The ETI price is the one published where a program has one — the
      // same choice the Webflow CMS made, marked there with an asterisk.
      domestic: e ? block(e, { eti: true }) : block(d, { eti: false }) || null,
      international: block(i) || null,
    };
  }

  const cmsSlugs = loadCmsSlugs();
  const bySlug = {};
  const pagesWithoutTuition = [];
  for (const [slug, code] of Object.entries(cmsSlugs).sort()) {
    if (programs[code]) bySlug[slug] = code;
    else pagesWithoutTuition.push(`${code} (${slug})`);
  }
  const pageCodes = new Set(Object.values(cmsSlugs));
  const tuitionWithoutPage = Object.keys(programs).filter((c) => !pageCodes.has(c));

  const output = {
    version: 1,
    academicYear,
    generatedAt: new Date().toISOString(),
    source: path.basename(XLSX_PATH),
    programs,
    bySlug,
  };

  /* ── report ───────────────────────────────────────────────────────── */
  const count = (p, key) => Object.values(programs).filter((x) => x[key]).length;
  console.log(`📄 ${XLSX_PATH}`);
  console.log(`   academic year ${academicYear || '(not found in headers)'}`);
  console.log(`   ${Object.keys(programs).length} programs · ${count(programs, 'domestic')} domestic `
    + `(${Object.values(programs).filter((p) => p.domestic && p.domestic.eti).length} ETI) · ${count(programs, 'international')} international`);
  console.log(`   ${Object.keys(bySlug).length} Webflow program pages resolve by slug`);
  if (pagesWithoutTuition.length) {
    console.log(`\n   Webflow programs with NO tuition in the workbook (page left as Webflow renders it):\n     ${pagesWithoutTuition.join('\n     ')}`);
  }
  if (tuitionWithoutPage.length) {
    console.log(`\n   Workbook programs with no Webflow program page:\n     ${tuitionWithoutPage.join(', ')}`);
  }
  if (warnings.length) console.log(`\n⚠️  ${warnings.length} warning(s):\n   ${warnings.join('\n   ')}`);

  if (CHECK_ONLY) {
    console.log('\n--check: nothing written.');
    return;
  }
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2) + '\n');
  console.log(`\n✅ Wrote ${path.relative(APP_ROOT, OUT_FILE)}`);
}

try {
  main();
} catch (err) {
  console.error(`❌ ${err.message}`);
  process.exit(1);
}
