import dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });

import { GraphQLClient, gql } from 'graphql-request';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import path from 'path';

function parseDecimal(value, defaultValue = 0) {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parseFloat(parsed.toFixed(2));
}

function parseInteger(value, defaultValue = 0) {
  const parsed = parseInt(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

const client = new GraphQLClient(process.env.SITECORE_GRAPHQL_ENDPOINT, {
  headers: {
    sc_apikey: process.env.SC_APIKEY,
  },
});

const PAGE_SIZE = 10; // Sitecore XMC default

const validCourses = JSON.parse(readFileSync(path.resolve('src/data/osValidCourses.json'), 'utf-8'));

// Query 2: Get course metadata (shallow)
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

// Query 3: Get section names only (shallow)
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

// Query 4: Get individual section details (shallow)
const GET_SECTION_DETAILS = gql`
  query GetSectionDetails($path: String!) {
    section: item(path: $path, language: "en") {
      id
      name
      sisId: field(name: "SisId") { value }
      deliveryType: field(name: "Delivery Type") { value }
      startDate: field(name: "Start Date") { value }
      endDate: field(name: "End Date") { value }
      seatsAvailable: field(name: "Seats Are Available") { value }
      campus: field(name: "Campus") { value }
      credit: field(name: "Credit") { value }
      hours: field(name: "Hours") { value }
      registrationStart: field(name: "Registration Start") { value }
      registrationEnd: field(name: "Registration End") { value }
    }
  }
`;

// Query 5: Get fee container names (shallow)
const GET_FEE_CONTAINERS = gql`
  query GetFeeContainers($path: String!) {
    section: item(path: $path, language: "en") {
      children {
        results {
          name
        }
      }
    }
  }
`;

// Query 6: Get fee items from container (shallow)
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

// Query 7: Get timeblock items from container (shallow)
const GET_TIMEBLOCK_ITEMS = gql`
  query GetTimeBlockItems($path: String!, $first: Int, $after: String) {
    container: item(path: $path, language: "en") {
      children(first: $first, after: $after) {
        results {
          name
          frequency: field(name: "Frequency") { value }
          sisId: field(name: "SisId") { value }
          startTime: field(name: "Start Time") { value }
          endTime: field(name: "End Time") { value }
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

async function executeQuery(query, variables, context) {
  try {
    return await client.request(query, variables);
  } catch (error) {
    console.warn(`  ⚠️  ${context}: ${error.message}`);
    return null;
  }
}

// Fetch all section names with pagination
async function fetchSectionNames(coursePath, sisID) {
  const sectionNames = [];
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
    
    if (results && results.length > 0) {
      sectionNames.push(...results.map(r => r.name));
    }

    hasNext = pageInfo?.hasNext === true;
    cursor = pageInfo?.endCursor || null;

    if (!results || results.length === 0) hasNext = false;
  }

  return sectionNames;
}

// Fetch fee items with pagination
async function fetchFeeItems(containerPath, containerName) {
  const items = [];
  let hasNext = true;
  let cursor = null;

  while (hasNext) {
    const data = await executeQuery(
      GET_FEE_ITEMS,
      { path: containerPath, first: PAGE_SIZE, after: cursor },
      `fees in ${containerName}`
    );

    if (!data?.container?.children) break;

    const { results, pageInfo } = data.container.children;
    
    if (results && results.length > 0) {
      items.push(...results);
    }

    hasNext = pageInfo?.hasNext === true;
    cursor = pageInfo?.endCursor || null;

    if (!results || results.length === 0) hasNext = false;
  }

  return items;
}

// Fetch timeblock items with pagination
async function fetchTimeBlockItems(containerPath, containerName) {
  const items = [];
  let hasNext = true;
  let cursor = null;

  while (hasNext) {
    const data = await executeQuery(
      GET_TIMEBLOCK_ITEMS,
      { path: containerPath, first: PAGE_SIZE, after: cursor },
      `timeblocks in ${containerName}`
    );

    if (!data?.container?.children) break;

    const { results, pageInfo } = data.container.children;
    
    if (results && results.length > 0) {
      items.push(...results);
    }

    hasNext = pageInfo?.hasNext === true;
    cursor = pageInfo?.endCursor || null;

    if (!results || results.length === 0) hasNext = false;
  }

  return items;
}

async function getCourseData(sisID) {
  const coursePath = `/sitecore/content/BVC/BVC/Data/SisData/Credit Courses/${sisID}`;
  
  console.log(`  📂 ${sisID}`);

  // Step 1: Get course metadata
  const courseData = await executeQuery(
    GET_COURSE_METADATA,
    { path: coursePath },
    `metadata for ${sisID}`
  );

  if (!courseData?.course) {
    console.warn(`  ❌ Not found`);
    return null;
  }

  // Step 2: Get all section names
  const sectionNames = await fetchSectionNames(coursePath, sisID);
  console.log(`    📄 ${sectionNames.length} sections`);

  const sections = [];

  // Step 3: Process each section individually
  for (const sectionName of sectionNames) {
    const sectionPath = `${coursePath}/${sectionName}`;

    // Get section details
    const sectionData = await executeQuery(
      GET_SECTION_DETAILS,
      { path: sectionPath },
      `${sectionName}`
    );

    if (!sectionData?.section) continue;

    const section = {
      id: sectionData.section.id,
      name: sectionData.section.name,
      sisId: sectionData.section.sisId?.value,
      deliveryType: sectionData.section.deliveryType?.value,
      startDate: sectionData.section.startDate?.value,
      endDate: sectionData.section.endDate?.value,
      seatsAvailable: sectionData.section.seatsAvailable?.value === '1',
      campus: sectionData.section.campus?.value,
      credits: parseDecimal(sectionData.section.credit?.value),
      hours: parseInteger(sectionData.section.hours?.value),
      registrationStart: sectionData.section.registrationStart?.value,
      registrationEnd: sectionData.section.registrationEnd?.value,
      fees: {
        domestic: null,
        international: null
      },
      timeBlocks: []
    };

    // Step 4: Get fee/timeblock container names
    const containersData = await executeQuery(
      GET_FEE_CONTAINERS,
      { path: sectionPath },
      `containers for ${sectionName}`
    );

    if (containersData?.section?.children?.results) {
      for (const container of containersData.section.children.results) {
        const containerPath = `${sectionPath}/${container.name}`;

        // Handle Fees container
        if (container.name === 'Fees') {
          const feeItems = await fetchFeeItems(containerPath, container.name);
          
          for (const fee of feeItems) {
            const feeData = {
              amount: parseDecimal(fee.amount?.value),
              tax: parseDecimal(fee.tax?.value),
              feeType: fee.feeType?.value
            };

            if (fee.name === 'Domestic') {
              section.fees.domestic = feeData;
            } else if (fee.name === 'International') {
              section.fees.international = feeData;
            }
          }
        }

        // Handle TimeBlock container
        if (container.name === 'TimeBlock') {
          const timeBlockItems = await fetchTimeBlockItems(containerPath, container.name);
          const seen = new Set();
          section.timeBlocks = timeBlockItems
            .map(tb => ({
              sisId: tb.sisId?.value,
              frequency: tb.frequency?.value,
              startTime: tb.startTime?.value,
              endTime: tb.endTime?.value,
              schedule: tb.schedule?.value
            }))
            .filter(tb => {
              const key = tb.sisId || tb.schedule;
              if (!key || seen.has(key)) return false;
              seen.add(key);
              return true;
            });
        }
      }
    }

    sections.push(section);
  }

  console.log(`    ✅ D$${sections[0]?.fees?.domestic?.amount || 0} I$${sections[0]?.fees?.international?.amount || 0}`);

  return {
    id: courseData.course.id,
    sisId: sisID,
    name: courseData.course.name?.value || sisID,
    description: courseData.course.description?.value || '',
    credits: parseDecimal(courseData.course.credits?.value),
    sections: sections
  };
}

async function extractAllCourseData() {
  const allCourses = [];

  console.log(`🚀 Starting extraction of ${validCourses.length} Open Studies courses...\n`);

  for (let i = 0; i < validCourses.length; i++) {
    const sisID = validCourses[i];
    console.log(`📚 [${i + 1}/${validCourses.length}] ${sisID}`);

    const courseData = await getCourseData(sisID);
    if (courseData) {
      allCourses.push(courseData);
    }
  }

  return allCourses;
}

async function saveData(courses) {
  console.log('\n💾 Saving...\n');

  const outputDir = 'src/data';
  const coursesDir = path.join(outputDir, 'oScourses');
  mkdirSync(outputDir, { recursive: true });
  mkdirSync(coursesDir, { recursive: true });

  // One JSON file per course
  for (const course of courses) {
    const fileName = `course-${course.sisId}.json`;
    writeFileSync(path.join(coursesDir, fileName), JSON.stringify(course, null, 2));
    console.log(`  ✅ ${fileName}`);
  }

  // Course index
  const index = courses.map(c => ({
    sisId: c.sisId,
    name: c.name,
    fileName: `course-${c.sisId}.json`,
    sectionCount: c.sections.length
  }));
  writeFileSync(path.join(coursesDir, 'course-index.json'), JSON.stringify(index, null, 2));
  console.log(`✅ course-index.json`);

  // Stats
  const coursesWithSections = courses.filter(c => c.sections.length > 0);
  const stats = {
    totalCourses: courses.length,
    coursesWithSections: coursesWithSections.length,
    totalSections: courses.reduce((sum, c) => sum + c.sections.length, 0),
    totalTimeBlocks: courses.reduce((sum, c) =>
      sum + c.sections.reduce((s, sec) => s + sec.timeBlocks.length, 0), 0
    ),
    extractedAt: new Date().toISOString()
  };

  writeFileSync(path.join(outputDir, 'extractionStats.json'), JSON.stringify(stats, null, 2));
  console.log(`✅ extractionStats.json`);

  return stats;
}

async function run() {
  const startTime = Date.now();

  try {
    const courses = await extractAllCourseData();
    const stats = await saveData(courses);

    console.log('\n' + '='.repeat(60));
    console.log('🎉 DONE!');
    console.log('='.repeat(60));
    console.log(`Courses: ${stats.totalCourses}`);
    console.log(`Sections: ${stats.totalSections}`);
    console.log(`TimeBlocks: ${stats.totalTimeBlocks}`);
    console.log(`Time: ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌', error.message);
    process.exit(1);
  }
}

run();