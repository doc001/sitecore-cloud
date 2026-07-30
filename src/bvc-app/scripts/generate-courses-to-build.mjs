/**
 * generate-courses-to-build.mjs
 * ─────────────────────────────────────────────────────────────
 * SCRIPT B — Allow-list generator
 *
 * Walks /sitecore/content/BVC/BVC/Data/SisData/Courses and
 * produces a flat list of SIS IDs for courses that have at
 * least one child item (i.e. at least one section).
 *
 * Output: src/data/coursesToBuild.json
 *
 * Consumers of this file:
 *   1. extract-course-data.mjs  → uses it as the input list
 *                                  for full data extraction
 *   2. The Extended Education listing-page generator
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
// not the current working directory. This way the script
// works whether you run it from bvc-app/, from scripts/,
// or from a npm/yarn script.
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
      path: "/sitecore/content/BVC/BVC/Data/SisData/Courses"
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

// Single source of truth for the output path —
// exported so downstream scripts can import it.
export const COURSES_TO_BUILD_PATH = path.join(DATA_DIR, 'coursesToBuild.json');

async function run() {
  if (!process.env.SITECORE_GRAPHQL_ENDPOINT) throw new Error('SITECORE_GRAPHQL_ENDPOINT missing');
  if (!process.env.SC_APIKEY) throw new Error('SC_APIKEY missing');

  let after = null;
  let hasNext = true;
  const coursesToBuild = [];

  // Paginate through every course root
  while (hasNext) {
    const data = await client.request(GET_ALL_COURSE_ROOTS, { after });
    const children = data?.courseRoot?.children;
    if (!children?.results) break;

    for (const item of children.results) {
      const hasChildren = item?.children?.results?.length > 0;
      const sisID = item?.sisID?.value;
      // Only include courses that (a) have a sisID and
      // (b) have at least one child section worth building.
      if (sisID && hasChildren) {
        coursesToBuild.push(sisID);
      }
    }

    after = children.pageInfo?.endCursor ?? null;
    hasNext = children.pageInfo?.hasNext ?? false;
  }

  // Ensure target directory exists (safe on repeat runs)
  mkdirSync(DATA_DIR, { recursive: true });

  writeFileSync(COURSES_TO_BUILD_PATH, JSON.stringify(coursesToBuild, null, 2));
  console.log(`✅ Exported ${coursesToBuild.length} courses to ${COURSES_TO_BUILD_PATH}`);
}

run().catch((err) => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});