#!/usr/bin/env node
/**
 * Build the Career Advisor's knowledge files straight from their sources:
 * alis occupation profiles and BVC's current programs from the curriculum system.
 *
 *   npm run generateCareerAdvisorData
 *   npm run generateCareerAdvisorData -- --limit 20   only the first 20 alis profiles, for testing
 *
 * Needs in .env.local:
 *   KUALI_TOKEN      curriculum API token for an account that can view programs and courses
 *   KUALI_BASE_URL   optional, default https://bowvalleycollege.kuali.co
 * alis is public and needs nothing. Program page links come from the Webflow
 * CMS snapshot, src/data/cms/programs.json (npm run getWebflowData).
 *
 * Output: public/data/career-advisor/ (git-ignored)
 *   catalog.json             compact list Claude chooses from on every quiz
 *   occupations/<slug>.md    full profile, fetched by the chat's lookup tool
 *   programs/<slug>.md       full program page, fetched by the chat's lookup tool
 *
 * The catalog carries only what the result cards show, so all ~560 occupations
 * fit in one prompt. Copilot Studio searched the full files in chunks and kept
 * missing the wage and certification lines deep in each profile; handing the
 * model every fact up front removes that failure.
 *
 * This replaces two external dumpers whose output it used to read:
 * AlisCareerAdvisor/scrape_alis.py and KualiAdmissions/KualiProgramDumper. Only
 * what the advisor uses was ported — the current academic year's programs, not
 * every year's programs and course files.
 *
 * Everything is fetched and rendered in memory before the output folder is
 * touched, so a failed run leaves the previous files in place.
 *
 * The curriculum dashboard is private and these files are public: nothing
 * written may mention it (see ensurePublic).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

const here = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.join(here, '..');
dotenv.config({ path: path.join(APP_ROOT, '.env.local'), quiet: true });

const OUT = path.join(APP_ROOT, 'public', 'data', 'career-advisor');
const WEBFLOW_PROGRAMS = path.join(APP_ROOT, 'src', 'data', 'cms', 'programs.json');
const PROGRAM_PAGE_BASE = 'https://www.bowvalleycollege.ca/programs/';

const limitArg = process.argv.indexOf('--limit');
const OCC_LIMIT = limitArg > 0 ? Number(process.argv[limitArg + 1]) : null;

const KUALI_TOKEN = process.env.KUALI_TOKEN?.trim();
const KUALI_BASE = (process.env.KUALI_BASE_URL?.trim() || 'https://bowvalleycollege.kuali.co').replace(/\/+$/, '');
if (!KUALI_TOKEN) {
  console.error('❌ KUALI_TOKEN is not set in .env.local');
  process.exit(1);
}
if (!fs.existsSync(WEBFLOW_PROGRAMS)) {
  console.error(`❌ Webflow programs not found: ${WEBFLOW_PROGRAMS} (run npm run getWebflowData)`);
  process.exit(1);
}

// ─── Shared helpers ─────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** GET with a few retries; alis occasionally drops a request mid-scrape. */
async function get(url, { headers = {}, as = 'text' } = {}) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(5 * 60_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return as === 'json' ? await res.json() : await res.text();
    } catch (err) {
      // 4xx won't fix itself (expired token, missing page)
      if (attempt >= 3 || /HTTP 4\d\d/.test(err.message)) throw new Error(`${url}: ${err.message}`);
      await sleep(attempt * 2000);
    }
  }
}

/** Run fn over items with at most `limit` in flight, keeping order. */
async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

