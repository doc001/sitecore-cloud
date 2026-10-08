// lib/careerAdvisor/agent.ts
/**
 * Career Advisor client — calls Claude (Anthropic API) directly from the browser.
 *
 * Knowledge lives in public/data/career-advisor/ (npm run generateCareerAdvisorData):
 *   catalog.json            every occupation's card facts + every current program
 *   occupations/<slug>.md   full alis profile — read by the chat's lookup tool
 *   programs/<slug>.md      full program page — read by the chat's lookup tool
 *
 * Quiz: Claude returns only WHICH occupations and programs fit, by slug, with a
 * "why it fits" line each (structured output, so it always parses). Titles,
 * wages, outlooks, certification and links are then filled in from the catalog
 * here — the model can neither misquote a wage nor invent a URL.
 * Chat: plain text, with tools to read a full profile or program page.
 */
import Anthropic from '@anthropic-ai/sdk';
import { QUIZ_SCHEMA, SYSTEM_PROMPT } from './prompt';

const API_KEY = (process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY ?? '').trim();

export const isAgentConfigured = (): boolean => API_KEY !== '';

const MODEL = 'claude-sonnet-5-5';
const DATA_BASE = '/data/career-advisor';
/** Tool round-trips allowed per chat question before giving up. */
const MAX_TOOL_ROUNDS = 6;

export class AgentError extends Error {
  constructor(message: string, readonly kind: 'config' | 'network' | 'refusal' | 'format') {
    super(message);
    this.name = 'AgentError';
  }
}

// ─── Result types (what the page renders) ─────────────────────────────────────

export interface AdvisorOccupation {
  title: string;
  description: string | null;
  whyItFits: string | null;
  outlook: string | null;
  averageWage: string | null;
  minimumEducation: string | null;
  certification: string | null;
  programs: string[];
  url: string | null;
}

export interface AdvisorProgram {
  title: string;
  credential: string | null;
  description: string | null;
  whyItFits: string | null;
  occupations: string[];
  url: string | null;
}

/**
 * Content for a downloadable admission checklist (see checklistPdf.ts). The
 * model writes the sections; the title, credential, year and link are filled
 * in from the catalog so the header can't be wrong.
 */
export interface AdmissionChecklist {
  programTitle: string;
  credential: string | null;
  academicYear: string | null;
  programUrl: string | null;
  intro: string;
  sections: { heading: string; note: string; items: { text: string; options: string[] }[] }[];
  nextSteps: string[];
}

/** One chat answer: the text, plus any checklist the model made for download. */
export interface ChatReply {
  text: string;
  checklists: AdmissionChecklist[];
}

export interface AdvisorResult {
  occupations: AdvisorOccupation[];
  programs: AdvisorProgram[];
  message: string | null;
}

// ─── Catalog ──────────────────────────────────────────────────────────────────

interface CatalogOccupation {
  slug: string;
  title: string;
  description: string;
  outlook: string | null;
  averageWage: string | null;
  minimumEducation: string | null;
  certification: string | null;
  /** program slugs, or a plain name for a BVC offering with no program page */
  bvcPrograms: string[];
  url: string;
}

interface CatalogProgram {
  slug: string;
  title: string;
  credential: string | null;
  academicYear: string | null;
  overview: string;
  url: string;
}

interface Catalog {
  occupations: CatalogOccupation[];
  programs: CatalogProgram[];
}

let catalogPromise: Promise<Catalog> | null = null;

function loadCatalog(): Promise<Catalog> {
  catalogPromise ??= fetch(`${DATA_BASE}/catalog.json`).then(async (res) => {
    if (!res.ok) {
      catalogPromise = null;
      throw new AgentError(
        `Career Advisor data missing (${res.status}). Run "npm run generateCareerAdvisorData" in src/bvc-app.`,
        'config'
      );
    }
    return res.json();
  });
  return catalogPromise;
}

/**
 * The catalog goes into the system prompt as its own cached block. It's ~75K
 * tokens and identical on every request, so after the first call it is read
 * from the prompt cache instead of billed in full.
 */
function systemBlocks(catalog: Catalog): Anthropic.Beta.BetaTextBlockParam[] {
  const compact = {
    occupations: catalog.occupations.map(({ slug, title, description, outlook, averageWage, minimumEducation, certification, bvcPrograms }) => ({
      slug, title, description, outlook, averageWage, minimumEducation, certification, bvcPrograms,
    })),
    programs: catalog.programs.map(({ slug, title, credential, overview }) => ({ slug, title, credential, overview })),
  };
  return [
    { type: 'text', text: SYSTEM_PROMPT },
    { type: 'text', text: `<catalog>\n${JSON.stringify(compact)}\n</catalog>`, cache_control: { type: 'ephemeral' } },
  ];
}

