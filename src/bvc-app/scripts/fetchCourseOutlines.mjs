// File: ./scripts/fetchCourseOutlines.mjs
// Description: Fetch all Course Outline items under the specified Sitecore path,
//              retrieve selected fields, and save as JSON to ./src/data/course-outlines.
//              Loads environment variables from both `local.env` and `.env.local` via dotenv.
//              Fixed to work with Sitecore XMC GraphQL API limitations.

// Usage:
//   1. Ensure you have Node.js 18+ (supports global fetch).
//   2. Install dependencies if you haven't already:
//        npm install dotenv
//   3. Create a `local.env` (or `.env.local`) at project root containing:
//        SITECORE_GRAPHQL_ENDPOINT=https://xmc-bowvalleyco2df9-bowvalleyco2779-development2348.sitecorecloud.io/sitecore/api/graph/edge/
//        SC_APIKEY=7A236BA0-B9F9-4DC8-8731-5D9F2F2A58D2
//   4. From project root, run:
//        node ./scripts/fetchCourseOutlines.mjs
//        node ./scripts/fetchCourseOutlines.mjs --resume    (to resume from cursor)
//        node ./scripts/fetchCourseOutlines.mjs --no-break  (continue on errors)
//   5. Output JSON will be written to ./src/data/course-outlines/courseOutlines.json

import dotenv from "dotenv";
// Load from local.env first, then fall back to .env.local
dotenv.config({ path: "./local.env" });
dotenv.config({ path: "./.env.local" });

import fs from "fs/promises";
import path from "path";

// ---------------------------------------------------------
// CONFIGURATION
// ---------------------------------------------------------

// 1. GraphQL endpoint for Sitecore XM Cloud Delivery API
const GRAPHQL_ENDPOINT = process.env.SITECORE_GRAPHQL_ENDPOINT;
if (!GRAPHQL_ENDPOINT) {
  console.error(
    "✖ Please set SITECORE_GRAPHQL_ENDPOINT in local.env or .env.local."
  );
  process.exit(1);
}

// 2. API key / token header (loaded from environment)
const API_KEY = process.env.SC_APIKEY || "";

// 3. Root folder path whose children we want to enumerate
const ROOT_ITEM_PATH = "/sitecore/content/BVC/BVC/Data/CMSData/CourseOutlines";

// 4. Desired field names to extract from each CourseOutlineDocument
const FIELD_NAMES = [
  "Academic Year",
  "EffectiveTermEnd",
  "SchoolName",
  "Course Code",
  "CourseName",
  "EffectiveStartTerm",
  "Description",
  "Extension",
  "File Path",
];

// 5. Base URL for your Sitecore instance (for PDF URLs)
const SITECORE_BASE_URL = process.env.SITECORE_GRAPHQL_ENDPOINT?.replace('/sitecore/api/graph/edge/', '') || 
  'https://xmc-bowvalleyco85c9-bowvalleyco672b-productiona2d5.sitecorecloud.io';

// 6. Destination file path (relative to project root)
const OUTPUT_DIR = "./src/data/course-outlines";
const OUTPUT_FILE = "courseOutlines.json";
const CURSOR_FILE = "fetchCursor.json";

// 7. Batch size for processing (to avoid memory issues with large datasets)
const BATCH_SIZE = 50;

// 8. Command line arguments
const SHOULD_RESUME = process.argv.includes('--resume');
const NO_BREAK_ON_ERROR = process.argv.includes('--no-break');

// ---------------------------------------------------------
// HELPER FUNCTIONS
// ---------------------------------------------------------

/**
 * Helper to perform a GraphQL request to Sitecore XM Cloud.
 * Uses the `sc_apikey` header for authentication if provided.
 * @param {string} query - The GraphQL query string.
 * @param {object} variables - Query variables (if any).
 * @returns {Promise<any>} - Parsed JSON response from GraphQL.
 */