/** Everything written is public and the curriculum dashboard is private, so stop rather than leak it. */
function ensurePublic(file, content) {
  const at = content.toLowerCase().indexOf('kuali');
  if (at >= 0) {
    const context = content.slice(Math.max(0, at - 60), at + 80).replace(/\s+/g, ' ');
    throw new Error(`Output would mention the private dashboard, fix the source text or this script: ${file}\n  ...${context}...`);
  }
  return content;
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

const clean = (s) => s.split(/\s+/).filter(Boolean).join(' ');

/** Decode HTML entities in a run of text. */
const decodeEntities = (s) => (s.includes('&') ? cheerio.load(s, null, false).text() : s);

// ─── Programs: curriculum API, current academic year ────────────────────────

/** Loosely typed curriculum fields: strings or numbers, blank treated as missing. */
function str(obj, name) {
  const v = obj && typeof obj === 'object' ? obj[name] : undefined;
  const s = typeof v === 'string' ? v : typeof v === 'number' ? String(v) : null;
  return s && s.trim() ? s.trim() : null;
}
const obj = (o, name) => (o && typeof o[name] === 'object' && o[name] && !Array.isArray(o[name]) ? o[name] : null);
const date = (o, name) => str(o, name)?.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? null;

/** Rich-text fields with no visible text count as missing. */
const cleanHtml = (html) => (html && html.replace(/<[^>]*>|&nbsp;/g, '').trim() ? html.trim() : null);

function programVersion(rec) {
  const id = str(rec, 'id');
  const pid = str(rec, 'pid');
  const start = date(rec, 'dateStart');
  if (!id || !pid || !start) return null;
  return {
    id,
    pid,
    code: str(rec, 'code'),
    title: str(rec, 'title') ?? '',
    credentialType: str(rec, 'crdType'),
    parchmentTitle: str(rec, 'parchmentTitle'),
    description: str(rec, 'description'),
    admission: {
      academic: cleanHtml(str(rec, 'academicRequirement')),
      nonAcademic: cleanHtml(str(rec, 'nonAcademicRequirements')),
      other: cleanHtml(str(rec, 'otherRequirements')),
      englishProficiency: cleanHtml(str(rec, 'englishProficiencyRequirements')),
    },
    admissionEquivalencies: cleanHtml(str(rec, 'admissionEquivalencyRichText')),
    // outcomes are a one-column table: [{"0": "outcome text"}, ...]
    learningOutcomes: (Array.isArray(rec.outcomesMappingTable) ? rec.outcomesMappingTable : []).map((row) => str(row, '0')).filter(Boolean),
    // newer versions use programCompletionRequirements, some older ones credentialCompletionRequirements (same shape)
    requirements: ['programCompletionRequirements', 'credentialCompletionRequirements'].map((f) => obj(rec, f)).filter(Boolean),
    // some imported versions have no requirement tree, just a flat list of course pids
    listedCoursePids: (Array.isArray(rec.ccRequirementsForCredential) ? rec.ccRequirementsForCredential : []).filter((p) => typeof p === 'string' && p.trim()),
    start,
    end: date(rec, 'dateEnd'),
    startLabel: str(rec, 'dateStartLabel'),
    endLabel: str(rec, 'dateEndLabel'),
  };
}

function courseVersion(rec, subjects) {
  const id = str(rec, 'id');
  const pid = str(rec, 'pid');
  const start = date(rec, 'dateStart');
  if (!id || !pid || !start) return null;
  // newer courses store the subject as an id, older imports as the name
  let subject = str(rec, 'subjectCodeName');
  const s = subjects.get(str(rec, 'subjectCode'));
  if (s) subject = s.code;
  const number = str(rec, 'number');
  const credits = obj(rec, 'credits');
  return {
    id,
    pid,
    // older imported courses use the code itself as their pid, so that's a safe fallback
    code: subject && number ? subject + number : pid,
    title: str(rec, 'title') ?? '',
    description: str(rec, 'description'),
    credits:
      str(credits, 'chosen') === 'range'
        ? `${str(obj(credits, 'credits'), 'min')}-${str(obj(credits, 'credits'), 'max')}`
        : str(credits, 'value'),
    start,
    end: date(rec, 'dateEnd'),
  };
}

/** Versions by pid, oldest first; within a pid the date ranges don't overlap. */
function groupByPid(versions) {
  const map = new Map();
  for (const v of versions) {
    if (!map.has(v.pid)) map.set(v.pid, []);
    map.get(v.pid).push(v);
  }
  for (const list of map.values()) list.sort((a, b) => a.start.localeCompare(b.start));
  return map;
}

/** Latest-starting version in effect on the given date (YYYY-MM-DD). */
const versionAt = (versions, day) => versions.findLast((v) => v.start <= day && (!v.end || day <= v.end)) ?? null;

/**
 * Requirement trees: {groupings: [{label, rules: {rules, logic, groups}}]} or {rules: {...}}.
 * A grouping is usually a term ("Year One - Term One"); its rules are lettered A, B, …
 * and combined by logic ("All of A, B").
 */
function parseRequirements(reqs, resolveCourse) {
  const groups = [];
  if (Array.isArray(reqs.groupings)) {
    for (const g of reqs.groupings) {
      if (g?.inactive === true) continue;
      const group = parseRuleSet(g?.rules, resolveCourse);
      group.label = str(g, 'label');
      if (group.rules.length || group.groups.length) groups.push(group);
    }
  } else if (reqs.rules) {
    const group = parseRuleSet(reqs.rules, resolveCourse);
    if (group.rules.length || group.groups.length) groups.push(group);
  }
  return groups;
}

function parseRuleSet(ruleSet, resolveCourse) {
  const group = { label: null, logic: null, rules: [], groups: [] };
  if (!ruleSet || typeof ruleSet !== 'object' || Array.isArray(ruleSet)) return group;
  group.logic = str(ruleSet, 'logic');
  for (const r of Array.isArray(ruleSet.rules) ? ruleSet.rules : []) {
    const data = obj(r, 'data') ?? {};
    const courses = (Array.isArray(data.courses) ? data.courses : [])
      .filter((c) => typeof c === 'string' && c.trim())
      .map(resolveCourse)
      .filter(Boolean);
    const grade = obj(data, 'grade') ? str(data.grade, 'grade') : str(data, 'grade');
    // plain-english wording; an unknown rule type shows its raw key so it's noticed and added here
    const type = str(r, 'key') ?? 'unknown';
    const description =
      {
        completedCourses: 'Complete all of the following courses',
        completednumberOfCourses: `Complete ${str(data, 'number')} of the following courses`,
        earnedCreditsCourses: `Earn ${str(data, 'credits')} credits from the following courses`,
        earnedGradeCourses: `Earn a minimum grade of ${grade} in the following courses`,
        placementCourses: 'Complete the following placement courses',
        earnedNumberCreditsOfType: `Earn ${str(data, 'number')} credits of: ${str(data, 'types')}`,
        freeFormText: str(data, 'text') ?? '',
      }[type] ?? type;
    group.rules.push({ id: str(r, 'alpha'), description, courses });
  }
  for (const n of Array.isArray(ruleSet.groups) ? ruleSet.groups : []) {
    group.groups.push(parseRuleSet(obj(n, 'rules') ?? n, resolveCourse));
  }
  return group;
}

const allCourses = (groups) => groups.flatMap((g) => [...g.rules.flatMap((r) => r.courses), ...allCourses(g.groups)]);

/**
 * Rich text is simple html: p, br, ul/ol/li, strong/em/u, a, h1-h6, and the odd table
 * (e.g. english test scores as "test | score" rows, written here as "- test: score").
 */
function richTextToMarkdown(html) {
  let md = '';
  const lists = [];
  const links = [];
  let cellsInRow = 0;
  for (const m of html.matchAll(/<(\/?)([a-zA-Z0-9]+)([^>]*)>|[^<]+/g)) {
    if (!m[2]) {
      md += decodeEntities(m[0]).replace(/\s+/g, ' ');
      continue;
    }
    const closing = m[1] === '/';
    const tag = m[2].toLowerCase();
    switch (tag) {
      case 'p':
      case 'div':
      case 'table':
        md += '\n\n';
        break;
      case 'br':
        md += '\n';
        break;
      case 'ul':
      case 'ol':
        if (closing) lists.pop();
        else lists.push({ ordered: tag === 'ol', count: 0 });
        md += lists.length ? '\n' : '\n\n';
        break;
      case 'li': {
        if (closing) break;
        if (!lists.length) lists.push({ ordered: false, count: 0 });
        const list = lists[lists.length - 1];
        list.count++;
        md += `\n${' '.repeat((lists.length - 1) * 2)}${list.ordered ? `${list.count}. ` : '- '}`;
        break;
      }
      case 'strong':
      case 'b':
      case 'u':
        md += '**';
        break;
      case 'em':
      case 'i':
        md += '*';
        break;
      case 'a':
        if (!closing) {
          const href = m[3].match(/href\s*=\s*["']([^"']+)["']/)?.[1] ?? null;
          links.push(href);
          if (href) md += '[';
        } else {
          const target = links.pop();
          if (target) md += `](${target})`;
        }
        break;
      case 'tr':
        if (!closing) {
          md += '\n- ';
          cellsInRow = 0;
        }
        break;
      case 'td':
      case 'th':
        if (!closing && cellsInRow++ > 0) md = `${md.trimEnd()}: `;
        break;
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        // bold rather than a heading so it can't break the file's own heading structure
        md += closing ? '**\n\n' : '\n\n**';
        break;
    }
  }
  let text = md
    .replace(/ /g, ' ')
    .split('\n')
    // trim stray spaces around line breaks without touching list indentation
    .map((l) => l.replace(/^( *(?:- |\d+\. )?) +/, '$1').trimEnd())
    .join('\n');
  text = text.replace(/\n{3,}/g, '\n\n');
  // tighten lists: no blank lines between consecutive items
  text = text.replace(/\n\n(?=( *)(- |\d+\. ))/g, '\n');
  return text.trim();
}

/** camelCase option keys to words, e.g. postDiplomaCertificate -> Post diploma certificate */
const humanize = (key) =>
  ({ cetificateOfAchievement: 'Certificate of achievement', competencyBasedCbe: 'Competency based (CBE)' })[key] ?? // typo is in the source data
  ((s) => s.charAt(0).toUpperCase() + s.slice(1))(key.replace(/(?<=[a-z])(?=[A-Z])/g, ' ').toLowerCase());

const creditsText = (c) => (c == null ? 'credits not listed' : c === '1' ? '1 credit' : `${c} credits`);
const firstSentence = (text) => (text.match(/^[\s\S]*?[.!?](?=\s|$)/)?.[0] ?? text).trim();
const yaml = (v) => `"${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

/**
 * Every section heading repeats the program name and year, so a chunk split off
 * the file still says what it is about.
 */
function programMarkdown(p, academicYear, period, courseByCode) {
  const tag = `${p.title} (${academicYear})`;
  const lines = ['---', 'type: program', `code: ${yaml(p.code)}`, `title: ${yaml(p.title)}`, `academicYear: ${yaml(academicYear)}`, 'isCurrent: true'];
  if (p.credentialType) lines.push(`credentialType: ${yaml(p.credentialType)}`);
  lines.push(`sourceUrl: ${yaml(p.url)}`, '---', '');
  lines.push(`# ${tag}`, '');
  lines.push(`This is the current version of this program, for the ${academicYear} academic year (${period}).`, '');
  if (p.credentialType) lines.push(`- Credential: ${humanize(p.credentialType)}`);
  if (p.parchmentTitle) lines.push(`- Parchment title: ${p.parchmentTitle}`);
  lines.push(`- This version is in effect: ${p.startLabel ?? '?'} - ${p.endLabel ?? 'Present'}`);
  lines.push(`- Program page: ${p.url}`, '');

  const section = (heading, body) => lines.push(`## ${tag}: ${heading}`, '', body.trim(), '');

  if (p.description) section('Overview', p.description);

  const admission = [
    ['Academic Requirements', p.admission.academic],
    ['Non-Academic Requirements', p.admission.nonAcademic],
    ['Other Requirements', p.admission.other],
    ['English Language Proficiency', p.admission.englishProficiency],
  ]
    .filter(([, html]) => html)
    .map(([label, html]) => `### ${label}\n\n${richTextToMarkdown(html)}`);
  if (admission.length) section('Admission Requirements', admission.join('\n\n'));

  if (p.admissionEquivalencies) section('Admission Equivalencies', richTextToMarkdown(p.admissionEquivalencies));

  if (p.learningOutcomes.length) {
    section('Learning Outcomes', p.learningOutcomes.map((o) => `- ${o.replace(/^\s*\d+[.)]\s*/, '')}`).join('\n'));
  }

  const req = [];
  const writeGroup = (g, level) => {
    if (g.label) req.push(`${'#'.repeat(Math.min(level, 6))} ${g.label}`, '');
    // "All of A" is implied when there is a single rule
    if (g.logic && g.rules.length > 1) req.push(`Requirement: ${g.logic}`, '');
    for (const r of g.rules) {
      const id = r.id && g.rules.length > 1 ? `**${r.id}.** ` : '';
      req.push(`${id}${r.description}${r.courses.length ? ':' : ''}`);
      for (const c of r.courses) req.push(`- ${c.code} - ${c.title} (${creditsText(c.credits)})`);
      req.push('');
    }
    for (const n of g.groups) writeGroup(n, level + 1);
  };
  for (const g of p.groups) writeGroup(g, 3);
  section('Program Requirements', req.length ? req.join('\n') : 'No course requirements are listed for this year.');

  if (p.courseCodes.length) {
    section(
      'Courses',
      p.courseCodes
        .map((code) => {
          const c = courseByCode.get(code);
          if (!c) return `- ${code}`;
          return `- **${c.code} - ${c.title}** (${creditsText(c.credits)})${c.description ? `: ${firstSentence(c.description)}` : ''}`;
        })
        .join('\n'),
    );
  }
  return `${lines.join('\n').trimEnd()}\n`;
}

