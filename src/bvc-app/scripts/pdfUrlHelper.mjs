// File: ./scripts/pdfUrlHelper.mjs
// Description: Utility functions to work with Sitecore media library PDF URLs
//              and test PDF accessibility

import dotenv from "dotenv";
dotenv.config({ path: "./local.env" });
dotenv.config({ path: "./.env.local" });

// ---------------------------------------------------------
// CONFIGURATION
// ---------------------------------------------------------

const SITECORE_BASE_URL = process.env.SITECORE_GRAPHQL_ENDPOINT?.replace('/sitecore/api/graph/edge/', '') || 
  'https://xmc-bowvalleyco2df9-bowvalleyco2779-development2348.sitecorecloud.io';

const API_KEY = process.env.SC_APIKEY || "";

// ---------------------------------------------------------
// PDF URL UTILITIES
// ---------------------------------------------------------

/**
 * Convert Sitecore media library path to accessible URL
 * @param {string} mediaPath - The media library path from Sitecore
 * @returns {string} - The accessible URL for the media item
 */
export function convertMediaPathToUrl(mediaPath) {
  if (!mediaPath || typeof mediaPath !== 'string') {
    return null;
  }

  // Remove /sitecore/media library prefix and convert to URL
  let cleanPath = mediaPath.replace(/^\/sitecore\/media library/i, '');
  
  // Ensure path starts with /
  if (!cleanPath.startsWith('/')) {
    cleanPath = '/' + cleanPath;
  }
  
  // Method 1: Standard media URL (most common)
  const standardUrl = `${SITECORE_BASE_URL}/-/media${cleanPath}`;
  
  return standardUrl;
}

/**
 * Generate multiple possible URL variants for a media item
 * @param {string} mediaPath - The media library path from Sitecore
 * @returns {object} - Object containing different URL variants
 */
export function getMediaUrlVariants(mediaPath) {
  if (!mediaPath) return null;

  let cleanPath = mediaPath.replace(/^\/sitecore\/media library/i, '');
  if (!cleanPath.startsWith('/')) {
    cleanPath = '/' + cleanPath;
  }

  return {
    // Standard media URL
    standard: `${SITECORE_BASE_URL}/-/media${cleanPath}`,
    
    // With API key as query parameter
    withApiKey: `${SITECORE_BASE_URL}/-/media${cleanPath}?sc_apikey=${API_KEY}`,
    
    // Alternative media handler
    alternative: `${SITECORE_BASE_URL}/~/media${cleanPath}`,
    
    // Direct file path (sometimes works)
    direct: `${SITECORE_BASE_URL}${cleanPath}`,
    
    // Media handler with .ashx
    ashx: `${SITECORE_BASE_URL}/-/media${cleanPath}.ashx`,
  };
}

/**
 * Test if a PDF URL is accessible
 * @param {string} url - The URL to test
 * @returns {Promise<object>} - Result object with accessibility info
 */
export async function testPdfAccessibility(url) {
  if (!url) return { accessible: false, error: 'No URL provided' };

  try {
    const headers = {
      ...(API_KEY && { 'sc_apikey': API_KEY }),
    };

    const response = await fetch(url, { 
      method: 'HEAD', // Just check headers, don't download content
      headers 
    });

    return {
      accessible: response.ok,
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length'),
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
 * Find the working URL for a media path by testing multiple variants
 * @param {string} mediaPath - The media library path from Sitecore
 * @returns {Promise<object>} - Result with working URL or error info
 */
export async function findWorkingPdfUrl(mediaPath) {
  const variants = getMediaUrlVariants(mediaPath);
  if (!variants) return { error: 'Invalid media path' };

  console.log(`🔍 Testing PDF accessibility for: ${mediaPath}`);

  // Test each variant
  for (const [variantName, url] of Object.entries(variants)) {
    console.log(`  → Testing ${variantName}: ${url}`);
    const result = await testPdfAccessibility(url);
    
    if (result.accessible) {
      console.log(`  ✅ Success with ${variantName}!`);
      return {
        success: true,
        workingUrl: url,
        variant: variantName,
        ...result
      };
    } else {
      console.log(`  ❌ Failed: ${result.error || result.status}`);
    }
  }

  return {
    success: false,
    error: 'No accessible URL found',
    testedVariants: variants
  };
}

// ---------------------------------------------------------
// COMMAND LINE INTERFACE
// ---------------------------------------------------------

/**
 * Command line interface for testing PDF URLs
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
📄 PDF URL Helper - Sitecore Media Library Utilities

Usage:
  node ./scripts/pdfUrlHelper.mjs <media-path>
  node ./scripts/pdfUrlHelper.mjs --test-url <full-url>

Examples:
  node ./scripts/pdfUrlHelper.mjs "/sitecore/media library/BVC/BVC/Data/CMSData/CourseOutlines/ACCT1103Introduction to Financial AccountingFall 2020Winter 2021"
  
  node ./scripts/pdfUrlHelper.mjs --test-url "https://your-site.sitecorecloud.io/-/media/BVC/BVC/Data/CMSData/CourseOutlines/ACCT1103Introduction-to-Financial-AccountingFall-2020Winter-2021"

Environment Variables Required:
  SITECORE_GRAPHQL_ENDPOINT - Your Sitecore GraphQL endpoint
  SC_APIKEY - Your Sitecore API key
    `);
    return;
  }

  if (args[0] === '--test-url') {
    if (args.length < 2) {
      console.error('❌ Please provide a URL to test');
      return;
    }
    
    const url = args[1];
    console.log(`🔍 Testing single URL: ${url}`);
    const result = await testPdfAccessibility(url);
    console.log('Result:', result);
    return;
  }

  // Test media path
  const mediaPath = args[0];
  const result = await findWorkingPdfUrl(mediaPath);
  
  if (result.success) {
    console.log(`\n✅ PDF is accessible!`);
    console.log(`📄 Working URL: ${result.workingUrl}`);
    console.log(`🔧 Method: ${result.variant}`);
    console.log(`📊 Content Type: ${result.contentType}`);
    console.log(`📏 Size: ${result.contentLength} bytes`);
  } else {
    console.log(`\n❌ Could not find accessible URL`);
    console.log(`Error: ${result.error}`);
    console.log('\n🔧 Tested URLs:');
    if (result.testedVariants) {
      for (const [name, url] of Object.entries(result.testedVariants)) {
        console.log(`  ${name}: ${url}`);
      }
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}