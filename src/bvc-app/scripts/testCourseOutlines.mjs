// File: ./scripts/testCourseOutlines.mjs
// Description: Test version - Fetch only 5 Course Outline items for debugging
//              Based on fetchCourseOutlines.mjs but limited to 5 items for testing

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
  'https://xmc-bowvalleyco2df9-bowvalleyco2779-development2348.sitecorecloud.io';

// 6. Destination file path (relative to project root)
const OUTPUT_DIR = "./src/data/course-outlines";
const OUTPUT_FILE = "testCourseOutlines.json";

// 7. Batch size for processing
const BATCH_SIZE = 5;

// 8. Command line arguments
const NO_BREAK_ON_ERROR = process.argv.includes('--no-break');

// ---------------------------------------------------------
// HELPER FUNCTIONS
// ---------------------------------------------------------

/**
 * Helper to perform a GraphQL request to Sitecore XM Cloud.
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
 * Fetch first 5 children only for testing
 */
async function fetchTestChildren() {
  const QUERY_CHILDREN = `
    query GetChildren($path: String!, $first: Int!) {
      item(path: $path, language: "en") {
        children(first: $first) {
          results {
            id
            name
            path
          }
        }
      }
    }
  `;

  console.log("📄 Fetching first 5 children for testing...");
  
  const variables = {
    path: ROOT_ITEM_PATH,
    first: 5, // Only get 5 items
  };

  const data = await runGraphQL(QUERY_CHILDREN, variables);
  
  if (!data.item) {
    throw new Error(`Item not found at path: ${ROOT_ITEM_PATH}`);
  }

  const children = data.item.children.results;
  console.log(`→ Retrieved ${children.length} child items for testing.`);
  
  return children;
}

/**
 * Fetch the specified fields for a single item by path.
 */
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
 * Get media item through GraphQL using different search strategies
 */
async function getMediaDownloadUrl(mediaPath) {
  if (!mediaPath || typeof mediaPath !== 'string') {
    return null;
  }

  // Extract the item name from the path for searching
  const itemName = mediaPath.split('/').pop();
  console.log(`    🔍 Searching for media item with name: ${itemName}`);

  // Strategy 1: Try by exact path
  let cleanPath = mediaPath;
  if (!cleanPath.startsWith('/sitecore/media library')) {
    cleanPath = '/sitecore/media library' + cleanPath;
  }

  const MEDIA_URL_QUERY = `
    query GetMediaUrl($path: String!) {
      item(path: $path, language: "en") {
        id
        name
        url {
          url
          path
        }
        fields {
          name
          value
        }
      }
    }
  `;

  try {
    console.log(`    🔍 Strategy 1 - Querying by path: ${cleanPath}`);
    const data = await runGraphQL(MEDIA_URL_QUERY, { path: cleanPath });
    
    if (data?.item) {
      console.log(`    ✅ Found by path! Item: ${data.item.name} (ID: ${data.item.id})`);
      return buildMediaUrl(data.item);
    }
  } catch (error) {
    console.warn(`    ⚠️  Path search failed: ${error.message}`);
  }

  // Strategy 2: Search media library root for items with matching name
  const SEARCH_MEDIA_QUERY = `
    query SearchMediaLibrary($first: Int!) {
      item(path: "/sitecore/media library", language: "en") {
        children(first: $first) {
          results {
            id
            name
            path
            url {
              url
              path
            }
            fields {
              name
              value
            }
          }
        }
      }
    }
  `;

  try {
    console.log(`    🔍 Strategy 2 - Searching media library for name: ${itemName}`);
    const searchData = await runGraphQL(SEARCH_MEDIA_QUERY, { first: 100 });
    
    if (searchData?.item?.children?.results) {
      console.log(`    📋 Found ${searchData.item.children.results.length} items in media library root:`);
      searchData.item.children.results.forEach((item, index) => {
        console.log(`      ${index + 1}. ${item.name} (${item.path})`);
      });
      
      // Look for an item with matching name
      const matchingItem = searchData.item.children.results.find(item => 
        item.name === itemName || 
        item.name.includes(itemName) ||
        itemName.includes(item.name)
      );
      
      if (matchingItem) {
        console.log(`    ✅ Found by search! Item: ${matchingItem.name} (ID: ${matchingItem.id})`);
        return buildMediaUrl(matchingItem);
      } else {
        console.log(`    ❌ No matching items found for: ${itemName}`);
      }
    } else {
      console.log(`    ❌ No children found in media library root`);
      console.log(`    🔍 Search response: ${JSON.stringify(searchData, null, 2)}`);
    }
  } catch (error) {
    console.warn(`    ⚠️  Media search failed: ${error.message}`);
  }

  // Strategy 3: Try direct ID approach if we can extract an ID pattern
  const idMatch = mediaPath.match(/\{([A-F0-9-]+)\}/i);
  if (idMatch) {
    const itemId = idMatch[1];
    console.log(`    🔍 Strategy 3 - Found ID in path: ${itemId}`);
    return `${SITECORE_BASE_URL}/api/media/${itemId}?sc_apikey=${API_KEY}`;
  }

  console.log(`    ❌ All strategies failed for: ${mediaPath}`);
  return null;
}

