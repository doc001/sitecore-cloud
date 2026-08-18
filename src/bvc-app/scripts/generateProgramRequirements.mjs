#!/usr/bin/env node
/**
 * Generate code-keyed program-requirements output for the Webflow embed.
 *
 * WHY THIS EXISTS
 * ---------------
 * The original embed resolved a program by guessing: it took the URL slug and
 * appended '-diploma', '-certificate', … until something matched a manifest
 * keyed by English slugs. Because '-diploma' was tried first, the certificate
 * page /programs/early-childhood-education-and-development (code ECE) was
 * served the ECED *diploma* dataset — 69 credits instead of 36.
 *
 * The Webflow CMS already carries an unambiguous key: the `code` field
 * (ECE vs ECED, DCSC vs DCSD). This script pivots the data onto that key so
 * the embed can do one exact lookup with no guessing.
 *
 * INPUT
 *   src/data/static/program-requirements/*.json   hand-maintained datasets,
 *                                                 named "{CODE}_-_{Display Name}.json"
 *   src/data/cms/programs.json                    Webflow Programs collection
 *   src/data/cms/program-types.json               program-type GUID → label
 *
 * OUTPUT
 *   src/data/static/program-requirements-by-code/{CODE}.json
 *   src/data/static/program-requirements-index.json
 *
 * The legacy program-requirements-manifest.json and the display-name files are
 * left untouched, so the embed currently pasted into Webflow keeps working
 * until every program has been switched over.
 *
 * USAGE
 *   node scripts/generateProgramRequirements.mjs            # write output + report
 *   node scripts/generateProgramRequirements.mjs --check    # report only, no writes
 *   node scripts/generateProgramRequirements.mjs --strict   # exit 1 on any blocking issue
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, '..');

const SRC_DATA = path.join(APP_ROOT, 'src', 'data', 'static', 'program-requirements');
// Tracked mirror — present on a clean clone even when src/data (gitignored) is not.
const PUBLIC_DATA = path.join(APP_ROOT, 'public', 'data', 'static', 'program-requirements');
let SOURCE_DIR = SRC_DATA;
const CMS_PROGRAMS = path.join(APP_ROOT, 'src', 'data', 'cms', 'programs.json');
const CMS_PROGRAM_TYPES = path.join(APP_ROOT, 'src', 'data', 'cms', 'program-types.json');
const OUT_DIR = path.join(APP_ROOT, 'src', 'data', 'static', 'program-requirements-by-code');
const OUT_INDEX = path.join(APP_ROOT, 'src', 'data', 'static', 'program-requirements-index.json');

const PUBLIC_BASE_PATH = '/data/static/program-requirements-by-code';

const args = new Set(process.argv.slice(2));
const CHECK_ONLY = args.has('--check');
const STRICT = args.has('--strict');

/**
 * CMS code → source filename.
 *
 * Two situations need a manual decision and must not be guessed:
 *   1. The Webflow `code` and the dataset's filename prefix disagree for the
 *      same program (CSD vs CSS, ITSD vs ITSS, JSG vs JS, PNRN-LPN vs PON).
 *   2. Two datasets share a filename prefix (both VOA_… files), so the prefix
 *      alone cannot identify one.
 *
 * Anything not listed here must match on code exactly or it is reported as
 * unresolved — silently falling back to a fuzzy match is how the ECE/ECED bug
 * happened in the first place.
 */
const OVERRIDES = {
  CSD: 'CSS_-_Cybersecurity_Solutions_Diploma.json',
  ITSD: 'ITSS_-_Information_Technology_Solutions_Diploma.json',
  JSG: 'JS_-_Justice_Studies.json',
  'PNRN-LPN': 'PON_-_Perioperative_Nursing.json',
  VOA: 'VOA_-_Veterinary_Assistant__Certificate_.json',
};

const EMBED_MARKER = 'program-requirements';
const CODE_PATTERN = /^[A-Z0-9][A-Z0-9-]{0,23}$/;

const issues = { blocking: [], warning: [], info: [] };
const flag = (level, msg) => issues[level].push(msg);

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

/** Webflow exports vary in shape; find the item array wherever it lives. */
function itemsOf(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.items)) return payload.items;
  const arr = Object.values(payload).find(Array.isArray);
  return arr || [];
}

const fieldsOf = (item) => item.fieldData || item;
const slugOf = (item) => String(item.slug || fieldsOf(item).slug || '').trim().toLowerCase();
const codeOf = (item) => String(fieldsOf(item).code || '').trim().toUpperCase();

