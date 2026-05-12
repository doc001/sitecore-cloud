import dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });

import { GraphQLClient, gql } from 'graphql-request';
import { writeFileSync, mkdirSync } from 'fs';

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
// GraphQL Client
// ─────────────────────────────────────────────
const client = new GraphQLClient(process.env.SITECORE_GRAPHQL_ENDPOINT, {
  headers: {
    sc_apikey: process.env.SC_APIKEY,
  },
});

const PAGE_SIZE = 10; // Sitecore XMC default page size

// ─────────────────────────────────────────────
// Query 1: Paginate through all course IDs
// ─────────────────────────────────────────────
const GET_COURSE_IDS = gql`
  query GetCourseIds($after: String) {
    courseRoot: item(
      path: "/sitecore/content/BVC/BVC/Data/SisData/Credit Courses"
      language: "en"
    ) {
      children(first: 50, after: $after) {
        results {
          name
          sisID: field(name: "SisId") { value }
        }
        pageInfo {
          hasNext
          endCursor
        }
      }
    }
  }
`;

// ─────────────────────────────────────────────
// Query 2: Course-level metadata
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

// ─────────────────────────────────────────────
// Query 3: Section names with pagination
// Each section is an independent purchasable product
// ─────────────────────────────────────────────
const GET_SECTION_NAMES = gql`
  query GetSectionNames($path: String!, $first: Int, $after: String) {
    course: item(path: $path, language: "en") {
      children(first: $first, after: $after) {
        results {
          name
        }
        pageInfo {
          hasNext
          endCursor
        }
      }
    }
  }
`;

// ─────────────────────────────────────────────
// Query 4: Section-level details
// - registrationStart/End: when reg opens/closes
// - startDate/endDate: registration window dates
//   (NOT course run dates — those are in TimeBlock)
// - seatsAvailable: whether student can register
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// Query 5: Child folder names under a section
// Tells us if Fees and/or TimeBlock exist
// ─────────────────────────────────────────────
const GET_SECTION_FOLDERS = gql`
  query GetSectionFolders($path: String!) {
    section: item(path: $path, language: "en") {
      children {
        results {
          name
        }
      }
    }
  }
`;

// ─────────────────────────────────────────────
// Query 6: Fee items (Domestic / International)
// ─────────────────────────────────────────────
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
        pageInfo {
          hasNext
          endCursor
        }
      }
    }
  }
`;

// ─────────────────────────────────────────────
// Query 7: TimeBlock items
// sisId = the value added to cart on registration
// startTime/endTime = actual course run dates
// schedule = human-readable e.g. "M 12:30 PM - 1:50 PM"
// ─────────────────────────────────────────────
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
        pageInfo {
          hasNext
          endCursor
        }
      }
    }
  }
`;

// ─────────────────────────────────────────────
// Helper: execute query safely
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
// Paginate: section names
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

// ─────────────────────────────────────────────
// Paginate: fee items
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// Paginate: timeblock items
// ─────────────────────────────────────────────
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
  const coursePath = `/sitecore/content/BVC/BVC/Data/SisData/Credit Courses/${sisID}`;

  // Course metadata
  const courseData = await executeQuery(
    GET_COURSE_METADATA,
    { path: coursePath },
    `metadata ${sisID}`
  );

  if (!courseData?.course) return null;

  // All section names (paginated)
  const sectionNames = await fetchSectionNames(coursePath, sisID);
  console.log(`    📄 ${sectionNames.length} sections`);

  const sections = [];

  for (const sectionName of sectionNames) {
    const sectionPath = `${coursePath}/${sectionName}`;

    // Section details
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
      fees: {
        domestic: null,
        international: null
      },
      // timeBlock.sisId is the cart value for student registration
      timeBlocks: []
    };

    // Check which folders exist under this section
    const foldersData = await executeQuery(
      GET_SECTION_FOLDERS,
      { path: sectionPath },
      `folders for ${sectionName}`
    );

    const folderNames = foldersData?.section?.children?.results?.map(r => r.name) || [];

    // Process Fees folder
    if (folderNames.includes('Fees')) {
      const feeItems = await fetchFeeItems(`${sectionPath}/Fees`);

      for (const fee of feeItems) {
        const feeData = {
          amount: parseDecimal(fee.amount?.value),
          tax: parseDecimal(fee.tax?.value),
          feeType: fee.feeType?.value
        };

        if (fee.name === 'Domestic') section.fees.domestic = feeData;
        else if (fee.name === 'International') section.fees.international = feeData;
      }
    }

    // Process TimeBlock folder
    // timeBlock.sisId is what gets added to cart
    if (folderNames.includes('TimeBlock')) {
      const timeBlockItems = await fetchTimeBlockItems(`${sectionPath}/TimeBlock`);

      section.timeBlocks = timeBlockItems.map(tb => ({
        sisId: tb.sisId?.value,         // ← cart value for registration
        name: tb.name,
        startTime: tb.startTime?.value, // actual course run start
        endTime: tb.endTime?.value,     // actual course run end
        frequency: tb.frequency?.value,
        schedule: tb.schedule?.value    // e.g. "M 12:30 PM - 1:50 PM"
      }));
    }

    console.log(`      ✅ ${sectionName} | D$${section.fees.domestic?.amount ?? '-'} I$${section.fees.international?.amount ?? '-'} | ${section.timeBlocks.length} timeblock(s)`);

    sections.push(section);
  }

  return {
    id: courseData.course.id,
    sisId: sisID,
    name: courseData.course.name?.value || sisID,
    description: courseData.course.description?.value || '',
    credits: parseDecimal(courseData.course.credits?.value),
    sections
  };
}

