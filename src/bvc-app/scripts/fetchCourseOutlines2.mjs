// File: ./scripts/fetchCourseOutlines.mjs
// Description: Fetch all Course Outline items under the specified Sitecore path,
//              retrieve selected fields, and save as JSON to ./src/data/course-outlines.
//              Enhanced with both path-based and ID-based .ashx URL generation.

import dotenv from "dotenv";
dotenv.config({ path: "./local.env" });
dotenv.config({ path: "./.env.local" });

import fs from "fs/promises";
import path from "path";

// ---------------------------------------------------------
// CONFIGURATION
// ---------------------------------------------------------

const GRAPHQL_ENDPOINT = process.env.SITECORE_GRAPHQL_ENDPOINT;
if (!GRAPHQL_ENDPOINT) {
  console.error("✖ Please set SITECORE_GRAPHQL_ENDPOINT in local.env or .env.local.");
  process.exit(1);
}

const API_KEY = process.env.SC_APIKEY || "";
const ROOT_ITEM_PATH = "/sitecore/content/BVC/BVC/Data/CMSData/CourseOutlines";

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

const SITECORE_BASE_URL = process.env.SITECORE_GRAPHQL_ENDPOINT?.replace('/sitecore/api/graph/edge/', '') || 
  'https://xmc-bowvalleyco85c9-bowvalleyco672b-productiona2d5.sitecorecloud.io';

const OUTPUT_DIR = "./src/data/course-outlines";
const OUTPUT_FILE = "courseOutlines.json";
const CURSOR_FILE = "fetchCursor.json";
const BATCH_SIZE = 50;

const SHOULD_RESUME = process.argv.includes('--resume');
const NO_BREAK_ON_ERROR = process.argv.includes('--no-break');

// ---------------------------------------------------------
// URL GENERATION FUNCTIONS
// ---------------------------------------------------------

/**
 * Convert Sitecore media library path to accessible URL
 */
function convertMediaPathToUrl(mediaPath) {
  if (!mediaPath || typeof mediaPath !== 'string') return null;
  
  let cleanPath = mediaPath.replace(/^\/sitecore\/media library/i, '');
  if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;
  
  return `${SITECORE_BASE_URL}/-/media${cleanPath}`;
}

/**
 * Generate .ashx URL using item ID (the working pattern you discovered)
 */
function generateAshxUrlFromId(itemId) {
  if (!itemId) return null;
  
  const cleanId = itemId.replace(/[{}]/g, '').toUpperCase();
  return `${SITECORE_BASE_URL}/sitecore/shell/themes/standard/-/media/${cleanId}.ashx`;
}

/**
 * Generate comprehensive URL options for a course outline item
 */
function generateAllUrlOptions(itemId, filePath) {
  const urls = {
    // ID-based URLs (usually more reliable)
    idAshx: generateAshxUrlFromId(itemId),
    idAshxInline: generateAshxUrlFromId(itemId) + '?disposition=inline',
    idAshxWithKey: generateAshxUrlFromId(itemId) + `?sc_apikey=${API_KEY}`,
    idAshxInlineWithKey: generateAshxUrlFromId(itemId) + `?disposition=inline&sc_apikey=${API_KEY}`,
    
    // Path-based URLs (if File Path is available)
    pathBased: filePath ? convertMediaPathToUrl(filePath) : null,
    pathBasedInline: filePath ? convertMediaPathToUrl(filePath) + '?disposition=inline' : null,
  };
  
  // Remove null values
  return Object.fromEntries(Object.entries(urls).filter(([_, v]) => v !== null));
}

// ---------------------------------------------------------
// GRAPHQL FUNCTIONS
// ---------------------------------------------------------

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

