// File: ./scripts/sitecoreAuthDownloader.mjs
// Description: Authenticate with Sitecore and download PDFs using session cookies
//              One-time download for SSG build - uses Sitecore login credentials

import dotenv from "dotenv";

// Environment selection based on command line arguments
const USE_DEV = process.argv.includes('--dev');
const USE_PROD = process.argv.includes('--prod');

if (USE_DEV) {
  console.log("🔧 Loading DEVELOPMENT environment (.env.uat.local)");
  dotenv.config({ path: "./.env.uat.local" });
} else if (USE_PROD) {
  console.log("🔧 Loading PRODUCTION environment (.env.local)");
  dotenv.config({ path: "./.env.local" });
} else {
  console.log("🔧 No environment specified, defaulting to PRODUCTION (.env.local)");
  console.log("💡 Use --dev for development or --prod for production");
  dotenv.config({ path: "./.env.local" });
}

import fs from "fs/promises";
import path from "path";
import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";

// Configuration - these will now use the correct environment variables
const INPUT_FILE = "./src/data/course-outlines/courseOutlines.json";
const PDF_OUTPUT_DIR = "./public/data/course-outlines/pdf";
const JSON_OUTPUT_DIR = "./public/data/course-outlines";
const CURRENT_COURSES_FILE = "currentCourses.json";

// Sitecore Authentication Settings - loaded from the selected environment
const SITECORE_BASE_URL = process.env.SITECORE_GRAPHQL_ENDPOINT?.replace('/sitecore/api/graph/edge/', '') || 
  'https://xmc-bowvalleyco85c9-bowvalleyco672b-productiona2d5.sitecorecloud.io';

// Credentials from environment
const SITECORE_USERNAME = process.env.SITECORE_USERNAME;
const SITECORE_PASSWORD = process.env.SITECORE_PASSWORD;

const BATCH_SIZE = 5;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

// Command line arguments
const TEST_MODE = process.argv.includes('--test'); // Only process first 5 items
const NO_BREAK_ON_ERROR = process.argv.includes('--no-break');

console.log("🚀 Sitecore Authenticated PDF Downloader");
console.log(`🌐 Sitecore URL: ${SITECORE_BASE_URL}`);
console.log(`👤 Username: ${SITECORE_USERNAME ? SITECORE_USERNAME : 'NOT SET'}`);
console.log(`🔑 Password: ${SITECORE_PASSWORD ? '***' : 'NOT SET'}`);
if (TEST_MODE) console.log("🧪 TEST MODE: Processing only first 5 items");

if (!SITECORE_USERNAME || !SITECORE_PASSWORD) {
  console.error("❌ Please set SITECORE_USERNAME and SITECORE_PASSWORD in your .env.local file");
  process.exit(1);
}

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

/**
 * Authenticate with Sitecore and get session cookies
 */