/**
 * Build media URL from item data
 */
function buildMediaUrl(mediaItem) {
  console.log(`    📄 Media item: ${mediaItem.name} (ID: ${mediaItem.id})`);
  console.log(`    🔗 URL field: ${JSON.stringify(mediaItem.url)}`);
  console.log(`    📋 Fields: ${mediaItem.fields?.length || 0} fields found`);
  
  // Try different URL constructions
  if (mediaItem.url?.url) {
    return `${SITECORE_BASE_URL}${mediaItem.url.url}`;
  } else if (mediaItem.url?.path) {
    return `${SITECORE_BASE_URL}${mediaItem.url.path}`;
  } else {
    // Try direct media API with item ID
    return `${SITECORE_BASE_URL}/api/media/${mediaItem.id}?sc_apikey=${API_KEY}`;
  }
}

/**
 * Convert Sitecore media library path to accessible URL
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
  
  // Try WITHOUT adding .pdf extension - let Sitecore handle it
  return `${SITECORE_BASE_URL}/api/media${cleanPath}?sc_apikey=${API_KEY}`;
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
 * Process the 5 test items
 */
async function processTestItems(children) {
  const outlines = [];
  const totalItems = children.length;
  
  console.log(`🔄 Processing ${totalItems} test items...`);
  console.log(`🛑 Break on error: ${!NO_BREAK_ON_ERROR ? 'YES' : 'NO'}`);

  for (let i = 0; i < totalItems; i++) {
    const { id, name, path: itemPath } = children[i];
    console.log(`\n📦 Processing item ${i + 1}/${totalItems}: ${name}`);
    
    try {
      const fieldsData = await fetchFieldsForItem(itemPath, name);

      // Generate PDF URL from File Path field if it exists
      let pdfUrl = null;
      const filePathField = fieldsData["File Path"];
      if (filePathField && filePathField.value) {
        try {
          // Try GraphQL method first
          pdfUrl = await getMediaDownloadUrl(filePathField.value);
          console.log(`    📄 GraphQL media URL: ${pdfUrl || 'null'}`);
        } catch (error) {
          console.warn(`    ⚠️  GraphQL media URL failed, falling back: ${error.message}`);
        }
        
        // Fallback to standard URL construction if GraphQL fails
        if (!pdfUrl) {
          pdfUrl = convertMediaPathToUrl(filePathField.value);
          console.log(`    📄 Fallback URL: ${pdfUrl}`);
        }
      }

      // Build a JSON-friendly object for this outline
      outlines.push({
        id,
        name,
        path: itemPath,
        fields: fieldsData,
        pdfUrl: pdfUrl, // Direct PDF URL for convenience
      });

      console.log(`   ✅ Item ${i + 1} completed: ${name}`);

    } catch (error) {
      console.error(`❌ FATAL ERROR processing item "${name}": ${error.message}`);
      
      if (!NO_BREAK_ON_ERROR) {
        throw error;
      } else {
        console.log(`   ⚠️  Continuing despite error...`);
      }
    }
    
    // Small delay between items
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return outlines;
}

// ---------------------------------------------------------
// MAIN
// ---------------------------------------------------------

(async () => {
  try {
    const envType = USE_DEV ? 'DEVELOPMENT' : (USE_PROD ? 'PRODUCTION' : 'PRODUCTION (default)');
    console.log(`🚀 Starting Course Outlines TEST fetch (5 items only) - ${envType}...`);
    console.log("🔍 Fetching 5 Course Outline children under:", ROOT_ITEM_PATH);
    console.log(`🌐 Environment: ${GRAPHQL_ENDPOINT}`);
    console.log(`🔑 API Key: ${API_KEY ? API_KEY.substring(0, 8) + '...' : 'NOT SET'}`);
    
    // Show command line options
    if (NO_BREAK_ON_ERROR) console.log("🛑 No break on error: ON");
    
    // Ensure output directory exists first
    await ensureOutputDir();
    
    // Fetch only 5 children for testing
    const children = await fetchTestChildren();

    if (children.length === 0) {
      console.log("⚠ No children found. Exiting.");
      return;
    }

    // Process the test items
    const outlines = await processTestItems(children);

    // Write final JSON file
    const outputPath = path.resolve(OUTPUT_DIR, OUTPUT_FILE);
    await fs.writeFile(outputPath, JSON.stringify(outlines, null, 2), "utf-8");
    
    console.log(`✅ Test course outlines data saved to: ${outputPath}`);
    console.log(`📊 Total items processed: ${outlines.length}`);
    console.log(`🎉 Test fetch completed successfully!`);
    
  } catch (err) {
    console.error("\n❌ SCRIPT FAILED:");
    console.error("Error:", err.message);
    console.error("\n💡 Recovery options:");
    console.error("  - Use --no-break flag to continue processing even on errors");
    console.error("  - Check your network connection and Sitecore API access");
    process.exit(1);
  }
})();