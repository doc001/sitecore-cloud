// File: ./scripts/simplePDFDownloader.mjs
// Description: Simple PDF downloader that uses existing courseOutlines.json data
//              and tries direct URL access with authentication headers

import dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });

import fs from "fs/promises";
import path from "path";
import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";

// Configuration
const INPUT_FILE = "./src/data/course-outlines/courseOutlines.json";
const PDF_OUTPUT_DIR = "./public/data/course-outlines/pdf";
const JSON_OUTPUT_DIR = "./public/data/course-outlines";
const CURRENT_COURSES_FILE = "currentCourses.json";

const API_KEY = process.env.SC_APIKEY;
const BATCH_SIZE = 5;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

// Command line arguments
const SHOULD_RESUME = process.argv.includes('--resume');
const NO_BREAK_ON_ERROR = process.argv.includes('--no-break');
const SKIP_DOWNLOAD = process.argv.includes('--skip-download');
const TEST_MODE = process.argv.includes('--test'); // Only process first 5 items

console.log("🚀 Simple PDF Downloader for Course Outlines");
console.log(`📁 Input: ${INPUT_FILE}`);
console.log(`📁 Output: ${PDF_OUTPUT_DIR}`);
if (TEST_MODE) console.log("🧪 TEST MODE: Processing only first 5 items");

// Helper functions
async function ensureDir(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dirPath}`);
  }
}

async function loadCourseOutlines() {
  try {
    const filePath = path.resolve(INPUT_FILE);
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    throw new Error(`Failed to load course outlines: ${error.message}`);
  }
}

function generateSafeFilename(courseData) {
  const academicYear = courseData.fields["Academic Year"]?.value || "Unknown";
  const courseCode = courseData.fields["Course Code"]?.value || "Unknown";
  const courseName = courseData.fields["CourseName"]?.value || "Unknown";
  
  const safeName = `${academicYear}_${courseCode}_${courseName}`
    .replace(/[^a-zA-Z0-9\-_]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 100);
  
  return `${safeName}.pdf`;
}

async function downloadPDF(url, filePath, courseData, retryCount = 0) {
  try {
    console.log(`  📥 Downloading: ${courseData.name}`);
    console.log(`  🔗 URL: ${url}`);
    
    // Try different authentication approaches
    const authHeaders = {
      'Authorization': `Bearer ${API_KEY}`,
      'sc_apikey': API_KEY,
      'X-API-Key': API_KEY,
      'User-Agent': 'NextJS-SSG-Build/1.0'
    };
    
    const response = await fetch(url, {
      method: 'GET',
      headers: authHeaders
    });
    
    console.log(`  📊 Response: ${response.status} ${response.statusText}`);
    console.log(`  📋 Content-Type: ${response.headers.get('content-type')}`);
    console.log(`  📏 Content-Length: ${response.headers.get('content-length') || 'unknown'}`);
    
    // Log all response headers for debugging
    console.log(`  📑 Response Headers:`);
    for (const [key, value] of response.headers.entries()) {
      console.log(`    ${key}: ${value}`);
    }
    
    const responseText = await response.text();
    const contentType = response.headers.get('content-type');
    
    // Save HTML/JSON responses for analysis
    if (contentType && (contentType.includes('text/html') || contentType.includes('application/json'))) {
      const debugDir = path.resolve(PDF_OUTPUT_DIR, '..', 'debug-responses');
      await ensureDir(debugDir);
      
      const debugFileName = generateSafeFilename(courseData).replace('.pdf', '') + 
        `_${response.status}_${contentType.split('/')[1].split(';')[0]}.txt`;
      const debugFilePath = path.resolve(debugDir, debugFileName);
      
      const debugContent = `URL: ${url}
Status: ${response.status} ${response.statusText}
Content-Type: ${contentType}
Content-Length: ${response.headers.get('content-length') || 'unknown'}

Headers:
${Array.from(response.headers.entries()).map(([k, v]) => `${k}: ${v}`).join('\n')}