async function authenticateWithSitecore() {
  console.log("🔐 Authenticating with Sitecore...");
  
  // Step 1: Get the login page to extract any required tokens
  const loginPageUrl = `${SITECORE_BASE_URL}/sitecore/login`;
  
  try {
    const loginPageResponse = await fetch(loginPageUrl, {
      method: 'GET',
      redirect: 'follow'
    });
    
    const loginPageHtml = await loginPageResponse.text();
    const cookies = loginPageResponse.headers.get('set-cookie') || '';
    
    console.log(`📄 Login page status: ${loginPageResponse.status}`);
    console.log(`🍪 Initial cookies: ${cookies.substring(0, 100)}...`);
    
    // Extract any CSRF tokens or validation tokens from the login page
    const csrfMatch = loginPageHtml.match(/<input[^>]*name="__RequestVerificationToken"[^>]*value="([^"]*)"[^>]*>/i);
    const viewStateMatch = loginPageHtml.match(/<input[^>]*name="__VIEWSTATE"[^>]*value="([^"]*)"[^>]*>/i);
    
    const csrfToken = csrfMatch ? csrfMatch[1] : '';
    const viewState = viewStateMatch ? viewStateMatch[1] : '';
    
    console.log(`🎫 CSRF Token: ${csrfToken ? 'Found' : 'Not found'}`);
    console.log(`👁️  ViewState: ${viewState ? 'Found' : 'Not found'}`);
    
    // Step 2: Submit login credentials
    const loginData = new URLSearchParams({
      'UserName': SITECORE_USERNAME,
      'Password': SITECORE_PASSWORD,
      ...(csrfToken && { '__RequestVerificationToken': csrfToken }),
      ...(viewState && { '__VIEWSTATE': viewState })
    });
    
    const loginResponse = await fetch(loginPageUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookies,
        'Referer': loginPageUrl
      },
      body: loginData.toString(),
      redirect: 'manual' // Don't follow redirects automatically
    });
    
    const authCookies = loginResponse.headers.get('set-cookie') || '';
    const location = loginResponse.headers.get('location') || '';
    
    console.log(`🔐 Login response: ${loginResponse.status}`);
    console.log(`🍪 Auth cookies: ${authCookies.substring(0, 100)}...`);
    console.log(`📍 Redirect location: ${location}`);
    
    if (loginResponse.status === 302 && location) {
      console.log("✅ Authentication successful!");
      return authCookies + '; ' + cookies; // Combine all cookies
    } else {
      throw new Error(`Authentication failed: ${loginResponse.status} ${loginResponse.statusText}`);
    }
    
  } catch (error) {
    console.error(`❌ Authentication failed: ${error.message}`);
    throw error;
  }
}

/**
 * Download PDF using authenticated session with multiple URL formats
 */