// ─────────────────────────────────────────────
// Main extraction loop
// ─────────────────────────────────────────────
async function extractAllCourseData() {
  const allCourses = [];
  console.log('🚀 Starting Credit Courses extraction...\n');

  // Get all course IDs
  const courseList = [];
  let after = null;
  let hasNext = true;

  while (hasNext) {
    const data = await executeQuery(GET_COURSE_IDS, { after }, 'course IDs');
    if (!data?.courseRoot?.children) break;

    const { results, pageInfo } = data.courseRoot.children;
    results.forEach(item => {
      if (item?.sisID?.value) courseList.push(item.sisID.value);
    });

    after = pageInfo?.endCursor ?? null;
    hasNext = pageInfo?.hasNext ?? false;
  }

  console.log(`✅ Found ${courseList.length} courses\n`);

  // Process each course
  for (let i = 0; i < courseList.length; i++) {
    const sisID = courseList[i];
    console.log(`📚 [${i + 1}/${courseList.length}] ${sisID}`);

    const course = await processCourse(sisID);
    if (course) allCourses.push(course);
  }

  return allCourses;
}

// ─────────────────────────────────────────────
// Save: one file per course + index files
// ─────────────────────────────────────────────
async function saveData(courses) {
  console.log('\n💾 Saving...\n');

  const dataDir = 'src/data';
  const coursesDir = 'src/data/oScourses';

  mkdirSync(dataDir, { recursive: true });
  mkdirSync(coursesDir, { recursive: true });

  const generatedFiles = [];
  const failedFiles = [];

  // ── One JSON file per course ──
  for (const course of courses) {
    try {
      const filePath = `${coursesDir}/course-${course.sisId}.json`;
      writeFileSync(filePath, JSON.stringify(course, null, 2));
      generatedFiles.push(course.sisId);
      console.log(`✅ course-${course.sisId}.json`);
    } catch (error) {
      console.error(`❌ Failed: course-${course.sisId}.json — ${error.message}`);
      failedFiles.push(course.sisId);
    }
  }

  // ── Course index (lightweight, for generateStaticParams) ──
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
          sisId: tb.sisId,      // ← add to cart
          schedule: tb.schedule
        }))
      )
    }))
  };

  writeFileSync(`${dataDir}/oScoursesIndex.json`, JSON.stringify(courseIndex, null, 2));
  console.log(`✅ oScoursesIndex.json`);

  // ── Valid course SIS IDs only ──
  const validCourses = courses
    .filter(c => c.sections.length > 0)
    .map(c => c.sisId);

  writeFileSync(`${dataDir}/oSvalidCourses.json`, JSON.stringify(validCourses, null, 2));
  console.log(`✅ oSvalidCourses.json (${validCourses.length})`);

  // ── Extraction stats ──
  const stats = {
    generatedAt: new Date().toISOString(),
    totalCourses: courses.length,
    coursesWithSections: validCourses.length,
    totalSections: courses.reduce((sum, c) => sum + c.sections.length, 0),
    totalTimeBlocks: courses.reduce((sum, c) =>
      sum + c.sections.reduce((s, sec) => s + sec.timeBlocks.length, 0), 0),
    sectionsWithTimeBlocks: courses.reduce((sum, c) =>
      sum + c.sections.filter(s => s.timeBlocks.length > 0).length, 0),
    files: {
      generated: generatedFiles.length,
      failed: failedFiles.length,
      failedIds: failedFiles
    }
  };

  writeFileSync(`${dataDir}/oSextractionStats.json`, JSON.stringify(stats, null, 2));
  console.log(`✅ oSextractionStats.json`);

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
    console.log('\n📁 Output structure:');
    console.log('   src/data/');
    console.log('   ├── oScoursesIndex.json');
    console.log('   ├── oSvalidCourses.json');
    console.log('   ├── oSextractionStats.json');
    console.log('   └── oScourses/');
    console.log('       ├── course-ACCT1103.json');
    console.log('       ├── course-ANAT1101.json');
    console.log('       └── ... (one per course)');

  } catch (error) {
    console.error('\n❌', error.message);
    process.exit(1);
  }
}

run();