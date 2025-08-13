// scripts/validate-and-prepare-build.mjs
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('🔍 Pre-Build Course Data Validation & Preparation');
console.log('================================================');

/**
 * Ensure data directories exist
 */
function ensureDirectoriesExist() {
  const dataDir = join(rootDir, 'src', 'data');
  const coursesDir = join(rootDir, 'src', 'data', 'oScourses');
  
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
    console.log('✅ Created data directory');
  }
  
  if (!existsSync(coursesDir)) {
    mkdirSync(coursesDir, { recursive: true });
    console.log('✅ Created courses directory');
  }
}

/**
 * Create fallback course data file
 */
function createFallbackCourseData() {
  const fallbackData = {
    metadata: {
      generatedAt: new Date().toISOString(),
      version: "1.0.0",
      source: "fallback-generator",
      sisID: "no-courses-available",
      courseName: "No Courses Available"
    },
    course: {
      id: "fallback-course",
      sisID: "no-courses-available",
      name: "Course Information Currently Unavailable",
      children: [],
      summary: {
        totalSections: 0,
        totalFees: 0,
        totalTimeBlocks: 0,
        sectionsWithFees: 0
      }
    }
  };

  const fallbackFile = join(rootDir, 'src', 'data', 'oScourses', 'course-no-courses-available.json');
  writeFileSync(fallbackFile, JSON.stringify(fallbackData, null, 2));
  console.log('✅ Created fallback course data file');
}

/**
 * Validate and potentially create fallback for osValidCourses.json
 */
function validateAndPrepareCourseList() {
  const validCoursesFile = join(rootDir, 'src', 'data', 'osValidCourses.json');
  
  console.log('\n1. Validating osValidCourses.json...');
  
  let needsFallback = false;
  let courses = [];
  
  if (!existsSync(validCoursesFile)) {
    console.log('⚠️ osValidCourses.json not found');
    needsFallback = true;
  } else {
    try {
      const content = readFileSync(validCoursesFile, 'utf8');
      
      if (!content.trim()) {
        console.log('⚠️ osValidCourses.json is empty');
        needsFallback = true;
      } else {
        const parsedCourses = JSON.parse(content);
        
        if (!Array.isArray(parsedCourses)) {
          console.log('❌ osValidCourses.json is not an array');
          needsFallback = true;
        } else {
          // Filter valid entries
          const validCourses = parsedCourses.filter(course => 
            course && typeof course === 'string' && course.trim().length > 0
          );

          if (validCourses.length === 0) {
            console.log('⚠️ No valid courses found in osValidCourses.json');
            needsFallback = true;
          } else {
            console.log(`✅ Found ${validCourses.length} valid courses`);
            courses = validCourses;
          }
        }
      }
    } catch (error) {
      console.log('❌ Error parsing osValidCourses.json:', error.message);
      needsFallback = true;
    }
  }

  if (needsFallback) {
    console.log('\n📦 Creating fallback course list...');
    const fallbackCourses = ['no-courses-available'];
    writeFileSync(validCoursesFile, JSON.stringify(fallbackCourses, null, 2));
    console.log('✅ Created fallback osValidCourses.json with fallback entry');
    return { needsFallback: true, courses: fallbackCourses };
  }

  return { needsFallback: false, courses };
}

/**
 * Validate course data files for real courses
 */
function validateCourseDataFiles(courses) {
  if (courses.length === 1 && courses[0] === 'no-courses-available') {
    console.log('\n2. Skipping course data validation (using fallback)');
    return { allValid: true, validCourses: courses };
  }

  console.log('\n2. Validating course data files...');
  
  const coursesDir = join(rootDir, 'src', 'data', 'oScourses');
  let validCount = 0;
  const validCourses = [];
  const missingFiles = [];
  const invalidFiles = [];

  for (const courseId of courses) {
    const courseFile = join(coursesDir, `course-${courseId}.json`);
    
    if (!existsSync(courseFile)) {
      missingFiles.push(`course-${courseId}.json`);
      continue;
    }

    try {
      const content = readFileSync(courseFile, 'utf8');
      
      if (!content.trim()) {
        invalidFiles.push(`course-${courseId}.json (empty)`);
        continue;
      }

      const courseData = JSON.parse(content);
      
      if (!courseData?.course?.sisID) {
        invalidFiles.push(`course-${courseId}.json (invalid structure)`);
        continue;
      }

      if (!courseData.course.children || !Array.isArray(courseData.course.children)) {
        invalidFiles.push(`course-${courseId}.json (no offerings)`);
        continue;
      }

      validCount++;
      validCourses.push(courseId);

    } catch (error) {
      invalidFiles.push(`course-${courseId}.json (parse error)`);
    }
  }

  console.log(`📊 Valid course files: ${validCount}/${courses.length}`);
  
  if (missingFiles.length > 0) {
    console.log(`❌ Missing files (${missingFiles.length}):`, missingFiles.slice(0, 5));
  }
  
  if (invalidFiles.length > 0) {
    console.log(`❌ Invalid files (${invalidFiles.length}):`, invalidFiles.slice(0, 5));
  }

  // If no valid courses, fall back to the fallback system
  if (validCount === 0) {
    console.log('\n⚠️ No valid course data found, switching to fallback mode');
    const validCoursesFile = join(rootDir, 'src', 'data', 'osValidCourses.json');
    const fallbackCourses = ['no-courses-available'];
    writeFileSync(validCoursesFile, JSON.stringify(fallbackCourses, null, 2));
    console.log('✅ Updated osValidCourses.json to use fallback');
    return { allValid: true, validCourses: fallbackCourses };
  }

  // Update the valid courses file if some courses were invalid
  if (validCount !== courses.length) {
    console.log(`\n📝 Updating osValidCourses.json to include only valid courses (${validCount}/${courses.length})`);
    const validCoursesFile = join(rootDir, 'src', 'data', 'osValidCourses.json');
    writeFileSync(validCoursesFile, JSON.stringify(validCourses, null, 2));
    console.log('✅ Updated osValidCourses.json with filtered course list');
  }

  return { allValid: validCount === courses.length, validCourses };
}

/**
 * Create summary report
 */
function createSummaryReport(result) {
  console.log('\n📋 BUILD PREPARATION SUMMARY');
  console.log('===========================');
  
  if (result.needsFallback) {
    console.log('🔄 MODE: Fallback (No courses available)');
    console.log('📄 PAGES: 1 fallback page will be generated');
    console.log('🎯 STATUS: Build ready - will show "No courses available" message');
  } else {
    console.log('✅ MODE: Normal (Real course data)');
    console.log(`📄 PAGES: ${result.validCourses.length} course pages will be generated`);
    console.log('🎯 STATUS: Build ready - will show actual course information');
  }
  
  console.log('\n🚀 Ready for Next.js build process');
}

/**
 * Main execution
 */
async function main() {
  try {
    // Ensure directories exist
    ensureDirectoriesExist();
    
    // Always create the fallback course data file
    createFallbackCourseData();
    
    // Validate and prepare course list
    const { needsFallback, courses } = validateAndPrepareCourseList();
    
    // Validate individual course data files (if not using fallback)
    const { allValid, validCourses } = validateCourseDataFiles(courses);
    
    // Create summary
    createSummaryReport({ needsFallback, validCourses, allValid });
    
    console.log('\n✅ Pre-build validation completed successfully');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Pre-build validation failed:', error);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run the script
main();