/**
 * Curriculum codes that differ from the Webflow CMS code for the same program
 * (the same pairs generateProgramRequirements.mjs maps).
 */
const WEBFLOW_CODE = { CSS: 'CSD', ITSS: 'ITSD', JS: 'JSG', PON: 'PNRN-LPN' };
/**
 * Same code, different program: Webflow's ELL is the English for Academic
 * Purposes page, the curriculum's ELL is English Language Learning.
 */
const NO_WEBFLOW_PAGE = new Set(['ELL']);

/** Program code -> live page slug, from the Webflow CMS. Archived items 404 on the site. */
function webflowSlugsByCode() {
  const payload = JSON.parse(fs.readFileSync(WEBFLOW_PROGRAMS, 'utf8'));
  const items = Array.isArray(payload) ? payload : (payload.items ?? Object.values(payload).find(Array.isArray) ?? []);
  const map = new Map();
  for (const item of items) {
    const f = item.fieldData ?? item;
    const code = String(f.code ?? '').trim().toUpperCase();
    if (code && f.slug && !item.isArchived) map.set(code, f.slug);
  }
  return map;
}

async function fetchPrograms() {
  const headers = { Authorization: `Bearer ${KUALI_TOKEN}` };
  console.log('Fetching programs, courses and subject codes...');
  // queryAll returns full records, so no per-item calls are needed
  const [programRecs, courseRecs, subjectRecs] = await Promise.all([
    get(`${KUALI_BASE}/api/cm/programs/queryAll?status=active`, { headers, as: 'json' }).then((b) => b.res),
    get(`${KUALI_BASE}/api/cm/courses/queryAll?status=active`, { headers, as: 'json' }).then((b) => b.res),
    get(`${KUALI_BASE}/api/cm/options/types/subjectcodes`, { headers, as: 'json' }),
  ]);
  const subjects = new Map(subjectRecs.map((s) => [str(s, 'id'), { code: str(s, 'name') ?? '' }]));
  const courseVersions = groupByPid(courseRecs.map((r) => courseVersion(r, subjects)).filter(Boolean));
  const programVersions = groupByPid(programRecs.map(programVersion).filter(Boolean));

  // older versions sometimes lack a code; borrow the latest one from the same program
  for (const versions of programVersions.values()) {
    const fallback = versions.findLast((v) => v.code)?.code ?? null;
    for (const v of versions) v.code ??= fallback;
  }

  // academic year Y runs Fall Y to Spring Y+1 and becomes current on September 1.
  // Oct 1 is just after every fall start and well before spring end dates
  const today = new Date();
  const year = today.getMonth() >= 8 ? today.getFullYear() : today.getFullYear() - 1;
  const academicYear = `${year}-${year + 1}`;
  const period = `Fall ${year} - Spring ${year + 1}`;
  const asOf = `${year}-10-01`;

  const slugs = webflowSlugsByCode();
  const programs = [];
  const withoutPage = [];
  let nearest = 0;
  for (const versions of programVersions.values()) {
    const v = versionAt(versions, asOf);
    if (!v?.code) continue;
    const wfCode = WEBFLOW_CODE[v.code] ?? v.code;
    const slug = NO_WEBFLOW_PAGE.has(v.code) ? null : slugs.get(wfCode.toUpperCase());
    if (!slug) {
      withoutPage.push(`${v.code} ${v.title}`);
      continue;
    }

    // requirements point at course pids; resolve each to the version in effect this year
    const resolveCourse = (pid) => {
      const cv = courseVersions.get(pid);
      if (!cv) return null;
      let match = versionAt(cv, asOf);
      if (!match) {
        // no version covers this year: the latest one before it, else the earliest after
        match = cv.findLast((c) => c.start <= asOf) ?? cv[0];
        nearest++;
      }
      return match;
    };
    let groups = v.requirements.flatMap((r) => parseRequirements(r, resolveCourse));
    if (!groups.length && v.listedCoursePids.length) {
      const listed = v.listedCoursePids.map(resolveCourse).filter(Boolean);
      if (listed.length) {
        groups = [{ label: null, logic: null, groups: [], rules: [{ id: null, description: 'Complete the following courses', courses: listed }] }];
      }
    }
    const courses = allCourses(groups);
    programs.push({ ...v, slug, url: PROGRAM_PAGE_BASE + slug, groups, courses, courseCodes: [...new Set(courses.map((c) => c.code))] });
  }

  const seen = new Map();
  for (const p of programs) {
    if (seen.has(p.slug)) throw new Error(`Programs ${seen.get(p.slug)} and ${p.code} both map to page "${p.slug}"`);
    seen.set(p.slug, p.code);
  }

  const courseByCode = new Map(programs.flatMap((p) => p.courses).map((c) => [c.code, c]));
  for (const p of programs) p.markdown = programMarkdown(p, academicYear, period, courseByCode);
  programs.sort((a, b) => a.title.localeCompare(b.title));

  console.log(`  ${academicYear}: ${programs.length} programs with a page`);
  if (nearest) console.log(`  ${nearest} course references had no version in effect this year; used the nearest version`);
  if (withoutPage.length) {
    console.log(`  ${withoutPage.length} current program(s) with no live Webflow page, left out:`);
    for (const p of withoutPage.sort()) console.log(`   - ${p}`);
  }
  return { programs, academicYear };
}