async function downloadPDFWithAuth(courseData, filePath, authCookies, retryCount = 0) {
  try {
    console.log(`  📥 Downloading: ${courseData.name}`);
    
    // Get the File Path field value
    const filePathField = courseData.fields["File Path"];
    if (!filePathField || !filePathField.value) {
      throw new Error("No File Path field found");
    }
    
    const mediaPath = filePathField.value;
    console.log(`  📁 Media path: ${mediaPath}`);
    
    // Generate multiple URL formats to try
    const urlsToTry = generateMediaUrls(mediaPath);
    
    for (let i = 0; i < urlsToTry.length; i++) {
      const url = urlsToTry[i];
      console.log(`  🔗 Trying URL ${i + 1}/${urlsToTry.length}: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Cookie': authCookies,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/pdf,application/octet-stream,*/*',
          'Referer': `${SITECORE_BASE_URL}/sitecore/shell`
        }
      });
      
      console.log(`    📊 Response: ${response.status} ${response.statusText}`);
      console.log(`    📋 Content-Type: ${response.headers.get('content-type')}`);
      
      const contentType = response.headers.get('content-type');
      
      // Check if we got a PDF
      if (response.ok && contentType && (contentType.includes('application/pdf') || contentType.includes('application/octet-stream'))) {
        console.log(`    ✅ Found PDF! Using URL format ${i + 1}`);
        
        // Stream the download to file
        const fileStream = createWriteStream(filePath);
        await pipeline(response.body, fileStream);
        
        // Verify file was created and has content
        const stats = await fs.stat(filePath);
        if (stats.size === 0) {
          throw new Error(`Downloaded file is empty`);
        }
        
        console.log(`  ✅ Downloaded: ${path.basename(filePath)} (${stats.size} bytes)`);
        return { success: true, filePath, size: stats.size };
      } else {
        // Log first part of response for debugging
        const responseText = await response.text();
        console.log(`    ❌ URL ${i + 1} failed - got ${contentType} (${responseText.substring(0, 100)}...)`);
      }
    }
    
    throw new Error(`All URL formats failed for ${courseData.name}`);
    
  } catch (error) {
    console.error(`  ❌ Download failed: ${error.message}`);
    
    // Clean up empty file if it exists
    try {
      await fs.unlink(filePath);
    } catch {}
    
    if (retryCount < MAX_RETRIES) {
      console.log(`  🔄 Retrying (${retryCount + 1}/${MAX_RETRIES})...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return downloadPDFWithAuth(courseData, filePath, authCookies, retryCount + 1);
    }
    
    if (!NO_BREAK_ON_ERROR) {
      throw new Error(`Failed to download ${courseData.name} after ${MAX_RETRIES} attempts: ${error.message}`);
    }
    
    return { success: false, error: error.message };
  }
}

/**
 * Generate multiple URL formats to try for Sitecore media access
 */
function generateMediaUrls(mediaPath) {
  // Clean the path
  let cleanPath = mediaPath.replace(/^\/sitecore\/media library/i, '');
  
  // Ensure path starts with /
  if (!cleanPath.startsWith('/')) {
    cleanPath = '/' + cleanPath;
  }
  
  // Generate multiple URL formats that might work with Sitecore XM Cloud
  const urls = [
    // Format 1: Raw path (what works in browser) - PRIORITIZE THIS
    `${SITECORE_BASE_URL}/-/media${cleanPath}`,
    
    // Format 2: Traditional Sitecore media handler with .ashx
    `${SITECORE_BASE_URL}/-/media${cleanPath}.ashx`,
    
    // Format 3: Traditional Sitecore media handler with .ashx and extension
    `${SITECORE_BASE_URL}/-/media${cleanPath}.ashx?ext=pdf`,
    
    // Format 4: Sitecore media handler without .ashx but with .pdf
    `${SITECORE_BASE_URL}/-/media${cleanPath}.pdf`,
    
    // Format 5: Direct sitecore/media path
    `${SITECORE_BASE_URL}/sitecore/media${cleanPath}.pdf`,
    
    // Format 6: XM Cloud specific media endpoint
    `${SITECORE_BASE_URL}/api/media${cleanPath}`,
    
    // Format 7: Media with download parameter
    `${SITECORE_BASE_URL}/-/media${cleanPath}.ashx?download=1`,
    
    // Format 8: With language parameter
    `${SITECORE_BASE_URL}/-/media${cleanPath}.ashx?la=en`,
    
    // Format 9: Traditional with database parameter
    `${SITECORE_BASE_URL}/-/media${cleanPath}.ashx?database=master`,
    
    // Format 10: With both extension and download parameters
    `${SITECORE_BASE_URL}/-/media${cleanPath}.ashx?ext=pdf&download=1`
  ];
  
  return urls;
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

async function processDownloads(courseOutlines, authCookies) {
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
  
  const totalItems = coursesWithPDFs.length;
  console.log(`🔄 Processing ${totalItems} PDF downloads with authentication...`);

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
        const result = await downloadPDFWithAuth(course, filePath, authCookies);
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
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`   ✅ Batch ${batchNumber} completed - Downloaded: ${stats.downloaded}, Failed: ${stats.failed}, Skipped: ${stats.skipped}`);
    
    // Longer delay between batches to be nice to Sitecore
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return stats;
}

// Main execution
async function main() {
  try {
    // Setup directories
    await ensureDir(PDF_OUTPUT_DIR);
    await ensureDir(JSON_OUTPUT_DIR);
    
    // Load course data
    console.log("📖 Loading course outlines data...");
    const courseOutlines = await loadCourseOutlines();
    console.log(`→ Loaded ${courseOutlines.length} course outlines`);
    
    // Authenticate with Sitecore
    const authCookies = await authenticateWithSitecore();
    
    // Process downloads
    const downloadStats = await processDownloads(courseOutlines, authCookies);
    
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
    console.log(`   • PDFs downloaded: ${downloadStats.downloaded}`);
    console.log(`   • PDFs failed: ${downloadStats.failed}`);
    console.log(`   • PDFs skipped: ${downloadStats.skipped}`);
    console.log(`   • Total size: ${(downloadStats.totalSize / 1024 / 1024).toFixed(2)} MB`);
    
  } catch (err) {
    console.error("\n❌ SCRIPT FAILED:");
    console.error("Error:", err.message);
    console.error("\n💡 Setup required:");
    console.error("  - Add SITECORE_USERNAME and SITECORE_PASSWORD to your .env.local file");
    console.error("  - Use --test flag to test with first 5 items only");
    console.error("  - Use --no-break flag to continue on errors");
    process.exit(1);
  }
}

main();