/**
 * Resolve the course-outline PDF for a SIS id.
 *
 * WHY THIS EXISTS
 * ---------------
 * Two scripts resolved outlines independently and disagreed about what a
 * filename looks like. The export has emitted two naming generations:
 *
 *   ACCT1103_Introduction to Financial Accounting_Fall 2023_Current.pdf     (older)
 *   ACCT1103_Introduction to Financial Accounting_(Fall 2023_Current).pdf   (current)
 *
 * generateOpenStudiesPublicJson matched only the bare form, buildOpenStudiesByArea
 * only the parenthesised one. Measured across all 1,196 SIS ids holding an outline:
 * 100 had ONLY a parenthesised current outline and so got no download link at all,
 * and 217 more had a bare outline that was OLDER than the parenthesised one and so
 * linked a stale term — JUST1101 served Winter 2025 while Fall 2026 sat unused.
 *
 * Both callers now come here, so a third naming generation is one fix, not three.
 */

const TERM_RANK = { Winter: 0, Spring: 1, Summer: 2, Fall: 3 };

// Both generations, captured the same way. The term range is "start_end", where
// end is either a term or the literal "Current".
//   _(Fall 2023_Current).pdf   _Fall 2023_Current.pdf
//   _(Fall 2020_Spring 2024).pdf
const RANGE = /_\(?([A-Za-z]+)\s+(\d{4})_(?:([A-Za-z]+)\s+(\d{4})|(Current))\)?\.pdf$/i;

function season(name) {
  if (!name) return 0;
  const key = name[0].toUpperCase() + name.slice(1).toLowerCase();
  return TERM_RANK[key] ?? 0;
}

/** Sortable rank for a term; 0 when the filename does not carry one. */
function termRank(year, name) {
  return year ? parseInt(year, 10) * 10 + season(name) : 0;
}

/**
 * Parse a filename into what it takes to order outlines.
 * `current` is the flag the old resolvers keyed on, but ordering must not rely
 * on it alone — several courses carry more than one "_Current" file.
 */
export function parseOutline(filename) {
  const m = filename.match(RANGE);
  if (!m) return { current: false, start: 0, end: 0, parenthesised: false };
  const [, startSeason, startYear, endSeason, endYear, current] = m;
  return {
    current: Boolean(current),
    start: termRank(startYear, startSeason),
    // A "Current" outline has no end term; rank it above every dated range so
    // the fallback ordering stays sane when currents and non-currents mix.
    end: current ? Number.MAX_SAFE_INTEGER : termRank(endYear, endSeason),
    parenthesised: filename.includes('_('),
  };
}

/**
 * Newest first. Ties are broken toward the parenthesised name because that is
 * what the export writes today — the two forms are byte-identical twins where
 * both exist, so the tie-break only needs to be stable.
 */
function byRecency(a, b) {
  return (
    b.meta.end - a.meta.end ||
    b.meta.start - a.meta.start ||
    Number(b.meta.parenthesised) - Number(a.meta.parenthesised) ||
    a.file.localeCompare(b.file)
  );
}

/**
 * @param {string} sisId        course code, e.g. "JUST1101"
 * @param {string[]} files      filenames in public/data/course-outlines-pdf
 * @param {object} [options]
 * @param {boolean} [options.fallbackToLatest=false]
 *        When no "_Current" outline exists, return the most recent superseded
 *        one instead of null. Off by default: an outline explicitly retired by
 *        the registrar should not be presented as this course's outline.
 * @returns {string|null}
 */
export function resolveOutlinePdf(sisId, files, options = {}) {
  if (!sisId) return null;
  const { fallbackToLatest = false } = options;

  const prefix = `${sisId.toUpperCase()}_`;
  const candidates = files
    .filter((f) => f.toUpperCase().startsWith(prefix))
    .map((file) => ({ file, meta: parseOutline(file) }));
  if (!candidates.length) return null;

  const current = candidates.filter((c) => c.meta.current);
  if (current.length) return current.sort(byRecency)[0].file;

  return fallbackToLatest ? candidates.sort(byRecency)[0].file : null;
}