async function runGraphQL(query, variables = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(API_KEY && { sc_apikey: API_KEY }),
  };

  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`GraphQL request failed: ${response.status} ${text}`);
    }

    const json = await response.json();
    if (json.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(json.errors, null, 2)}`);
    }
    return json.data;
  } catch (error) {
    console.error("❌ GraphQL Request Error:", error.message);
    throw error;
  }
}

/**
 * Fetch all direct children under a given item path, handling pagination (20 items per page).
 * @returns {Promise<Array<{ id: string; name: string; path: string }>>}
 */
async function fetchAllChildren() {
  const children = [];
  let hasNextPage = true;
  let endCursor = null;

  // Fixed query for Sitecore XMC GraphQL API
  const QUERY_CHILDREN = `
    query GetChildren($path: String!, $first: Int!, $after: String) {
      item(path: $path, language: "en") {
        children(first: $first, after: $after) {
          pageInfo {
            hasNext
            endCursor
          }
          results {
            id
            name
            path
          }
        }
      }
    }
  `;

  console.log("📄 Starting to fetch children with pagination...");
  let pageCount = 0;

  while (hasNextPage) {
    pageCount++;
    console.log(`   → Fetching page ${pageCount}...`);
    
    const variables = {
      path: ROOT_ITEM_PATH,
      first: 20, // Sitecore XMC limit
      after: endCursor,
    };

    const data = await runGraphQL(QUERY_CHILDREN, variables);
    
    if (!data.item) {
      throw new Error(`Item not found at path: ${ROOT_ITEM_PATH}`);
    }

    const childrenPage = data.item.children.results;
    children.push(...childrenPage);

    hasNextPage = data.item.children.pageInfo.hasNext;
    endCursor = data.item.children.pageInfo.endCursor;

    console.log(`   → Page ${pageCount}: ${childrenPage.length} items (Total: ${children.length})`);
  }

  return children;
}

/**
 * Fetch the specified fields for a single item by path.
 * @param {string} itemPath
 * @param {string} itemName
 * @returns {Promise<Record<string, any>>} - An object mapping FIELD_NAMES to their values.
 */
async function fetchFieldsForItem(itemPath, itemName) {
  // Simple query without MediaItem type - just get basic fields
  const QUERY_FIELDS = `
    query GetFields($path: String!) {
      item(path: $path, language: "en") {
        fields {
          name
          value
          jsonValue
        }
      }
    }
  `;

  try {
    const data = await runGraphQL(QUERY_FIELDS, { path: itemPath });
    
    if (!data.item) {
      console.warn(`   ⚠ Item not found at path: ${itemPath}`);
      return createEmptyFieldsResult();
    }

    const allFields = data.item.fields;

    // Build a map from field name -> value/jsonValue
    const fieldMap = {};
    for (const field of allFields) {
      fieldMap[field.name] = {
        value: field.value,
        jsonValue: field.jsonValue,
      };
    }

    // Only keep desired fields; if missing, set both to null
    const result = {};
    for (const fname of FIELD_NAMES) {
      if (fieldMap[fname] !== undefined) {
        result[fname] = fieldMap[fname];
      } else {
        result[fname] = { value: null, jsonValue: null };
      }
    }

    return result;
  } catch (error) {
    const errorMsg = `Error fetching fields for "${itemName}": ${error.message}`;
    console.error(`   ❌ ${errorMsg}`);
    
    if (!NO_BREAK_ON_ERROR) {
      throw new Error(errorMsg);
    }
    
    return createEmptyFieldsResult();
  }
}

/**
 * Create empty fields result for items that can't be fetched
 */
function createEmptyFieldsResult() {
  const result = {};
  for (const fname of FIELD_NAMES) {
    result[fname] = { value: null, jsonValue: null };
  }
  return result;
}

/**
 * Convert Sitecore media library path to accessible URL
 * @param {string} mediaPath - The media library path from Sitecore
 * @returns {string} - The accessible URL for the media item
 */
function convertMediaPathToUrl(mediaPath) {
  if (!mediaPath || typeof mediaPath !== 'string') {
    return null;
  }

  // Remove /sitecore/media library prefix and convert to URL
  let cleanPath = mediaPath.replace(/^\/sitecore\/media library/i, '');
  
  // Ensure path starts with /
  if (!cleanPath.startsWith('/')) {
    cleanPath = '/' + cleanPath;
  }
  
  // Construct the media URL - most common pattern for Sitecore XM Cloud
  return `${SITECORE_BASE_URL}/-/media${cleanPath}`;
}

/**
 * Ensure the output directory exists (create if missing).
 */
async function ensureOutputDir() {
  const dirPath = path.resolve(OUTPUT_DIR);
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Save progress cursor to resume processing if interrupted
 */
async function saveCursor(processedCount, totalCount) {
  const cursorData = {
    processedCount,
    totalCount,
    timestamp: new Date().toISOString(),
  };
  
  const cursorPath = path.resolve(OUTPUT_DIR, CURSOR_FILE);
  await fs.writeFile(cursorPath, JSON.stringify(cursorData, null, 2), "utf-8");
}

/**
 * Load progress cursor to resume processing
 */
async function loadCursor() {
  try {
    const cursorPath = path.resolve(OUTPUT_DIR, CURSOR_FILE);
    const cursorData = await fs.readFile(cursorPath, "utf-8");
    return JSON.parse(cursorData);
  } catch {
    return null; // No cursor file exists
  }
}

/**
 * Process items in batches to avoid memory issues and provide progress updates
 */
async function processItemsInBatches(children, startIndex = 0) {
  const outlines = [];
  const totalItems = children.length;
  
  console.log(`🔄 Processing ${totalItems - startIndex} items in batches of ${BATCH_SIZE}...`);
  console.log(`🛑 Break on error: ${!NO_BREAK_ON_ERROR ? 'YES' : 'NO'}`);

  for (let i = startIndex; i < totalItems; i += BATCH_SIZE) {
    const batch = children.slice(i, Math.min(i + BATCH_SIZE, totalItems));
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil((totalItems - startIndex) / BATCH_SIZE);
    
    console.log(`\n📦 Processing batch ${batchNumber}/${totalBatches} (items ${i + 1}-${Math.min(i + BATCH_SIZE, totalItems)} of ${totalItems})`);

    for (const { id, name, path: itemPath } of batch) {
      console.log(`  • Fetching fields for item "${name}"...`);
      
      try {
        const fieldsData = await fetchFieldsForItem(itemPath, name);

        // Generate PDF URL from File Path field if it exists
        let pdfUrl = null;
        const filePathField = fieldsData["File Path"];
        if (filePathField && filePathField.value) {
          pdfUrl = convertMediaPathToUrl(filePathField.value);
        }

        // Build a JSON-friendly object for this outline
        outlines.push({
          id,
          name,
          path: itemPath,
          fields: fieldsData,
          pdfUrl: pdfUrl, // Direct PDF URL for convenience
        });

      } catch (error) {
        console.error(`❌ FATAL ERROR processing item "${name}": ${error.message}`);
        console.error(`🛑 Stopping at item ${i + outlines.length + 1} of ${totalItems}`);
        
        // Save progress before stopping
        await saveCursor(i + outlines.length, totalItems);
        throw error;
      }
    }

    // Save progress after each successful batch
    await saveCursor(i + batch.length, totalItems);
    console.log(`   ✅ Batch ${batchNumber} completed successfully`);
    
    // Small delay to be nice to the API
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return outlines;
}

// ---------------------------------------------------------
// MAIN
// ---------------------------------------------------------

(async () => {
  try {
    console.log("🚀 Starting Course Outlines data fetch...");
    console.log("🔍 Fetching all Course Outline children under:", ROOT_ITEM_PATH);
    
    // Show command line options
    if (SHOULD_RESUME) console.log("📍 Resume mode: ON");
    if (NO_BREAK_ON_ERROR) console.log("🛑 No break on error: ON");
    
    // Ensure output directory exists first
    await ensureOutputDir();
    
    // Check if we have a previous cursor to resume from
    const cursor = await loadCursor();
    let startIndex = 0;
    
    if (cursor) {
      console.log(`📍 Found previous progress: ${cursor.processedCount}/${cursor.totalCount} items processed`);
      if (SHOULD_RESUME) {
        startIndex = cursor.processedCount;
        console.log(`🔄 Resuming from item ${startIndex + 1}...`);
      } else {
        console.log("💡 Use --resume flag to continue from where you left off, or continuing with fresh start...");
      }
    }

    // Fetch all children
    const children = await fetchAllChildren();
    console.log(`→ Retrieved ${children.length} child items.`);

    if (children.length === 0) {
      console.log("⚠ No children found. Exiting.");
      return;
    }

    // Process items in batches
    const outlines = await processItemsInBatches(children, startIndex);

    // Write final JSON file
    const outputPath = path.resolve(OUTPUT_DIR, OUTPUT_FILE);
    await fs.writeFile(outputPath, JSON.stringify(outlines, null, 2), "utf-8");
    
    // Clean up cursor file on successful completion
    try {
      const cursorPath = path.resolve(OUTPUT_DIR, CURSOR_FILE);
      await fs.unlink(cursorPath);
      console.log("🧹 Cleaned up progress cursor file");
    } catch {
      // Cursor file might not exist, that's fine
    }

    console.log(`✅ Course outlines data saved to: ${outputPath}`);
    console.log(`📊 Total items processed: ${outlines.length}`);
    console.log(`🎉 Fetch completed successfully!`);
    
  } catch (err) {
    console.error("\n❌ SCRIPT FAILED:");
    console.error("Error:", err.message);
    console.error("\n💡 Recovery options:");
    console.error("  - Use --resume flag to continue from where the script left off");
    console.error("  - Use --no-break flag to continue processing even on errors");
    console.error("  - Check your network connection and Sitecore API access");
    process.exit(1);
  }
})();