/** The credential a dataset's filename claims, used to cross-check program type. */
function credentialFromFilename(filename) {
  const name = filename.toLowerCase();
  if (name.includes('post-diploma')) return 'post-diploma certificate';
  if (name.includes('certificate_of_achievement')) return 'certificate of achievement';
  if (name.includes('diploma')) return 'diploma';
  if (name.includes('certificate')) return 'certificate';
  return null;
}

/**
 * A certificate page must never be handed a diploma dataset (and vice versa).
 * Only the diploma/certificate axis is checked — the other program types
 * (Upgrading, Micro-Credential, …) have no credential word in their filenames.
 */
function credentialConflict(programType, credential) {
  if (!programType || !credential) return false;
  const type = programType.toLowerCase();
  const isDiplomaType = type === 'diploma';
  const isCertType = type === 'certificate';
  if (isDiplomaType && credential.includes('certificate')) return true;
  if (isCertType && credential === 'diploma') return true;
  return false;
}

/**
 * Where the hand-maintained datasets live. coursesDB writes them into
 * src/data/static/program-requirements/, which is gitignored — so on a clean
 * clone (or any machine that has not run the coursesDB cascade) that folder is
 * absent, while the public/ mirror IS tracked and present. Prefer src/ when it
 * exists so a fresh cascade wins, and fall back to public/ rather than throwing
 * mid-build: bvcapp-scripts is &&-chained, so an unguarded readdir here takes
 * the whole build down.
 */
async function resolveSourceDir() {
  for (const dir of [SRC_DATA, PUBLIC_DATA]) {
    try {
      const files = (await fs.readdir(dir)).filter((f) => f.endsWith('.json'));
      if (files.length) {
        if (dir === PUBLIC_DATA) {
          flag('warning', `${path.relative(APP_ROOT, SRC_DATA)} is empty or missing — falling back to the tracked public/ mirror. Run the coursesDB cascade for fresh Kuali data.`);
        }
        return { dir, files };
      }
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }
  }
  return { dir: SRC_DATA, files: [] };
}

async function loadDatasets() {
  const { dir: sourceDir, files } = await resolveSourceDir();
  SOURCE_DIR = sourceDir;

  if (!files.length) {
    flag('blocking', `No program-requirements datasets found in ${path.relative(APP_ROOT, SRC_DATA)} or ${path.relative(APP_ROOT, PUBLIC_DATA)}. Run the coursesDB cascade (update_all.py) to produce them.`);
  }
  const byFile = new Map();
  const byPrefix = new Map();

  for (const file of files) {
    const prefix = file.split('_-_')[0].toUpperCase();
    const data = await readJson(path.join(SOURCE_DIR, file));
    if (!Array.isArray(data.groupings)) {
      flag('warning', `${file}: no "groupings" array — dataset looks malformed, skipped`);
      continue;
    }
    if (data.groupings.length === 0) {
      flag('warning', `${file}: dataset has no terms — any page using it renders an empty accordion`);
    }
    byFile.set(file, data);
    if (!byPrefix.has(prefix)) byPrefix.set(prefix, []);
    byPrefix.get(prefix).push(file);
  }

  for (const [prefix, list] of byPrefix) {
    if (list.length > 1 && !Object.values(OVERRIDES).some((f) => list.includes(f))) {
      flag('blocking', `Filename prefix "${prefix}" is used by ${list.length} datasets (${list.join(', ')}) and no OVERRIDES entry picks one`);
    }
  }

  return { byFile, byPrefix };
}

function resolveDataset(code, byFile, byPrefix) {
  const override = OVERRIDES[code];
  if (override) {
    if (!byFile.has(override)) {
      flag('blocking', `OVERRIDES["${code}"] points at "${override}", which does not exist in ${path.relative(APP_ROOT, SRC_DATA)}`);
      return null;
    }
    return { file: override, via: 'override' };
  }

  const candidates = byPrefix.get(code) || [];
  if (candidates.length === 1) return { file: candidates[0], via: 'code' };
  if (candidates.length > 1) {
    flag('blocking', `Code "${code}" matches ${candidates.length} datasets (${candidates.join(', ')}) — add an OVERRIDES entry`);
  }
  return null;
}

async function emptyDir(dir) {
  await fs.mkdir(dir, { recursive: true });
  for (const entry of await fs.readdir(dir)) {
    if (entry.endsWith('.json')) await fs.unlink(path.join(dir, entry));
  }
}

