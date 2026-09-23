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
  // An EMPTY list is a legitimate answer, and is published as-is.
  //
  // This file is the availability signal. Zero courses with sections means
  // Sitecore has no availability right now — a real state the site is built to
  // show: the course pages fall through to the Webflow template's "There are no
  // dates available for this course at the moment" copy, and
  // buildOpenStudiesByArea marks all 104 courses "No availability this term".
  // Refusing to write it would suppress a true answer and pin the site to a
  // stale catalogue, selling sections Sitecore no longer has.
  //
  // What IS a fault is not getting an answer at all. `rootResolved` separates
  // the two, and it is the only distinction that matters here:
  //
  //   tree resolved + 0 courses  → Sitecore answered "nothing available". Publish it.
  //   tree never resolved        → missing, unpublished, or an API key that cannot
  //                                see it. We do not know what is available, and
  //                                publishing [] would assert "nothing" on no
  //                                evidence. Fail instead.
  //
  // A thrown query (network, auth, 5xx) is already fatal via run().catch below,
  // which is the same principle: silence is not an answer.
  // ─────────────────────────────────────────────
  if (validCourses.length === 0) {
    if (!rootResolved) {
      for (const line of [
        '❌ Sitecore returned no item at all for the Credit Courses path.',
        '   The tree is missing, unpublished, or the API key cannot see it — so we do',
        `   NOT know what is available, and ${OS_VALID_COURSES_PATH} was not written.`,
        '   Publishing an empty list here would claim "no availability" on no evidence.',
        '   Check /sitecore/content/BVC/BVC/Data/SisData/Credit Courses.',
      ]) console.error(line);
      process.exit(1);
    }
    console.warn('⚠️  Sitecore reports 0 Open Studies courses with sections — publishing an empty catalogue.');
    console.warn('⚠️  Course pages will show the Webflow "no dates available" copy; the area listing will read "No availability this term".');
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