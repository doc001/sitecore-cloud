/**
 * generate-os-valid-courses.mjs
 * ─────────────────────────────────────────────────────────────
 * SCRIPT B (Credit Courses / "OS") — Allow-list generator
 *
 * Walks /sitecore/content/BVC/BVC/Data/SisData/Credit Courses and
 * produces a flat list of SIS IDs for courses that have at least
 * one child item (i.e. at least one section).
 *
 * Output: src/data/osValidCourses.json
 *
 * Consumers of this file:
 *   1. extract-os-course-data.mjs  → uses it as the input list
 *                                    for full data extraction
 *   2. The Credit Courses listing-page generator
 *      → uses it to render the "all available courses" page
 * ─────────────────────────────────────────────────────────────
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GraphQLClient, gql } from 'graphql-request';
import { writeFileSync, mkdirSync } from 'fs';

// ─────────────────────────────────────────────
// Paths — resolved relative to THIS script's location,
// not the current working directory.
// ─────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');         // bvc-app/
const DATA_DIR = path.join(PROJECT_ROOT, 'src', 'data');    // bvc-app/src/data
const ENV_PATH = path.join(PROJECT_ROOT, '.env.local');     // bvc-app/.env.local

dotenv.config({ path: ENV_PATH });

// ─────────────────────────────────────────────
// GraphQL client
// ─────────────────────────────────────────────
const client = new GraphQLClient(process.env.SITECORE_GRAPHQL_ENDPOINT, {
  headers: { sc_apikey: process.env.SC_APIKEY },
});

// ─────────────────────────────────────────────
// Query: paginate course roots
// Fetches sisID + a single child to confirm the course
// has at least one section, without paying for a full
// child traversal.
// ─────────────────────────────────────────────
const GET_ALL_COURSE_ROOTS = gql`
  query GetCourseSisIds($after: String) {
    courseRoot: item(
      path: "/sitecore/content/BVC/BVC/Data/SisData/Credit Courses"
      language: "en"
    ) {
      children(first: 20, after: $after) {
        results {
          sisID: field(name: "sisID") { value }
          children(first: 1) {
            results { id }
          }
        }
        pageInfo {
          hasNext
          endCursor
        }
      }
    }
  }
`;

// Single source of truth for the output path.
// Exported so downstream scripts can import it.
export const OS_VALID_COURSES_PATH = path.join(DATA_DIR, 'osValidCourses.json');

async function run() {
  if (!process.env.SITECORE_GRAPHQL_ENDPOINT) throw new Error('SITECORE_GRAPHQL_ENDPOINT missing');
  if (!process.env.SC_APIKEY) throw new Error('SC_APIKEY missing');

  let after = null;
  let hasNext = true;
  const validCourses = [];
  // Distinguishes "the tree is gone" from "the tree is there but every course
  // lost its sections" — two different upstream faults needing two different
  // people, and the guard below reports whichever it was.
  let rootResolved = false;

  // Paginate through every course root
  while (hasNext) {
    const data = await client.request(GET_ALL_COURSE_ROOTS, { after });
    if (data?.courseRoot) rootResolved = true;
    const children = data?.courseRoot?.children;
    if (!children?.results) break;

    for (const item of children.results) {
      const hasChildren = item?.children?.results?.length > 0;
      const sisID = item?.sisID?.value;
      // Only include courses that (a) have a sisID and
      // (b) have at least one child section worth building.
      if (sisID && hasChildren) {
        validCourses.push(sisID);
      }
    }

    after = children.pageInfo?.endCursor ?? null;
    hasNext = children.pageInfo?.hasNext ?? false;
  }

  // ─────────────────────────────────────────────
  // Empty-result guard — refuse to publish an empty catalogue.
  //
  // Zero is never a legitimate answer here: Open Studies has carried 61
  // courses for as long as this script has run, and they do not all get
  // withdrawn in the same hour. An empty result means Sitecore ANSWERED but
  // had nothing to say — a sync fault, an unpublished tree, or an API key
  // that resolves to an empty scope.
  //
  // Writing [] is indistinguishable from "every course was withdrawn", and
  // every downstream script obeys it faithfully: extract-os-course-data
  // writes 0 files, generateOpenStudiesPublicJson writes an index with no
  // categories, and buildOpenStudiesByArea marks all 104 courses
  // unavailable. Every one of them exits 0, so the pipeline reports success.
  //
  // That is exactly what happened from 2026-09-09 to 2026-09-14: 98
  // consecutive hourly runs published an empty Open Studies catalogue and
  // not one of them raised an alert.
  //
  // So: do not write, and exit non-zero. `hourly-scripts` is an && -chain, so
  // nothing downstream runs; pipeline.mjs turns the non-zero exit into a
  // "Course Data Refresh FAILED" alert and SKIPS the deploy, leaving the
  // published catalogue exactly as it is. Same principle as
  // buildExtendedEducationCourses.mjs refusing to write an empty
  // availability list.
  // ─────────────────────────────────────────────
  if (validCourses.length === 0) {
    const cause = rootResolved
      ? 'The Credit Courses tree resolved, but no course under it has a single section.'
      : 'Sitecore returned no item at all for the Credit Courses path — the tree is missing, unpublished, or the API key cannot see it.';

    if (process.env.ALLOW_EMPTY_OS_COURSES === '1') {
      console.warn(`⚠️  0 valid courses. ${cause}`);
      console.warn('⚠️  ALLOW_EMPTY_OS_COURSES=1 — writing the empty list anyway.');
    } else {
      for (const line of [
        '❌ Sitecore returned 0 Open Studies courses with sections.',
        `   ${cause}`,
        `   ${OS_VALID_COURSES_PATH} was NOT written. Nothing downstream will run and the`,
        '   deploy will be skipped, so the published catalogue stays exactly as it is',
        '   rather than going empty.',
        '   Check /sitecore/content/BVC/BVC/Data/SisData/Credit Courses and the SIS → Sitecore sync.',
        '   To publish a genuinely empty catalogue on purpose: ALLOW_EMPTY_OS_COURSES=1',
      ]) console.error(line);
      process.exit(1);
    }
  }

  // Ensure target directory exists (safe on repeat runs)
  mkdirSync(DATA_DIR, { recursive: true });

  writeFileSync(OS_VALID_COURSES_PATH, JSON.stringify(validCourses, null, 2));
  console.log(`✅ Exported ${validCourses.length} valid courses to ${OS_VALID_COURSES_PATH}`);
}

run().catch((err) => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});