async function fetchAllChildren() {
  const children = [];
  let hasNextPage = true;
  let endCursor = null;

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
      first: 20,
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

async function fetchFieldsForItem(itemPath, itemName) {
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
    const fieldMap = {};
    
    for (const field of allFields) {
      fieldMap[field.name] = {
        value: field.value,
        jsonValue: field.jsonValue,
      };
    }

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

function createEmptyFieldsResult() {
  const result = {};
  for (const fname of FIELD_NAMES) {
    result[fname] = { value: null, jsonValue: null };
  }
  return result;
}

// ---------------------------------------------------------
// FILE SYSTEM FUNCTIONS
// ---------------------------------------------------------

async function ensureOutputDir() {
  const dirPath = path.resolve(OUTPUT_DIR);
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

async function saveCursor(processedCount, totalCount) {
  const cursorData = {
    processedCount,
    totalCount,
    timestamp: new Date().toISOString(),
  };
  
  const cursorPath = path.resolve(OUTPUT_DIR, CURSOR_FILE);
  await fs.writeFile(cursorPath, JSON.stringify(cursorData, null, 2), "utf-8");
}

async function loadCursor() {
  try {
    const cursorPath = path.resolve(OUTPUT_DIR, CURSOR_FILE);
    const cursorData = await fs.readFile(cursorPath, "utf-8");
    return JSON.parse(cursorData);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------
// MAIN PROCESSING
// ---------------------------------------------------------

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

        // Get File Path for URL generation
        const filePath = fieldsData["File Path"]?.value;
        
        // Generate all possible URL options
        const urlOptions = generateAllUrlOptions(id, filePath);

        // Build the final object
        outlines.push({
          id,
          name,
          path: itemPath,
          fields: fieldsData,
          
          // URL options for accessing the PDF
          urls: urlOptions,
          
          // Recommended URLs (prioritize ID-based .ashx)
          recommendedUrl: urlOptions.idAshxInline || urlOptions.idAshx,
          fallbackUrl: urlOptions.pathBasedInline || urlOptions.pathBased,
        });

      } catch (error) {
        console.error(`❌ FATAL ERROR processing item "${name}": ${error.message}`);
        console.error(`🛑 Stopping at item ${i + outlines.length + 1} of ${totalItems}`);
        
        await saveCursor(i + outlines.length, totalItems);
        throw error;
      }
    }

    await saveCursor(i + batch.length, totalItems);
    console.log(`   ✅ Batch ${batchNumber} completed successfully`);
    
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
    
    if (SHOULD_RESUME) console.log("📍 Resume mode: ON");
    if (NO_BREAK_ON_ERROR) console.log("🛑 No break on error: ON");
    
    await ensureOutputDir();
    
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

    const children = await fetchAllChildren();
    console.log(`→ Retrieved ${children.length} child items.`);

    if (children.length === 0) {
      console.log("⚠ No children found. Exiting.");
      return;
    }

    const outlines = await processItemsInBatches(children, startIndex);

    const outputPath = path.resolve(OUTPUT_DIR, OUTPUT_FILE);
    await fs.writeFile(outputPath, JSON.stringify(outlines, null, 2), "utf-8");
    
    try {
      const cursorPath = path.resolve(OUTPUT_DIR, CURSOR_FILE);
      await fs.unlink(cursorPath);
      console.log("🧹 Cleaned up progress cursor file");
    } catch {
      // Fine if cursor file doesn't exist
    }

    console.log(`✅ Course outlines data saved to: ${outputPath}`);
    console.log(`📊 Total items processed: ${outlines.length}`);
    console.log(`🎉 Fetch completed successfully!`);
    
    // Show example URLs
    if (outlines.length > 0) {
      const example = outlines[0];
      console.log(`\n📄 Example URLs for "${example.name}":`);
      console.log(`🔗 Recommended: ${example.recommendedUrl}`);
      console.log(`🔗 Fallback: ${example.fallbackUrl || 'N/A'}`);
      console.log(`\n💡 Test URLs with: node ./scripts/testAshxUrls.mjs ${example.id}`);
    }
    
  } catch (err) {
    console.error("\n❌ SCRIPT FAILED:");
    console.error("Error:", err.message);
    console.error("\n💡 Recovery options:");
    console.error("  - Use --resume flag to continue from where the script left off");
    console.error("  - Use --no-break flag to continue processing even on errors");
    console.error("  - Test URLs with: node ./scripts/testAshxUrls.mjs --sample");
    process.exit(1);
  }
})();