// File: ./scripts/testAshxUrls.mjs
// Description: Test utility to generate and test Sitecore media URLs using item ID with .ashx extension
//              This tests the pattern: /-/media/ITEMID.ashx

import dotenv from "dotenv";
dotenv.config({ path: "./local.env" });
dotenv.config({ path: "./.env.local" });

import fs from "fs/promises";

// ---------------------------------------------------------
// CONFIGURATION
// ---------------------------------------------------------

const SITECORE_BASE_URL = process.env.SITECORE_GRAPHQL_ENDPOINT?.replace('/sitecore/api/graph/edge/', '') || 
  'https://xmc-bowvalleyco2df9-bowvalleyco2779-development2348.sitecorecloud.io';

const API_KEY = process.env.SC_APIKEY || "";

// ---------------------------------------------------------
// URL GENERATION FUNCTIONS
// ---------------------------------------------------------

/**
 * Generate .ashx URL using item ID
 * @param {string} itemId - The Sitecore item ID (GUID)
 * @returns {string} - The .ashx URL for the media item
 */
function generateAshxUrlFromId(itemId) {
  if (!itemId) return null;
  
  // Remove any curly braces from GUID and ensure uppercase
  const cleanId = itemId.replace(/[{}]/g, '').toUpperCase();
  
  // Generate the .ashx URL pattern
  return `${SITECORE_BASE_URL}/-/media/${cleanId}.ashx`;
}

/**
 * Generate multiple URL variants for testing
 * @param {string} itemId - The Sitecore item ID
 * @returns {object} - Object with different URL variants
 */
function generateUrlVariants(itemId) {
  if (!itemId) return null;
  
  const cleanId = itemId.replace(/[{}]/g, '').toUpperCase();
  
  return {
    // ID-based .ashx URL (what you discovered works)
    idAshx: `${SITECORE_BASE_URL}/-/media/${cleanId}.ashx`,
    
    // ID-based .ashx with inline disposition
    idAshxInline: `${SITECORE_BASE_URL}/-/media/${cleanId}.ashx?disposition=inline`,
    
    // ID-based .ashx with API key
    idAshxWithKey: `${SITECORE_BASE_URL}/-/media/${cleanId}.ashx?sc_apikey=${API_KEY}`,
    
    // ID-based .ashx with both
    idAshxInlineWithKey: `${SITECORE_BASE_URL}/-/media/${cleanId}.ashx?disposition=inline&sc_apikey=${API_KEY}`,
    
    // Alternative tilde prefix
    tildeIdAshx: `${SITECORE_BASE_URL}/~/media/${cleanId}.ashx`,
    
    // Alternative tilde with inline
    tildeIdAshxInline: `${SITECORE_BASE_URL}/~/media/${cleanId}.ashx?disposition=inline`,
  };
}

/**
 * Test if a URL is accessible
 * @param {string} url - The URL to test
 * @returns {Promise<object>} - Test result
 */
async function testUrlAccessibility(url) {
  if (!url) return { accessible: false, error: 'No URL provided' };

  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      headers: {
        ...(API_KEY && { 'sc_apikey': API_KEY }),
      }
    });

    return {
      accessible: response.ok,
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length'),
      contentDisposition: response.headers.get('content-disposition'),
      url: url
    };
  } catch (error) {
    return {
      accessible: false,
      error: error.message,
      url: url
    };
  }
}

/**
 * Test all URL variants for a given item ID
 * @param {string} itemId - The Sitecore item ID
 * @returns {Promise<object>} - Test results for all variants
 */
async function testAllVariants(itemId) {
  const variants = generateUrlVariants(itemId);
  if (!variants) return { error: 'Invalid item ID' };

  console.log(`🔍 Testing all URL variants for item ID: ${itemId}`);
  console.log(`🌐 Base URL: ${SITECORE_BASE_URL}`);

  const results = {};

  for (const [variantName, url] of Object.entries(variants)) {
    console.log(`\n  → Testing ${variantName}:`);
    console.log(`    ${url}`);
    
    const result = await testUrlAccessibility(url);
    results[variantName] = result;
    
    if (result.accessible) {
      console.log(`    ✅ SUCCESS - ${result.status} ${result.statusText}`);
      console.log(`    📄 Type: ${result.contentType || 'unknown'}`);
      console.log(`    📏 Size: ${result.contentLength || 'unknown'} bytes`);
      if (result.contentDisposition) {
        console.log(`    📋 Disposition: ${result.contentDisposition}`);
      }
    } else {
      console.log(`    ❌ FAILED - ${result.error || result.status}`);
    }
  }

  return results;
}

/**
 * Load course outlines data and test a sample of items
 * @returns {Promise<void>}
 */
async function testSampleFromData() {
  try {
    const dataPath = "./src/data/course-outlines/courseOutlines.json";
    const data = await fs.readFile(dataPath, "utf-8");
    const courseOutlines = JSON.parse(data);
    
    console.log(`📚 Loaded ${courseOutlines.length} course outlines`);
    
    // Test first 3 items as samples
    const sampleSize = Math.min(3, courseOutlines.length);
    console.log(`🧪 Testing first ${sampleSize} items as samples...\n`);
    
    for (let i = 0; i < sampleSize; i++) {
      const item = courseOutlines[i];
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📖 Testing item ${i + 1}: ${item.name}`);
      console.log(`🆔 Item ID: ${item.id}`);
      
      await testAllVariants(item.id);
    }
    
  } catch (error) {
    console.error(`❌ Could not load course outlines data: ${error.message}`);
    console.log(`💡 Make sure to run fetchCourseOutlines.mjs first to generate the data file`);
  }
}

// ---------------------------------------------------------
// COMMAND LINE INTERFACE
// ---------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🧪 Sitecore .ashx URL Tester

Usage:
  node ./scripts/testAshxUrls.mjs <item-id>           # Test specific item ID
  node ./scripts/testAshxUrls.mjs --sample            # Test sample from data file
  node ./scripts/testAshxUrls.mjs --known-working     # Test with known working ID

Examples:
  node ./scripts/testAshxUrls.mjs 4B97C306E6A14AA98A503E7A04F9EDE4
  node ./scripts/testAshxUrls.mjs {4B97C306-E6A1-4AA9-8A50-3E7A04F9EDE4}
  node ./scripts/testAshxUrls.mjs --sample

Environment Variables Required:
  SITECORE_GRAPHQL_ENDPOINT - Your Sitecore GraphQL endpoint
  SC_APIKEY - Your Sitecore API key (optional)
    `);
    return;
  }

  if (args[0] === '--sample') {
    await testSampleFromData();
    return;
  }

  if (args[0] === '--known-working') {
    // Test with the known working ID from your example
    const knownId = "4B97C306E6A14AA98A503E7A04F9EDE4";
    console.log(`🧪 Testing with known working ID: ${knownId}`);
    await testAllVariants(knownId);
    return;
  }

  // Test specific item ID
  const itemId = args[0];
  console.log(`🧪 Testing specific item ID: ${itemId}`);
  await testAllVariants(itemId);
}

// ---------------------------------------------------------
// EXPORT FUNCTIONS FOR USE IN OTHER SCRIPTS
// ---------------------------------------------------------

export { 
  generateAshxUrlFromId, 
  generateUrlVariants, 
  testUrlAccessibility, 
  testAllVariants 
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}