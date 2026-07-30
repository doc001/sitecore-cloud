/**
 * extract-course-data.mjs
 * ─────────────────────────────────────────────────────────────
 * SCRIPT A — Full data extractor
 *
 * Reads the allow-list produced by generate-courses-to-build.mjs
 * (src/data/coursesToBuild.json) and, for each SIS ID, pulls:
 *   • course metadata
 *   • all sections (paginated)
 *   • per-section fees (Domestic / International)
 *   • per-section TimeBlocks (cart-ready sisId + schedule)
 *
 * Output (all written to src/data/):
 *   courses/course-<sisId>.json     (one per course)
 *   coursesIndex.json               (lightweight index)
 *   extractedCoursesReport.json     (post-extraction report)
 *   extractionStats.json            (run stats)
 * ─────────────────────────────────────────────────────────────
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GraphQLClient, gql } from 'graphql-request';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';

// ─────────────────────────────────────────────
// Paths — resolved relative to THIS script's location,
// not the current working directory.
// ─────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');               // bvc-app/
const DATA_DIR = path.join(PROJECT_ROOT, 'src', 'data');          // bvc-app/src/data
const COURSES_DIR = path.join(DATA_DIR, 'courses');               // bvc-app/src/data/courses
const ENV_PATH = path.join(PROJECT_ROOT, '.env.local');           // bvc-app/.env.local
const COURSES_TO_BUILD_PATH = path.join(DATA_DIR, 'coursesToBuild.json');

dotenv.config({ path: ENV_PATH });

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function parseDecimal(value, defaultValue = 0) {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parseFloat(parsed.toFixed(2));
}

function parseInteger(value, defaultValue = 0) {
  const parsed = parseInt(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

// ─────────────────────────────────────────────
// GraphQL client
// ─────────────────────────────────────────────
const client = new GraphQLClient(process.env.SITECORE_GRAPHQL_ENDPOINT, {
  headers: { sc_apikey: process.env.SC_APIKEY },
});

const PAGE_SIZE = 10; // Sitecore XMC default page size

// ─────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────
const GET_COURSE_METADATA = gql`
  query GetCourseMetadata($path: String!) {
    course: item(path: $path, language: "en") {
      id
      name: field(name: "Name") { value }
      description: field(name: "Course Description") { value }
      credits: field(name: "Credits") { value }
    }
  }
`;

const GET_SECTION_NAMES = gql`
  query GetSectionNames($path: String!, $first: Int, $after: String) {
    course: item(path: $path, language: "en") {
      children(first: $first, after: $after) {
        results { name }
        pageInfo { hasNext endCursor }
      }
    }
  }
`;

const GET_SECTION_DETAILS = gql`
  query GetSectionDetails($path: String!) {
    section: item(path: $path, language: "en") {
      id
      name
      sisId: field(name: "SisId") { value }
      deliveryType: field(name: "Delivery Type") { value }
      campus: field(name: "Campus") { value }
      hours: field(name: "Hours") { value }
      registrationStart: field(name: "Registration Start") { value }
      registrationEnd: field(name: "Registration End") { value }
      startDate: field(name: "Start Date") { value }
      endDate: field(name: "End Date") { value }
      seatsAvailable: field(name: "Seats Are Available") { value }
      credit: field(name: "Credit") { value }
    }
  }
`;

const GET_SECTION_FOLDERS = gql`
  query GetSectionFolders($path: String!) {
    section: item(path: $path, language: "en") {
      children {
        results { name }
      }
    }
  }
`;

const GET_FEE_ITEMS = gql`
  query GetFeeItems($path: String!, $first: Int, $after: String) {
    container: item(path: $path, language: "en") {
      children(first: $first, after: $after) {
        results {
          name
          amount: field(name: "Amount") { value }
          tax: field(name: "Tax") { value }
          feeType: field(name: "Fee Type") { value }
        }
        pageInfo { hasNext endCursor }
      }
    }
  }
`;

const GET_TIMEBLOCK_ITEMS = gql`
  query GetTimeBlockItems($path: String!, $first: Int, $after: String) {
    container: item(path: $path, language: "en") {
      children(first: $first, after: $after) {
        results {
          name
          sisId: field(name: "SisId") { value }
          startTime: field(name: "Start Time") { value }
          endTime: field(name: "End Time") { value }
          frequency: field(name: "Frequency") { value }
          schedule: field(name: "ScheduleDaysAndTimeRange") { value }
        }
        pageInfo { hasNext endCursor }
      }
    }
  }
`;

// ─────────────────────────────────────────────
// Safe query wrapper — surfaces errors as warnings
// so one bad item doesn't abort the whole build.
// ─────────────────────────────────────────────
async function executeQuery(query, variables, context) {
  try {
    return await client.request(query, variables);
  } catch (error) {
    console.warn(`  ⚠️  ${context}: ${error.message}`);
    return null;
  }
}

// ─────────────────────────────────────────────
// Pagination helpers
// ─────────────────────────────────────────────
async function fetchSectionNames(coursePath, sisID) {
  const names = [];
  let hasNext = true;
  let cursor = null;

  while (hasNext) {
    const data = await executeQuery(
      GET_SECTION_NAMES,
      { path: coursePath, first: PAGE_SIZE, after: cursor },
      `section names for ${sisID}`
    );
    if (!data?.course?.children) break;

    const { results, pageInfo } = data.course.children;
    if (results?.length) names.push(...results.map(r => r.name));

    hasNext = pageInfo?.hasNext === true;
    cursor = pageInfo?.endCursor || null;
    if (!results?.length) hasNext = false;
  }
  return names;
}

async function fetchFeeItems(feesPath) {
  const items = [];
  let hasNext = true;
  let cursor = null;

  while (hasNext) {
    const data = await executeQuery(
      GET_FEE_ITEMS,
      { path: feesPath, first: PAGE_SIZE, after: cursor },
      `fees at ${feesPath}`
    );
    if (!data?.container?.children) break;

    const { results, pageInfo } = data.container.children;
    if (results?.length) items.push(...results);

    hasNext = pageInfo?.hasNext === true;
    cursor = pageInfo?.endCursor || null;
    if (!results?.length) hasNext = false;
  }
  return items;
}

async function fetchTimeBlockItems(timeBlockPath) {
  const items = [];
  let hasNext = true;
  let cursor = null;

  while (hasNext) {
    const data = await executeQuery(
      GET_TIMEBLOCK_ITEMS,
      { path: timeBlockPath, first: PAGE_SIZE, after: cursor },
      `timeblocks at ${timeBlockPath}`
    );
    if (!data?.container?.children) break;

    const { results, pageInfo } = data.container.children;
    if (results?.length) items.push(...results);

    hasNext = pageInfo?.hasNext === true;
    cursor = pageInfo?.endCursor || null;
    if (!results?.length) hasNext = false;
  }
  return items;
}

// ─────────────────────────────────────────────
// Process a single course and all its sections
// ─────────────────────────────────────────────
async function processCourse(sisID) {
  const coursePath = `/sitecore/content/BVC/BVC/Data/SisData/Courses/${sisID}`;

  const courseData = await executeQuery(
    GET_COURSE_METADATA,
    { path: coursePath },
    `metadata ${sisID}`
  );
  if (!courseData?.course) return null;

  const sectionNames = await fetchSectionNames(coursePath, sisID);
  console.log(`    📄 ${sectionNames.length} sections`);

  const sections = [];

  for (const sectionName of sectionNames) {
    const sectionPath = `${coursePath}/${sectionName}`;

    const sectionData = await executeQuery(
      GET_SECTION_DETAILS,
      { path: sectionPath },
      sectionName
    );
    if (!sectionData?.section) continue;

    const s = sectionData.section;

    // Each section is a standalone purchasable product
    const section = {
      id: s.id,
      name: s.name,
      sisId: s.sisId?.value,
      deliveryType: s.deliveryType?.value,
      campus: s.campus?.value,
      hours: parseInteger(s.hours?.value),
      credits: parseDecimal(s.credit?.value),
      registrationStart: s.registrationStart?.value,
      registrationEnd: s.registrationEnd?.value,
      startDate: s.startDate?.value,
      endDate: s.endDate?.value,
      seatsAvailable: s.seatsAvailable?.value === '1',
      fees: { domestic: null, international: null },
      // timeBlock.sisId is the cart value for student registration
      timeBlocks: [],
    };

    // Discover which subfolders exist under this section
    const foldersData = await executeQuery(
      GET_SECTION_FOLDERS,
      { path: sectionPath },
      `folders for ${sectionName}`
    );
    const folderNames = foldersData?.section?.children?.results?.map(r => r.name) || [];

    // Fees
    if (folderNames.includes('Fees')) {
      const feeItems = await fetchFeeItems(`${sectionPath}/Fees`);
      for (const fee of feeItems) {
        const feeData = {
          amount: parseDecimal(fee.amount?.value),
          tax: parseDecimal(fee.tax?.value),
          feeType: fee.feeType?.value,
        };
        if (fee.name === 'Domestic') section.fees.domestic = feeData;
        else if (fee.name === 'International') section.fees.international = feeData;
      }
    }

    // TimeBlocks
    if (folderNames.includes('TimeBlock')) {
      const timeBlockItems = await fetchTimeBlockItems(`${sectionPath}/TimeBlock`);
      section.timeBlocks = timeBlockItems.map(tb => ({
        sisId: tb.sisId?.value,         // ← cart value for registration
        name: tb.name,
        startTime: tb.startTime?.value, // actual course run start
        endTime: tb.endTime?.value,     // actual course run end
        frequency: tb.frequency?.value,
        schedule: tb.schedule?.value,   // e.g. "M 12:30 PM - 1:50 PM"
      }));
    }

    console.log(
      `      ✅ ${sectionName} | D$${section.fees.domestic?.amount ?? '-'} I$${section.fees.international?.amount ?? '-'} | ${section.timeBlocks.length} timeblock(s)`
    );

    sections.push(section);
  }

  return {
    id: courseData.course.id,
    sisId: sisID,
    name: courseData.course.name?.value || sisID,
    description: courseData.course.description?.value || '',
    credits: parseDecimal(courseData.course.credits?.value),
    sections,
  };
}

// ─────────────────────────────────────────────
// Load the allow-list produced by Script B.
// This replaces the previous live GET_COURSE_IDS query.
// ─────────────────────────────────────────────
function loadCoursesToBuild() {
  if (!existsSync(COURSES_TO_BUILD_PATH)) {
    throw new Error(
      `Allow-list not found at ${COURSES_TO_BUILD_PATH}. ` +
      `Run generate-courses-to-build.mjs first.`
    );
  }
  const raw = readFileSync(COURSES_TO_BUILD_PATH, 'utf-8');
  const list = JSON.parse(raw);
  if (!Array.isArray(list)) {
    throw new Error(`${COURSES_TO_BUILD_PATH} must contain a JSON array of SIS IDs.`);
  }
  return list;
}

// ─────────────────────────────────────────────
// Main extraction loop
// ─────────────────────────────────────────────
async function extractAllCourseData() {
  console.log('🚀 Starting Extended Education extraction...\n');

  const courseList = loadCoursesToBuild();
  console.log(`✅ Loaded ${courseList.length} courses from allow-list\n`);

  const allCourses = [];
  for (let i = 0; i < courseList.length; i++) {
    const sisID = courseList[i];
    console.log(`📚 [${i + 1}/${courseList.length}] ${sisID}`);
    const course = await processCourse(sisID);
    if (course) allCourses.push(course);
  }
  return allCourses;
}

// ─────────────────────────────────────────────
// Save outputs
// ─────────────────────────────────────────────
async function saveData(courses) {
  console.log('\n💾 Saving...\n');

  mkdirSync(DATA_DIR, { recursive: true });
  mkdirSync(COURSES_DIR, { recursive: true });

  const generatedFiles = [];
  const failedFiles = [];

  // One JSON file per course
  for (const course of courses) {
    try {
      const filePath = path.join(COURSES_DIR, `course-${course.sisId}.json`);
      writeFileSync(filePath, JSON.stringify(course, null, 2));
      generatedFiles.push(course.sisId);
      console.log(`✅ course-${course.sisId}.json`);
    } catch (error) {
      console.error(`❌ Failed: course-${course.sisId}.json — ${error.message}`);
      failedFiles.push(course.sisId);
    }
  }

  // Lightweight index for routing + listings
  const courseIndex = {
    generatedAt: new Date().toISOString(),
    totalCourses: courses.length,
    courses: courses.map(c => ({
      sisId: c.sisId,
      name: c.name,
      credits: c.credits,
      sectionCount: c.sections.length,
      fileName: `course-${c.sisId}.json`,
      // Cart-ready timeBlock sisIds per section
      cartItems: c.sections.flatMap(s =>
        s.timeBlocks.map(tb => ({
          sectionName: s.name,
          sisId: tb.sisId, // ← add to cart
          schedule: tb.schedule,
        }))
      ),
    })),
  };
  writeFileSync(path.join(DATA_DIR, 'coursesIndex.json'), JSON.stringify(courseIndex, null, 2));
  console.log(`✅ coursesIndex.json`);

  // Post-extraction report — separate filename from coursesToBuild.json
  // so we never clobber the upstream allow-list.
  const extractedReport = {
    generatedAt: new Date().toISOString(),
    coursesWithSections: courses
      .filter(c => c.sections.length > 0)
      .map(c => c.sisId),
    coursesWithoutSections: courses
      .filter(c => c.sections.length === 0)
      .map(c => c.sisId),
  };
  writeFileSync(
    path.join(DATA_DIR, 'extractedCoursesReport.json'),
    JSON.stringify(extractedReport, null, 2)
  );
  console.log(`✅ extractedCoursesReport.json`);

  // Run stats
  const stats = {
    generatedAt: new Date().toISOString(),
    totalCourses: courses.length,
    coursesWithSections: extractedReport.coursesWithSections.length,
    totalSections: courses.reduce((sum, c) => sum + c.sections.length, 0),
    totalTimeBlocks: courses.reduce(
      (sum, c) => sum + c.sections.reduce((s, sec) => s + sec.timeBlocks.length, 0),
      0
    ),
    sectionsWithTimeBlocks: courses.reduce(
      (sum, c) => sum + c.sections.filter(s => s.timeBlocks.length > 0).length,
      0
    ),
    files: {
      generated: generatedFiles.length,
      failed: failedFiles.length,
      failedIds: failedFiles,
    },
  };
  writeFileSync(path.join(DATA_DIR, 'extractionStats.json'), JSON.stringify(stats, null, 2));
  console.log(`✅ extractionStats.json`);

  return stats;
}

// ─────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────
async function run() {
  const startTime = Date.now();

  try {
    if (!process.env.SITECORE_GRAPHQL_ENDPOINT) throw new Error('SITECORE_GRAPHQL_ENDPOINT missing');
    if (!process.env.SC_APIKEY) throw new Error('SC_APIKEY missing');

    const courses = await extractAllCourseData();
    const stats = await saveData(courses);

    console.log('\n' + '='.repeat(60));
    console.log('🎉 DONE!');
    console.log('='.repeat(60));
    console.log(`Courses          : ${stats.totalCourses}`);
    console.log(`Sections         : ${stats.totalSections}`);
    console.log(`With TimeBlocks  : ${stats.sectionsWithTimeBlocks}`);
    console.log(`TimeBlocks total : ${stats.totalTimeBlocks}`);
    console.log(`Files generated  : ${stats.files.generated}`);
    console.log(`Files failed     : ${stats.files.failed}`);
    console.log(`Time             : ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n❌', error.message);
    process.exit(1);
  }
}

run();