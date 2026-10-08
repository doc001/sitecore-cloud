#!/usr/bin/env node
/**
 * Build the Career Advisor's knowledge files from the alis occupation scrape
 * and BVC's program information.
 *
 *   npm run generateCareerAdvisorData
 *
 * Inputs (override with env vars):
 *   CAREER_OCCUPATIONS_JSON   alis scrape        default ~/Desktop/Projects/AlisCareerAdvisor/occupations.json
 *   CAREER_OCCUPATIONS_MD     per-occupation md  default ~/Desktop/Projects/AlisCareerAdvisor/markdown
 *   CAREER_PROGRAMS_MD        Kuali program md   default ~/Desktop/Projects/KualiAdmissions/output/markdown/2026-2027/programs
 *
 * Output: public/data/career-advisor/ (git-ignored)
 *   catalog.json             compact list Claude chooses from on every quiz
 *   occupations/<slug>.md    full profile, fetched by the chat's lookup tool
 *   programs/<slug>.md       full program page, fetched by the chat's lookup tool
 *
 * The catalog carries only what the result cards show, so all 559 occupations
 * fit in one prompt. Copilot Studio searched the full files in chunks and kept
 * missing the wage and certification lines deep in each profile; handing the
 * model every fact up front removes that failure.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const projects = path.join(os.homedir(), 'Desktop', 'Projects');
const OCC_JSON = process.env.CAREER_OCCUPATIONS_JSON ?? path.join(projects, 'AlisCareerAdvisor', 'occupations.json');
const OCC_MD = process.env.CAREER_OCCUPATIONS_MD ?? path.join(projects, 'AlisCareerAdvisor', 'markdown');
const PROG_MD = process.env.CAREER_PROGRAMS_MD ?? path.join(projects, 'KualiAdmissions', 'output', 'markdown', '2026-2027', 'programs');
const OUT = path.join(here, '..', 'public', 'data', 'career-advisor');

for (const [label, p] of [['occupations JSON', OCC_JSON], ['occupation markdown', OCC_MD], ['program markdown', PROG_MD]]) {
  if (!fs.existsSync(p)) {
    console.error(`❌ ${label} not found: ${p}`);
    process.exit(1);
  }
}

// ─── Programs (BVC, current year) ───────────────────────────────────────────

function frontMatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---/);
  const fm = {};
  if (!m) return fm;
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].replace(/^"(.*)"$/, '$1');
  }
  return fm;
}

function sectionText(md, heading) {
  const m = md.match(new RegExp(`## [^\\n]*: ${heading}\\n+([\\s\\S]*?)(?=\\n## |$)`));
  return m ? m[1].trim() : '';
}

const firstSentences = (text, max) => {
  // Markdown list items read as a run-on sentence: "who are: a; b; c"
  const flat = text
    .replace(/\r/g, '')
    .replace(/:\s*\n+\s*[-*]\s+/g, ': ')
    .replace(/\n+\s*[-*]\s+/g, '; ')
    .replace(/\s+/g, ' ')
    .trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  const end = cut.lastIndexOf('. ');
  return end > max / 2 ? cut.slice(0, end + 1) : `${cut.trimEnd()}…`;
};

/** Compare program names across sources: "Social Work" vs "Social Work (Diploma)". */
const normName = (s) =>
  s
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b(diploma|certificate|of achievement|post-diploma|post diploma)\b/g, ' ')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'occupations'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'programs'), { recursive: true });

const programs = [];
for (const file of fs.readdirSync(PROG_MD).filter((f) => f.endsWith('.md'))) {
  const md = fs.readFileSync(path.join(PROG_MD, file), 'utf8').replace(/\r\n/g, '\n');
  const fm = frontMatter(md);
  if (fm.type !== 'program' || fm.isCurrent !== 'true' || !fm.sourceUrl) continue;
  const slug = new URL(fm.sourceUrl).pathname.split('/').filter(Boolean).pop();
  programs.push({
    slug,
    title: fm.title,
    credential: fm.credentialType ? fm.credentialType.replace(/\b\w/g, (c) => c.toUpperCase()) : null,
    academicYear: fm.academicYear || null,
    overview: firstSentences(sectionText(md, 'Overview'), 320),
    url: fm.sourceUrl,
  });
  fs.writeFileSync(path.join(OUT, 'programs', `${slug}.md`), md);
}
programs.sort((a, b) => a.title.localeCompare(b.title));

/** Keeps the credential word, so "Disability Studies Diploma" can't land on the Certificate. */
const exactName = (s) => s.toLowerCase().replace(/[()]/g, ' ').replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').trim();

function matchProgram(alisName) {
  const n = normName(alisName);
  return (
    programs.find((p) => exactName(p.title) === exactName(alisName)) ??
    programs.find((p) => normName(p.title) === n) ??
    programs.find((p) => normName(p.title).includes(n) || n.includes(normName(p.title)))
  );
}

// ─── Occupations ────────────────────────────────────────────────────────────

const occupationsRaw = JSON.parse(fs.readFileSync(OCC_JSON, 'utf8'));
const unmatched = new Set();
const occupations = occupationsRaw.map((o) => {
  const facts = (id) => o.sections?.[id]?.facts ?? {};
  const forecasts = [...new Set((o.job_market ?? []).map((j) => j.forecast).filter(Boolean))];

  // "Related Education" lists schools; take the names under **Bow Valley College**
  const edu = o.sections?.['educational-requirements']?.content ?? '';
  const bvcBlock = edu.split('**Bow Valley College**')[1]?.split(/\n\*\*/)[0] ?? '';
  const bvcPrograms = [...bvcBlock.matchAll(/^- \[([^\]]+)\]/gm)].map((m) => {
    const hit = matchProgram(m[1]);
    if (!hit) unmatched.add(m[1]);
    return hit ? hit.slug : m[1];
  });

  const md = path.join(OCC_MD, `${o.slug}.md`);
  if (fs.existsSync(md)) fs.copyFileSync(md, path.join(OUT, 'occupations', `${o.slug}.md`));

  return {
    slug: o.slug,
    title: o.title,
    description: firstSentences(o.sections?.duties?.content ?? o.summary ?? '', 200),
    outlook: forecasts.length ? forecasts.join(' / ') : null,
    averageWage: facts('wage-salary')['Average Wage'] ?? null,
    minimumEducation: facts('educational-requirements')['Minimum Education'] ?? null,
    certification: facts('certification-requirements').Certification ?? null,
    bvcPrograms: [...new Set(bvcPrograms)],
    url: o.url,
  };
});

const catalog = {
  generatedAt: new Date().toISOString(),
  sources: {
    occupations: 'alis, Government of Alberta (Crown copyright)',
    programs: 'Bow Valley College program information, 2026-2027',
  },
  programs,
  occupations,
};
fs.writeFileSync(path.join(OUT, 'catalog.json'), JSON.stringify(catalog));

const linked = occupations.filter((o) => o.bvcPrograms.length).length;
console.log(`✅ Career Advisor data → ${path.relative(process.cwd(), OUT)}`);
console.log(`   ${occupations.length} occupations (${linked} linked to BVC programs), ${programs.length} programs`);
console.log(`   catalog.json ${(fs.statSync(path.join(OUT, 'catalog.json')).size / 1024).toFixed(0)} KB`);
if (unmatched.size) {
  console.warn(`⚠️  ${unmatched.size} BVC program name(s) on alis with no current program page, kept as plain names:`);
  for (const n of [...unmatched].sort()) console.warn(`   - ${n}`);
}