Response Body:
${responseText}`;
      
      await fs.writeFile(debugFilePath, debugContent, 'utf-8');
      console.log(`  💾 Saved response for analysis: debug-responses/${debugFileName}`);
      
      // Show first part of response
      console.log(`  🔍 Response (first 500 chars):`);
      console.log(`  ${responseText.substring(0, 500)}${responseText.length > 500 ? '...' : ''}`);
      
      throw new Error(`Expected PDF but got ${contentType.split(';')[0]} - saved for analysis`);
    }
    
    if (!response.ok) {
      console.log(`  🔍 Error response body (first 300 chars): ${responseText.substring(0, 300)}`);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // If we got here, it should be a PDF - save it
    const buffer = Buffer.from(responseText, 'binary');
    await fs.writeFile(filePath, buffer);
    
    // Verify file was created and has content
    const stats = await fs.stat(filePath);
    if (stats.size === 0) {
      throw new Error(`Downloaded file is empty`);
    }
    
    console.log(`  ✅ Downloaded: ${path.basename(filePath)} (${stats.size} bytes)`);
    return { success: true, filePath, size: stats.size };
    
  } catch (error) {
    console.error(`  ❌ Download failed: ${error.message}`);
    
    // Clean up empty file if it exists
    try {
      await fs.unlink(filePath);
    } catch {}
    
    if (retryCount < MAX_RETRIES) {
      console.log(`  🔄 Retrying (${retryCount + 1}/${MAX_RETRIES})...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return downloadPDF(url, filePath, courseData, retryCount + 1);
    }
    
    if (!NO_BREAK_ON_ERROR) {
      throw new Error(`Failed to download ${courseData.name} after ${MAX_RETRIES} attempts: ${error.message}`);
    }
    
    return { success: false, error: error.message };
  }
}

function filterCurrentCourses(courseOutlines) {
  const currentCourses = [];
  
  for (const course of courseOutlines) {
    const effectiveTermEnd = course.fields["EffectiveTermEnd"]?.value;
    
    if (effectiveTermEnd && effectiveTermEnd.includes("Current")) {
      const currentCourse = {
        id: course.id,
        name: course.name,
        "Academic Year": course.fields["Academic Year"]?.value || null,
        "EffectiveTermEnd": course.fields["EffectiveTermEnd"]?.value || null,
        "Course Code": course.fields["Course Code"]?.value || null,
        "CourseName": course.fields["CourseName"]?.value || null,
        "EffectiveStartTerm": course.fields["EffectiveStartTerm"]?.value || null,
      };
      
      currentCourses.push(currentCourse);
    }
  }
  
  return currentCourses;
}