// ─── Occupations: alis ──────────────────────────────────────────────────────

const ALIS = 'https://alis.alberta.ca';
const ALIS_HEADERS = { 'User-Agent': 'career-advisor-research/0.1 (non-commercial)' };
const PROFILE_RE = /<loc>(https:\/\/alis\.alberta\.ca\/occinfo\/occupations-in-alberta\/occupation-profiles\/[^/<]+\/)<\/loc>/g;
const SECTIONS = [
  'known-as', 'duties', 'working-conditions', 'traits-skills',
  'educational-requirements', 'certification-requirements',
  'employment-advancement', 'wage-salary', 'related-high-school-subjects',
  'related-post-secondary-field-of-study', 'other-sources-of-information',
];
const alisGet = (url) => get(url, { headers: ALIS_HEADERS });

const BLOCK_TAGS = new Set([
  'p', 'div', 'section', 'article', 'header', 'footer', 'aside', 'nav', 'main', 'figure', 'figcaption',
  'ul', 'ol', 'table', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'dl', 'dt', 'dd', 'form', 'fieldset',
]);

/**
 * HTML to Markdown for alis profile sections (stands in for python's markdownify):
 * ATX headings, "-" bullets, links kept, images dropped, tables as pipe tables.
 * Indentation is written as \u0001 so whitespace cleanup can't eat it.
 */
