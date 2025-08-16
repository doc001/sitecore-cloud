// File: ./scripts/simpleBrowserDownloader.mjs
// Description: Simple approach - manually paste your browser cookies and download PDFs
//              Since your browser authentication works, we'll use those session cookies

import dotenv from "dotenv";
dotenv.config({ path: "./.env.uat.local" }); // Use development

import fs from "fs/promises";
import path from "path";
import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";

// Configuration
const INPUT_FILE = "./src/data/course-outlines/courseOutlines.json";
const PDF_OUTPUT_DIR = "./public/data/course-outlines/pdf";

// Development Sitecore URL
const SITECORE_BASE_URL = "https://xmc-bowvalleyco2df9-bowvalleyco2779-development2348.sitecorecloud.io";

// You'll need to paste your browser cookies here (see instructions below)
const BROWSER_COOKIES = `bid_1cc5231e2655eea6c724058e362f8e2a=8c925461-4fd7-4d8a-9da1-45169e238b69; apt.uid=AP-BR1SACAOWQ2G-2-1751311608921-98172241.0.2.876053dc-5b56-4e03-9b7b-d6c94f9dcc4a; scContentEditorFoldersWidth=397; shell#lang=en; sc_fv=0.0.0; apt.sid=AP-BR1SACAOWQ2G-2-1751777780764-95129389`;

// Command line arguments
const TEST_MODE = process.argv.includes('--test');

console.log("🚀 Simple Browser Cookie PDF Downloader");
console.log(`🌐 Sitecore URL: ${SITECORE_BASE_URL}`);
console.log(`🍪 Cookies: ${BROWSER_COOKIES.trim() ? 'SET' : 'NOT SET - PLEASE ADD COOKIES'}`);
if (TEST_MODE) console.log("🧪 TEST MODE: Processing only first 5 items");

if (!BROWSER_COOKIES.trim() || BROWSER_COOKIES.includes('PASTE_YOUR_BROWSER_COOKIES_HERE')) {
  console.error(`
❌ BROWSER COOKIES NOT SET!

📋 Instructions to get your browser cookies:

1. Open your browser and log into Sitecore
2. Go to this URL (it will download a PDF):
   ${SITECORE_BASE_URL}/-/media/BVC/BVC/Data/CMSData/CourseOutlines/ACCT1103Introduction%20to%20Financial%20AccountingFall%202020Winter%202021

3. Open Developer Tools (F12) → Application/Storage tab
4. Click on "Cookies" → Select the Sitecore domain
5. Copy ALL cookie values in this format:
   cookieName1=cookieValue1; cookieName2=cookieValue2; cookieName3=cookieValue3

6. Paste them in this script replacing PASTE_YOUR_BROWSER_COOKIES_HERE

Common Sitecore cookies to look for:
- ASP.NET_SessionId
- .ASPXAUTH
- SC_ANALYTICS_GLOBAL_COOKIE
- Auth0 related cookies
- Any cookies with "sitecore" in the name
  `);
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

function generatePDFUrl(mediaPath) {
  // Remove /sitecore/media library prefix
  let cleanPath = mediaPath.replace(/^\/sitecore\/media library/i, '');
  
  // Ensure path starts with /
  if (!cleanPath.startsWith('/')) {
    cleanPath = '/' + cleanPath;
  }
  
  // Use the exact format that works in your browser
  return `${SITECORE_BASE_URL}/-/media${cleanPath}`;
}

async function downloadPDF(courseData, filePath) {
  try {
    const filePathField = courseData.fields["File Path"];
    if (!filePathField || !filePathField.value) {
      throw new Error("No File Path field found");
    }
    
    const url = generatePDFUrl(filePathField.value);
    
    console.log(`  📥 Downloading: ${courseData.name}`);
    console.log(`  🔗 URL: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Upgrade-Insecure-Requests': '1',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
      }
    });
    
    console.log(`  📊 Response: ${response.status} ${response.statusText}`);
    console.log(`  📋 Content-Type: ${response.headers.get('content-type')}`);
    console.log(`  📏 Content-Length: ${response.headers.get('content-length') || 'unknown'}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    
    // Check if we got a PDF
    if (contentType && (contentType.includes('application/pdf') || contentType.includes('application/octet-stream'))) {
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
      // If we get HTML, show first part for debugging
      const responseText = await response.text();
      console.log(`  🔍 Non-PDF Response (first 200 chars): ${responseText.substring(0, 200)}...`);
      
      if (responseText.includes('login') || responseText.includes('Login')) {
        throw new Error(`Session expired - got login page instead of PDF`);
      } else {
        throw new Error(`Expected PDF but got ${contentType}`);
      }
    }
    
  } catch (error) {
    console.error(`  ❌ Download failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function processDownloads(courseOutlines) {
  const stats = {
    processed: 0,
    downloaded: 0,
    failed: 0,
    skipped: 0,
    totalSize: 0
  };
  
  // Filter courses that have File Path field
  let coursesWithFiles = courseOutlines.filter(course => {
    const filePathField = course.fields["File Path"];
    return filePathField && filePathField.value && filePathField.value.trim();
  });
  
  console.log(`📊 Found ${coursesWithFiles.length} courses with File Path field out of ${courseOutlines.length} total`);
  
  // Test mode - only process first 5
  if (TEST_MODE) {
    coursesWithFiles = coursesWithFiles.slice(0, 5);
    console.log(`🧪 TEST MODE: Processing only ${coursesWithFiles.length} courses`);
  }
  
  const totalItems = coursesWithFiles.length;
  console.log(`🔄 Processing ${totalItems} PDF downloads using browser cookies...`);

  for (let i = 0; i < totalItems; i++) {
    const course = coursesWithFiles[i];
    const filename = generateSafeFilename(course);
    const filePath = path.resolve(PDF_OUTPUT_DIR, filename);
    
    console.log(`\n📦 Processing item ${i + 1}/${totalItems}: ${course.name}`);
    
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
    
    const result = await downloadPDF(course, filePath);
    if (result.success) {
      stats.downloaded++;
      stats.totalSize += result.size || 0;
    } else {
      stats.failed++;
    }
    
    stats.processed++;
    
    // Small delay between downloads
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return stats;
}

// Main execution
async function main() {
  try {
    // Setup directories
    await ensureDir(PDF_OUTPUT_DIR);
    
    // Load course data
    console.log("📖 Loading course outlines data...");
    const courseOutlines = await loadCourseOutlines();
    console.log(`→ Loaded ${courseOutlines.length} course outlines`);
    
    // Process downloads
    const downloadStats = await processDownloads(courseOutlines);
    
    // Final summary
    console.log("\n🎉 Process completed!");
    console.log("📊 Final Statistics:");
    console.log(`   • Total courses processed: ${courseOutlines.length}`);
    console.log(`   • PDFs downloaded: ${downloadStats.downloaded}`);
    console.log(`   • PDFs failed: ${downloadStats.failed}`);
    console.log(`   • PDFs skipped: ${downloadStats.skipped}`);
    console.log(`   • Total size: ${(downloadStats.totalSize / 1024 / 1024).toFixed(2)} MB`);
    
  } catch (err) {
    console.error("\n❌ SCRIPT FAILED:");
    console.error("Error:", err.message);
    process.exit(1);
  }
}

main();