async function processDownloads(courseOutlines) {
  const stats = {
    processed: 0,
    downloaded: 0,
    failed: 0,
    skipped: 0,
    totalSize: 0
  };
  
  // Filter courses that have pdfUrl
  let coursesWithPDFs = courseOutlines.filter(course => 
    course.pdfUrl && typeof course.pdfUrl === 'string' && course.pdfUrl.trim()
  );
  
  console.log(`📊 Found ${coursesWithPDFs.length} courses with PDF URLs out of ${courseOutlines.length} total`);
  
  // Test mode - only process first 5
  if (TEST_MODE) {
    coursesWithPDFs = coursesWithPDFs.slice(0, 5);
    console.log(`🧪 TEST MODE: Processing only ${coursesWithPDFs.length} courses`);
  }
  
  // Log some examples
  console.log("🔍 Sample PDF URLs:");
  coursesWithPDFs.slice(0, 3).forEach((course, index) => {
    console.log(`  ${index + 1}. ${course.name}: ${course.pdfUrl}`);
  });
  
  if (SKIP_DOWNLOAD) {
    console.log("⏭️  Skipping PDF downloads as requested");
    return stats;
  }
  
  const totalItems = coursesWithPDFs.length;
  console.log(`🔄 Processing ${totalItems} PDF downloads...`);
  console.log(`🛑 Break on error: ${!NO_BREAK_ON_ERROR ? 'YES' : 'NO'}`);

  for (let i = 0; i < totalItems; i += BATCH_SIZE) {
    const batch = coursesWithPDFs.slice(i, Math.min(i + BATCH_SIZE, totalItems));
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(totalItems / BATCH_SIZE);
    
    console.log(`\n📦 Processing batch ${batchNumber}/${totalBatches} (items ${i + 1}-${Math.min(i + BATCH_SIZE, totalItems)} of ${totalItems})`);

    for (const course of batch) {
      const filename = generateSafeFilename(course);
      const filePath = path.resolve(PDF_OUTPUT_DIR, filename);
      
      try {
        // Check if file already exists
        await fs.access(filePath);
        const existingStats = await fs.stat(filePath);
        console.log(`  ⏭️  Skipping (already exists): ${filename} (${existingStats.size} bytes)`);
        stats.skipped++;
        continue;
      } catch {
        // File doesn't exist, proceed with download
      }
      
      try {
        const result = await downloadPDF(course.pdfUrl, filePath, course);
        if (result.success) {
          stats.downloaded++;
          stats.totalSize += result.size || 0;
        } else {
          stats.failed++;
        }
      } catch (error) {
        console.error(`  ❌ FATAL ERROR processing ${course.name}: ${error.message}`);
        stats.failed++;
        
        if (!NO_BREAK_ON_ERROR) {
          throw error;
        }
      }
      
      stats.processed++;
      
      // Small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`   ✅ Batch ${batchNumber} completed - Downloaded: ${stats.downloaded}, Failed: ${stats.failed}, Skipped: ${stats.skipped}`);
    
    // Delay between batches
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return stats;
}

// Main execution
async function main() {
  try {
    if (!API_KEY) {
      throw new Error("SC_APIKEY environment variable is required");
    }
    
    // Setup directories
    await ensureDir(PDF_OUTPUT_DIR);
    await ensureDir(JSON_OUTPUT_DIR);
    
    // Load course data
    console.log("📖 Loading course outlines data...");
    const courseOutlines = await loadCourseOutlines();
    console.log(`→ Loaded ${courseOutlines.length} course outlines`);
    
    // Process downloads
    const downloadStats = await processDownloads(courseOutlines);
    
    // Create filtered JSON for current courses
    console.log("\n📝 Creating filtered JSON for current courses...");
    const currentCourses = filterCurrentCourses(courseOutlines);
    
    const outputPath = path.resolve(JSON_OUTPUT_DIR, CURRENT_COURSES_FILE);
    await fs.writeFile(outputPath, JSON.stringify(currentCourses, null, 2), "utf-8");
    
    console.log(`✅ Current courses JSON saved to: ${outputPath}`);
    console.log(`📊 Current courses found: ${currentCourses.length}`);
    
    // Final summary
    console.log("\n🎉 Process completed!");
    console.log("📊 Final Statistics:");
    console.log(`   • Total courses processed: ${courseOutlines.length}`);
    console.log(`   • Current courses found: ${currentCourses.length}`);
    if (!SKIP_DOWNLOAD) {
      console.log(`   • PDFs downloaded: ${downloadStats.downloaded}`);
      console.log(`   • PDFs failed: ${downloadStats.failed}`);
      console.log(`   • PDFs skipped: ${downloadStats.skipped}`);
      console.log(`   • Total size: ${(downloadStats.totalSize / 1024 / 1024).toFixed(2)} MB`);
    }
    
  } catch (err) {
    console.error("\n❌ SCRIPT FAILED:");
    console.error("Error:", err.message);
    console.error("\n💡 Options:");
    console.error("  - Use --test flag to test with first 5 items only");
    console.error("  - Use --no-break flag to continue on errors");
    console.error("  - Use --skip-download flag to only create the filtered JSON");
    process.exit(1);
  }
}

main();