function htmlToMarkdown($, root) {
  const inline = (nodes) => nodes.map(render).join('');
  const block = (s) => `\n\n${s.trim()}\n\n`;

  function render(node) {
    // * and _ in text would otherwise read as emphasis or a bullet ("* All wages are hourly")
    if (node.type === 'text') return node.data.replace(/\s+/g, ' ').replace(/[*_]/g, '\\$&');
    if (node.type !== 'tag') return '';
    const tag = node.name;
    const kids = node.children ?? [];
    if (/^h[1-6]$/.test(tag)) return block(`${'#'.repeat(Number(tag[1]))} ${clean(inline(kids))}`);
    switch (tag) {
      case 'br':
        return '\n';
      case 'hr':
        return block('---');
      case 'img':
        return '';
      case 'strong':
      case 'b':
      case 'em':
      case 'i': {
        const mark = tag === 'strong' || tag === 'b' ? '**' : '*';
        const text = inline(kids);
        if (!text.trim()) return text;
        const [, lead, body, trail] = text.match(/^(\s*)([\s\S]*?)(\s*)$/);
        return `${lead}${mark}${body}${mark}${trail}`;
      }
      case 'a': {
        const text = inline(kids).trim();
        const href = $(node).attr('href');
        if (!href || !text) return text;
        const title = $(node).attr('title');
        return title ? `[${text}](${href} "${title.replace(/"/g, '\\"')}")` : `[${text}](${href})`;
      }
      case 'ul':
      case 'ol': {
        let n = 0;
        const items = kids
          .filter((k) => k.type === 'tag' && k.name === 'li')
          .map((li) => {
            const marker = tag === 'ol' ? `${++n}. ` : '- ';
            const body = inline(li.children ?? []).trim().replace(/\n{2,}/g, '\n');
            return marker + body.replace(/\n/g, `\n${'\u0001'.repeat(marker.length)}`);
          });
        return block(items.join('\n'));
      }
      case 'table': {
        const trs = $(node).find('tr').toArray().filter((tr) => $(tr).children('th,td').length);
        if (!trs.length) return '';
        const rows = trs.map((tr) => $(tr).children('th,td').toArray().map((c) => clean(inline(c.children ?? [])).replace(/\|/g, '\\|')));
        const width = Math.max(...rows.map((r) => r.length));
        const line = (r) => `| ${[...r, ...Array(width - r.length).fill('')].join(' | ')} |`;
        // a table without header cells gets an empty header row rather than promoting its first data row
        const head = $(trs[0]).children('th').length ? rows.shift() : [];
        return block([line(head), `|${' --- |'.repeat(width)}`, ...rows.map(line)].join('\n'));
      }
      case 'blockquote':
        return block(
          inline(kids)
            .trim()
            .replace(/\n{3,}/g, '\n\n')
            .split('\n')
            .map((l) => `> ${l.trim()}`.trimEnd())
            .join('\n'),
        );
      default:
        return BLOCK_TAGS.has(tag) ? block(inline(kids)) : inline(kids);
    }
  }

  return inline(root.children ?? [])
    .split('\n')
    .map((l) => l.trim().replace(/\u0001/g, ' '))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Split an accordion section into title, updated date, stat facts, and Markdown body. */
function parseSection($, el) {
  const label = el.find('.content-accordion-title-label').first().length
    ? el.find('.content-accordion-title-label').first()
    : el.find('.content-box-header .label').first();
  const title = label.length ? clean(label.text()) : el.attr('id');
  const info = el.find('.content-accordion-info').first();
  const content = el.find('.content-accordion-content').first();
  const body = content.length ? content : el;
  label.remove();

  const facts = {};
  body.find('.stat').each((_, s) => {
    const stat = $(s);
    // Key is a <span> in stat lists, a .title div in wage quick-stats ("Average Wage $42.21 Per Hour")
    const key = stat.find('.title').first().length ? stat.find('.title').first() : stat.find('span').first();
    if (!key.length) return;
    const k = clean(key.text());
    key.remove();
    facts[k] = clean(stat.text());
    stat.remove();
  });

  // Drop page furniture: stat boxes (now in facts), charts that duplicate tables, mobile
  // duplicates, chart/table toggles, NOC tab buttons, and promo cards
  body
    .find(
      '.content-box-stat-list, script, style, button, .icon, canvas, select, .no-print, .mobile-only, ' +
        '.for-mobile, .for-overflow, .content-box-nav, .content-side-module',
    )
    .remove();
  // Nested accordions (e.g. "Related Education") become sub-headings
  body.find('.content-accordion-title-label').each((_, sub) => {
    sub.name = 'h4';
  });
  body.find('a[href]').each((_, a) => {
    const href = $(a).attr('href').trim();
    // site-relative links made absolute; spaces encoded so the Markdown link survives
    $(a).attr('href', (/^[a-z][a-z0-9+.-]*:/i.test(href) ? href : new URL(href, ALIS).href).replace(/ /g, '%20'));
  });

  let md = htmlToMarkdown($, body.get(0));
  // Chart and table versions share a heading + caption; drop the repeated pair
  const kept = [];
  const blocks = md.split('\n\n');
  for (let i = 0; i < blocks.length; ) {
    if (kept.length >= 2 && kept.at(-2) === blocks[i] && kept.at(-1) === blocks[i + 1]) {
      i += 2;
      continue;
    }
    kept.push(blocks[i++]);
  }
  md = kept.join('\n\n');

  return {
    title,
    updated: info.length ? clean(info.text()).replace('Updated ', '') : null,
    facts,
    content: md,
  };
}

/** The Occupations in Demand list, by profile slug. Entries are per NOC group, so one profile can have several. */
async function scrapeDemand() {
  const bySlug = new Map();
  let offset = 0;
  let total = null;
  while (total === null || offset < total) {
    const $ = cheerio.load(await alisGet(`${ALIS}/alis-dynamics/indemand-occupations-listing/?offset=${offset}`));
    total ??= Number($('[data-endless-scroll-records]').attr('data-endless-scroll-records'));
    const items = $('.content-in-demand').toArray();
    if (!items.length) break;
    for (const it of items) {
      const item = $(it);
      const employed = item.find('.employed').first().text();
      const entry = {
        forecast: clean(item.find('.demand').first().text()).replace(' Job Market', ''),
        noc_group: clean(item.find('.title').first().text()),
        noc_code: clean(item.find('.noc').first().text()).replace('NOC ', ''),
        employed_in_ab: /\d/.test(employed) ? Number(employed.replace(/\D/g, '')) : null,
      };
      item.find('.related-occupations a[href]').each((_, a) => {
        const slug = $(a).attr('href').replace(/\/+$/, '').split('/').pop();
        if (!bySlug.has(slug)) bySlug.set(slug, []);
        bySlug.get(slug).push(entry);
      });
    }
    offset += items.length;
  }
  console.log(`  ${offset} of ${total} in-demand NOC groups`);
  return bySlug;
}

async function scrapeProfile(url) {
  const $ = cheerio.load(await alisGet(url));
  const h1 = $('h1').first();
  const data = {
    slug: url.replace(/\/+$/, '').split('/').pop(),
    url,
    title: h1.length ? clean(h1.text()) : null,
    summary: $('meta[name="description"]').attr('content') ?? null,
    sections: {},
  };
  const noc = $('#noc-codes');
  if (noc.length) data.noc_codes = [...new Set(noc.text().match(/\b\d{5}\b/g) ?? [])].sort();
  const related = $('#related-occupational-profiles').attr('data-url');
  data.related_occupations = related
    ? [...new Set([...(await alisGet(ALIS + related)).matchAll(/occupation-profiles\/([^/"]+)\//g)].map((m) => m[1]))].sort()
    : [];
  for (const id of SECTIONS) {
    // parseSection modifies the tree, so it runs last
    const el = $(`[id="${id}"]`).first();
    if (el.length) data.sections[id] = parseSection($, el);
  }
  return data;
}

function occupationMarkdown(o, titles) {
  const sections = Object.values(o.sections);
  const facts = Object.assign({}, ...sections.map((s) => s.facts));
  const front = {
    title: o.title,
    slug: o.slug,
    source_url: o.url,
    noc_codes: o.noc_codes ?? [],
    minimum_education: facts['Minimum Education'] ?? null,
    forecast: [...new Set(o.job_market.map((j) => j.forecast))].sort(),
    related_occupations: o.related_occupations,
  };
  const lines = ['---'];
  for (const [k, v] of Object.entries(front)) {
    if (v === null || (Array.isArray(v) && !v.length)) continue;
    // JSON scalars/lists are valid YAML
    lines.push(`${k}: ${Array.isArray(v) ? `[${v.map((x) => JSON.stringify(x)).join(', ')}]` : JSON.stringify(v)}`);
  }
  lines.push('---', '', `# ${o.title}`, '');
  if (o.summary) lines.push(`> ${o.summary}`, '');
  if (o.job_market.length) {
    lines.push(
      '## Job Market Outlook', '',
      '3-year forecast from the Alberta Short-Term Employment Forecast. Figures cover the whole NOC group, not only this occupation.', '',
      '| NOC group | NOC code | Forecast | Employed in Alberta |',
      '|---|---|---|---|',
    );
    for (const j of o.job_market) {
      const employed = j.employed_in_ab === null ? 'n/a' : j.employed_in_ab.toLocaleString('en-US');
      lines.push(`| ${j.noc_group} | ${j.noc_code} | ${j.forecast} | ${employed} |`);
    }
    lines.push('');
  }
  for (const s of sections) {
    lines.push(`## ${s.title}`, '');
    if (s.updated) lines.push(`_Updated ${s.updated}_`, '');
    for (const [k, v] of Object.entries(s.facts)) lines.push(`- **${k}:** ${v}`);
    if (Object.keys(s.facts).length) lines.push('');
    if (s.content) lines.push(s.content, '');
  }
  if (o.related_occupations.length) {
    lines.push('## Related Occupations', '');
    for (const r of o.related_occupations) lines.push(`- [${titles.get(r) ?? r}](${r}.md)`);
    lines.push('');
  }
  lines.push(
    '---', '',
    `Source: © ${new Date().getFullYear()} Government of Alberta. Reproduced with permission from [alis](${o.url}). Non-commercial use only.`, '',
  );
  return lines.join('\n');
}

async function fetchOccupations() {
  console.log('Fetching alis occupation profiles...');
  const urls = [...new Set([...(await alisGet(`${ALIS}/xmlsitemap/content/`)).matchAll(PROFILE_RE)].map((m) => m[1]))].sort();
  const demand = await scrapeDemand();
  const wanted = OCC_LIMIT ? urls.slice(0, OCC_LIMIT) : urls;
  const failed = [];
  let done = 0;
  const results = await mapLimit(wanted, 6, async (url) => {
    try {
      const data = await scrapeProfile(url);
      data.job_market = demand.get(data.slug) ?? [];
      if (++done % 50 === 0) console.log(`  ${done}/${wanted.length}`);
      return data;
    } catch (err) {
      failed.push(`${url}: ${err.message}`);
      return null;
    }
  });
  const occupations = results.filter(Boolean);
  console.log(`  ${occupations.length} of ${urls.length} profiles`);
  // a few dropped profiles are survivable; a gutted catalog is not worth publishing
  if (failed.length) {
    console.warn(`⚠️  ${failed.length} profile(s) failed:`);
    for (const f of failed) console.warn(`   - ${f}`);
    if (failed.length > Math.max(5, wanted.length * 0.02)) throw new Error('Too many alis profiles failed; previous output left in place');
  }
  return occupations;
}

// ─── Build ──────────────────────────────────────────────────────────────────

const [{ programs, academicYear }, occupationsRaw] = await Promise.all([fetchPrograms(), fetchOccupations()]);

/** Compare program names across sources: "Social Work" vs "Social Work (Diploma)". */
const normName = (s) =>
  s
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b(diploma|certificate|of achievement|post-diploma|post diploma)\b/g, ' ')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

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

const titles = new Map(occupationsRaw.map((o) => [o.slug, o.title]));
const unmatched = new Set();
const occupations = occupationsRaw.map((o) => {
  const facts = (id) => o.sections?.[id]?.facts ?? {};
  const forecasts = [...new Set(o.job_market.map((j) => j.forecast).filter(Boolean))];

  // "Related Education" lists schools; take the names under **Bow Valley College**
  const edu = o.sections?.['educational-requirements']?.content ?? '';
  const bvcBlock = edu.split('**Bow Valley College**')[1]?.split(/\n\*\*/)[0] ?? '';
  const bvcPrograms = [...bvcBlock.matchAll(/^- \[([^\]]+)\]/gm)].map((m) => {
    const hit = matchProgram(m[1]);
    if (!hit) unmatched.add(m[1]);
    return hit ? hit.slug : m[1];
  });

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
    markdown: occupationMarkdown(o, titles),
  };
});

const catalog = {
  generatedAt: new Date().toISOString(),
  sources: {
    occupations: 'alis, Government of Alberta (Crown copyright)',
    programs: `Bow Valley College program information, ${academicYear}`,
  },
  programs: programs.map((p) => ({
    slug: p.slug,
    title: p.title,
    credential: p.credentialType ? humanize(p.credentialType) : null,
    academicYear,
    overview: firstSentences(p.description ?? '', 320),
    url: p.url,
  })),
  occupations: occupations.map(({ markdown, ...o }) => o),
};

// Everything is in memory and checked before the old output is removed
const files = [
  ['catalog.json', JSON.stringify(catalog)],
  ...programs.map((p) => [`programs/${p.slug}.md`, p.markdown]),
  ...occupations.map((o) => [`occupations/${o.slug}.md`, o.markdown]),
];
for (const [file, content] of files) ensurePublic(file, content);

// Empty the folder rather than delete it: Windows refuses to remove a folder that
// a shell or Explorer window has open, even though its contents can go
fs.mkdirSync(OUT, { recursive: true });
for (const entry of fs.readdirSync(OUT)) fs.rmSync(path.join(OUT, entry), { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'occupations'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'programs'), { recursive: true });
for (const [file, content] of files) fs.writeFileSync(path.join(OUT, file), content);

const linked = occupations.filter((o) => o.bvcPrograms.length).length;
console.log(`✅ Career Advisor data → ${path.relative(process.cwd(), OUT)}`);
console.log(`   ${occupations.length} occupations (${linked} linked to BVC programs), ${programs.length} programs`);
console.log(`   catalog.json ${(fs.statSync(path.join(OUT, 'catalog.json')).size / 1024).toFixed(0)} KB`);
if (unmatched.size) {
  console.warn(`⚠️  ${unmatched.size} BVC program name(s) on alis with no current program page, kept as plain names:`);
  for (const n of [...unmatched].sort()) console.warn(`   - ${n}`);
}