async function main() {
  const generatedAt = new Date().toISOString();

  const { byFile, byPrefix } = await loadDatasets();
  const programs = itemsOf(await readJson(CMS_PROGRAMS));

  const typeLabels = new Map();
  for (const type of itemsOf(await readJson(CMS_PROGRAM_TYPES))) {
    typeLabels.set(type.id || type._id, String(fieldsOf(type).name || '').trim());
  }

  const byCode = {};
  const bySlug = {};
  const slugOwner = new Map();
  const usedFiles = new Set();
  const payloads = [];

  for (const program of programs) {
    const fields = fieldsOf(program);
    const slug = slugOf(program);
    const code = codeOf(program);
    const name = String(fields.name || program.name || '').trim();
    const programType = typeLabels.get(fields['program-type']) || null;
    const hasEmbed = JSON.stringify(fields).includes(EMBED_MARKER);

    if (!code) {
      if (hasEmbed) flag('blocking', `Program "${slug}" carries the requirements embed but has no CMS code`);
      else flag('info', `Program "${slug}" has no CMS code — skipped`);
      continue;
    }
    if (!CODE_PATTERN.test(code)) {
      flag('blocking', `Program "${slug}" has code "${code}", which is not URL-safe (expected A–Z, 0–9, hyphen)`);
      continue;
    }
    if (byCode[code]) {
      flag('blocking', `Code "${code}" is claimed by both "${byCode[code].slug}" and "${slug}"`);
      continue;
    }

    const match = resolveDataset(code, byFile, byPrefix);
    if (!match) {
      const level = hasEmbed ? 'blocking' : 'info';
      flag(level, `No dataset for code "${code}" (${slug})${hasEmbed ? ' — this page renders the embed and will error' : ''}`);
      continue;
    }

    const credential = credentialFromFilename(match.file);
    if (credentialConflict(programType, credential)) {
      flag('blocking', `"${slug}" is a ${programType} but resolves to a ${credential} dataset (${match.file})`);
    }

    const data = byFile.get(match.file);
    usedFiles.add(match.file);

    byCode[code] = {
      slug,
      name,
      programType,
      credits: data.grandTotalCredits ?? null,
      terms: data.groupings.length,
      source: match.file,
      resolvedBy: match.via,
    };

    if (slugOwner.has(slug)) {
      flag('warning', `Slug "${slug}" is shared by codes ${slugOwner.get(slug)} and ${code} — slug fallback will be disabled for it`);
      delete bySlug[slug];
    } else {
      slugOwner.set(slug, code);
      bySlug[slug] = code;
    }

    payloads.push({
      code,
      body: {
        meta: {
          code,
          slug,
          name,
          programType,
          credential,
          sourceFile: match.file,
          generatedAt,
        },
        sectionLabel: data.sectionLabel ?? 'Program Completion Requirements',
        groupings: data.groupings,
        grandTotalCredits: data.grandTotalCredits ?? null,
      },
    });
  }

  for (const file of byFile.keys()) {
    if (!usedFiles.has(file)) {
      flag('warning', `Dataset "${file}" matches no CMS program — it is unreachable from any page`);
    }
  }

  const index = {
    version: 2,
    generatedAt,
    basePath: PUBLIC_BASE_PATH,
    byCode,
    bySlug,
  };

  if (!CHECK_ONLY) {
    await emptyDir(OUT_DIR);
    for (const { code, body } of payloads) {
      await fs.writeFile(path.join(OUT_DIR, `${code}.json`), JSON.stringify(body, null, 2) + '\n');
    }
    await fs.writeFile(OUT_INDEX, JSON.stringify(index, null, 2) + '\n');
  }

  const verb = CHECK_ONLY ? 'Would write' : 'Wrote';
  console.log(`\n${verb} ${payloads.length} program file(s) → ${path.relative(APP_ROOT, OUT_DIR)}`);
  console.log(`${verb} index with ${Object.keys(byCode).length} code(s), ${Object.keys(bySlug).length} slug fallback(s) → ${path.relative(APP_ROOT, OUT_INDEX)}`);

  for (const [level, label] of [['blocking', '❌ BLOCKING'], ['warning', '⚠️  WARNING'], ['info', 'ℹ️  INFO']]) {
    if (!issues[level].length) continue;
    console.log(`\n${label} (${issues[level].length}):`);
    for (const msg of issues[level]) console.log(`   • ${msg}`);
  }

  if (!issues.blocking.length && !issues.warning.length) console.log('\n✅ No issues.');

  if (STRICT && issues.blocking.length) {
    console.error(`\nFailing because --strict was passed and there are ${issues.blocking.length} blocking issue(s).`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('❌ generateProgramRequirements failed:', err);
  process.exit(1);
});