// ─── Parsing a pasted result (dev console hook) ───────────────────────────────

/** Links are only ever rendered to the two sources the advisor draws on. */
const TRUSTED_HOSTS = ['bowvalleycollege.ca', 'alis.alberta.ca'];

export function trustedUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:') return null;
    const host = url.hostname.toLowerCase();
    return TRUSTED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`)) ? url.toString() : null;
  } catch {
    return null;
  }
}

const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null);
const strList = (v: unknown): string[] =>
  Array.isArray(v) ? v.map(str).filter((s): s is string => s !== null) : [];

/**
 * Read a full AdvisorResult from pasted text (careerAdvisor.showResult in the
 * dev console). Tolerates text around the JSON and smart quotes from copy-paste.
 * Returns null when there is no usable object; never throws.
 */
export function parseAdvisorResult(text: string): AdvisorResult | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  const body = text.slice(start, end + 1);

  let raw: unknown;
  try {
    raw = JSON.parse(body);
  } catch {
    try {
      raw = JSON.parse(body.replace(/[“”]/g, '"'));
    } catch {
      return null;
    }
  }
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (!Array.isArray(o.occupations) && !Array.isArray(o.programs) && typeof o.message !== 'string') return null;

  const objects = (v: unknown) =>
    (Array.isArray(v) ? v : []).filter((x): x is Record<string, unknown> => !!x && typeof x === 'object');

  return {
    occupations: objects(o.occupations)
      .map((x) => ({
        title: str(x.title) ?? '',
        description: str(x.description),
        whyItFits: str(x.whyItFits),
        outlook: str(x.outlook),
        averageWage: str(x.averageWage),
        minimumEducation: str(x.minimumEducation),
        certification: str(x.certification),
        programs: strList(x.programs),
        url: trustedUrl(x.url),
      }))
      .filter((x) => x.title !== ''),
    programs: objects(o.programs)
      .map((x) => ({
        title: str(x.title) ?? '',
        credential: str(x.credential),
        description: str(x.description),
        whyItFits: str(x.whyItFits),
        occupations: strList(x.occupations),
        url: trustedUrl(x.url),
      }))
      .filter((x) => x.title !== ''),
    message: str(o.message),
  };
}

// ─── Quiz picks → renderable result ───────────────────────────────────────────

interface QuizPicks {
  occupations: { slug: string; whyItFits: string; programs: string[] }[];
  programs: { slug: string; whyItFits: string }[];
  message: string | null;
}

/**
 * Turn Claude's picks into cards using catalog facts. Unknown slugs are
 * dropped, and an occupation only links to programs alis actually lists for it.
 */
function buildResult(picks: QuizPicks, catalog: Catalog): AdvisorResult {
  const occBySlug = new Map(catalog.occupations.map((o) => [o.slug, o]));
  const progBySlug = new Map(catalog.programs.map((p) => [p.slug, p]));

  const chosenOcc = picks.occupations
    .map((pick) => ({ pick, occ: occBySlug.get(pick.slug) }))
    .filter((x): x is { pick: QuizPicks['occupations'][number]; occ: CatalogOccupation } => !!x.occ)
    .slice(0, 5);
  const chosenProg = picks.programs
    .map((pick) => ({ pick, prog: progBySlug.get(pick.slug) }))
    .filter((x): x is { pick: QuizPicks['programs'][number]; prog: CatalogProgram } => !!x.prog)
    .slice(0, 5);
  const shownProgramSlugs = new Set(chosenProg.map((x) => x.prog.slug));

  const occupations: AdvisorOccupation[] = chosenOcc.map(({ pick, occ }) => ({
    title: occ.title,
    description: occ.description || null,
    whyItFits: str(pick.whyItFits),
    outlook: occ.outlook,
    averageWage: occ.averageWage,
    minimumEducation: occ.minimumEducation,
    certification: occ.certification,
    programs: occ.bvcPrograms
      .filter((slug) => shownProgramSlugs.has(slug))
      .map((slug) => progBySlug.get(slug)!.title),
    url: trustedUrl(occ.url),
  }));

  const programs: AdvisorProgram[] = chosenProg.map(({ pick, prog }) => ({
    title: prog.title,
    credential: prog.credential,
    description: prog.overview || null,
    whyItFits: str(pick.whyItFits),
    occupations: chosenOcc.filter(({ occ }) => occ.bvcPrograms.includes(prog.slug)).map(({ occ }) => occ.title),
    url: trustedUrl(prog.url),
  }));

  return { occupations, programs, message: str(picks.message) };
}

// ─── Chat tools ───────────────────────────────────────────────────────────────

const TOOLS: Anthropic.Beta.BetaTool[] = [
  {
    name: 'get_occupation_profile',
    description:
      "Read an occupation's full alis profile: duties, working conditions, traits and skills, education, certification, wages by industry, employment and advancement, related occupations, and schools. Use it whenever a question needs more than the catalog line.",
    input_schema: {
      type: 'object',
      properties: { slug: { type: 'string', description: 'occupation slug from the catalog' } },
      required: ['slug'],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: 'get_program_page',
    description:
      "Read a BVC program's full page for 2026-2027: overview, admission requirements, English language proficiency, admission equivalencies, learning outcomes, and courses. Use it for any admission or program-content question.",
    input_schema: {
      type: 'object',
      properties: { slug: { type: 'string', description: 'program slug from the catalog' } },
      required: ['slug'],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: 'create_admission_checklist',
    description:
      "Make a downloadable PDF checklist of everything a person needs to do to get into one BVC program. Use it when someone asks for a checklist, a to-do list, or something they can print or save about getting in. Read the program page with get_program_page first, in the same turn, and build the checklist from it. Quote every requirement exactly as written; never round or reword scores, grades, or course names. Use one section per area the program lists: academic requirements, English language proficiency (note that it applies only if English isn't the person's first language), other ways to meet the academic requirements (admission equivalencies, plus Upgrading if they're missing courses), and any other requirements such as a portfolio, interview, or checks. When a requirement can be met in more than one way, make it ONE item whose text says to complete one of the options, with each path in options; otherwise leave options empty. Skip areas the program doesn't list. The person sees a download button under your reply, so afterwards just tell them it's ready in a sentence or two instead of repeating the list.",
    input_schema: {
      type: 'object',
      properties: {
        program: { type: 'string', description: 'program slug from the catalog' },
        intro: { type: 'string', description: 'one friendly sentence at the top of the PDF, or an empty string' },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              heading: { type: 'string', description: 'for example "Academic requirements"' },
              note: { type: 'string', description: 'a short note under the heading, or an empty string' },
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    text: { type: 'string', description: 'the requirement, quoted exactly' },
                    options: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'each alternative path when the person must complete ONE of several; otherwise []',
                    },
                  },
                  required: ['text', 'options'],
                  additionalProperties: false,
                },
              },
            },
            required: ['heading', 'note', 'items'],
            additionalProperties: false,
          },
        },
        nextSteps: {
          type: 'array',
          items: { type: 'string' },
          description: 'short actions after the requirements, like gathering transcripts or applying on the program page',
        },
      },
      required: ['program', 'intro', 'sections', 'nextSteps'],
      additionalProperties: false,
    },
    strict: true,
  },
];

/** Validate the model's checklist and fill the header from the catalog. */
function makeChecklist(input: unknown, catalog: Catalog): AdmissionChecklist | null {
  const o = (input ?? {}) as Record<string, unknown>;
  const program = catalog.programs.find((p) => p.slug === o.program);
  if (!program) return null;
  const sections = (Array.isArray(o.sections) ? o.sections : [])
    .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
    .map((sec) => ({
      heading: str(sec.heading) ?? '',
      note: str(sec.note) ?? '',
      items: (Array.isArray(sec.items) ? sec.items : [])
        .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
        .map((it) => ({ text: str(it.text) ?? '', options: strList(it.options) }))
        .filter((it) => it.text !== ''),
    }))
    .filter((sec) => sec.heading !== '' && sec.items.length > 0);
  if (!sections.length) return null;
  return {
    programTitle: program.title,
    credential: program.credential,
    academicYear: program.academicYear,
    programUrl: trustedUrl(program.url),
    intro: str(o.intro) ?? '',
    sections,
    nextSteps: strList(o.nextSteps),
  };
}

async function runTool(name: string, input: unknown, catalog: Catalog): Promise<{ content: string; isError: boolean }> {
  const slug = typeof (input as { slug?: unknown })?.slug === 'string' ? (input as { slug: string }).slug : '';
  const known =
    name === 'get_occupation_profile'
      ? catalog.occupations.some((o) => o.slug === slug)
      : name === 'get_program_page'
        ? catalog.programs.some((p) => p.slug === slug)
        : false;
  // Slug is model output: only ever fetch a file the catalog names
  if (!known) return { content: `No ${name === 'get_program_page' ? 'program' : 'occupation'} with slug "${slug}".`, isError: true };

  const dir = name === 'get_program_page' ? 'programs' : 'occupations';
  const res = await fetch(`${DATA_BASE}/${dir}/${encodeURIComponent(slug)}.md`);
  if (!res.ok) return { content: `Could not load "${slug}" (${res.status}).`, isError: true };
  return { content: await res.text(), isError: false };
}

// ─── Conversation ─────────────────────────────────────────────────────────────

function textOf(content: Anthropic.Beta.BetaContentBlock[]): string {
  return content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();
}

function checkStop(message: Anthropic.Beta.BetaMessage) {
  if (message.stop_reason === 'refusal') {
    throw new AgentError(`Request declined (${message.stop_details?.category ?? 'no category'})`, 'refusal');
  }
}

export class AdvisorConversation {
  /** Append-only history, so the conversation keeps its prompt cache. */
  private readonly messages: Anthropic.Beta.BetaMessageParam[] = [];

  private constructor(
    private readonly client: Anthropic,
    private readonly catalog: Catalog
  ) {}

  static async start(): Promise<AdvisorConversation> {
    if (!isAgentConfigured()) throw new AgentError('Career Advisor is not configured', 'config');
    const catalog = await loadCatalog();
    // dangerouslyAllowBrowser: the key is visible to anyone using this page.
    // Temporary — see the warning at the top of this file.
    const client = new Anthropic({ apiKey: API_KEY, dangerouslyAllowBrowser: true });
    return new AdvisorConversation(client, catalog);
  }

  private async call(extra: Partial<Anthropic.Beta.MessageCreateParamsNonStreaming>) {
    try {
      return await this.client.beta.messages.create({
        model: MODEL,
        max_tokens: 16000,
        system: systemBlocks(this.catalog),
        messages: this.messages,
        output_config: { effort: 'medium' },
        // On a safety decline, re-run on Anthropic's recommended fallback model
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        ...extra,
      });
    } catch (err) {
      if (err instanceof Anthropic.AuthenticationError) {
        throw new AgentError('Anthropic API key was rejected — check NEXT_PUBLIC_ANTHROPIC_API_KEY', 'config');
      }
      if (err instanceof Anthropic.APIError) {
        throw new AgentError(`Anthropic API error ${err.status ?? ''}: ${err.message}`, 'network');
      }
      throw new AgentError(`Could not reach the Anthropic API: ${(err as Error).message}`, 'network');
    }
  }

  /** Quiz mode: structured picks, rendered with catalog facts. */
  async askQuiz(payload: unknown): Promise<AdvisorResult> {
    this.messages.push({
      role: 'user',
      content: `Here are my career quiz results. Pick the careers and BVC programs that fit me.\n\n${JSON.stringify(payload, null, 2)}`,
    });
    const response = await this.call({
      output_config: { effort: 'medium', format: { type: 'json_schema', schema: QUIZ_SCHEMA } },
    });
    checkStop(response);
    this.messages.push({ role: 'assistant', content: response.content });

    let picks: QuizPicks;
    try {
      picks = JSON.parse(textOf(response.content));
    } catch {
      throw new AgentError(`Quiz reply did not parse (stop_reason ${response.stop_reason})`, 'format');
    }
    return buildResult(picks, this.catalog);
  }

  /** Chat mode: plain text, reading full profiles or program pages, and making checklists, as needed. */
  async askChat(text: string): Promise<ChatReply> {
    this.messages.push({ role: 'user', content: text });
    const checklists: AdmissionChecklist[] = [];

    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      const response = await this.call({ tools: TOOLS });
      checkStop(response);
      this.messages.push({ role: 'assistant', content: response.content });

      if (response.stop_reason !== 'tool_use') {
        const reply = textOf(response.content);
        if (!reply && !checklists.length) throw new AgentError(`Empty reply (stop_reason ${response.stop_reason})`, 'format');
        return { text: reply || 'Your checklist is ready to download.', checklists };
      }

      // Run every requested lookup and return all results in ONE user message
      const calls = response.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === 'tool_use');
      const results = await Promise.all(
        calls.map(async (call) => {
          if (call.name === 'create_admission_checklist') {
            const checklist = makeChecklist(call.input, this.catalog);
            if (checklist) checklists.push(checklist);
            return {
              type: 'tool_result' as const,
              tool_use_id: call.id,
              content: checklist
                ? `Checklist PDF ready for ${checklist.programTitle}. The person now sees a download button under your reply.`
                : 'Could not make the checklist: unknown program slug, or no sections with requirements.',
              is_error: !checklist,
            };
          }
          const { content, isError } = await runTool(call.name, call.input, this.catalog);
          return { type: 'tool_result' as const, tool_use_id: call.id, content, is_error: isError };
        })
      );
      this.messages.push({ role: 'user', content: results });
    }
    throw new AgentError('Too many lookups for one question', 'format');
  }
}
