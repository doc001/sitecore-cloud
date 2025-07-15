/**
 * Complete Course Outline PDF Generator Script
 * Run with: node scripts/generate-course-pdfs.mjs
 */

import dotenv from "dotenv";
dotenv.config({ path: "./.env.uat.local" });

import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

/**
 * Execute GraphQL query using the working header format
 */
async function executeGraphQLQuery(query, variables = {}, context = "GraphQL Query", retryCount = 0) {
  const endpoint = process.env.SITECORE_GRAPHQL_ENDPOINT;
  const apiKey = process.env.SITECORE_API_KEY;
  const maxRetries = 3;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        sc_apikey: apiKey,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      const errorMessages = result.errors.map(e => e.message).join(', ');
      throw new Error(`GraphQL errors: ${errorMessages}`);
    }

    return result.data;
  } catch (error) {
    console.warn(`  ⚠️  ${context} failed (attempt ${retryCount + 1}): ${error.message}`);
    
    // Retry logic for transient failures
    if (retryCount < maxRetries && (
      error.message.includes('timeout') || 
      error.message.includes('503') || 
      error.message.includes('502') ||
      error.message.includes('ECONNRESET')
    )) {
      const waitTime = (retryCount + 1) * 2;
      console.log(`    🔄 Retrying in ${waitTime} seconds...`);
      await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
      return executeGraphQLQuery(query, variables, context, retryCount + 1);
    }
    
    return null;
  }
}

/**
 * Test connection
 */
async function testConnection() {
  console.log('1. Testing Sitecore connection...');
  
  const testQuery = `
    query TestConnection {
      search(
        where: {
          name: "Extension", 
          value: "pdf", 
          operator: EQ
        }
        first: 3
      ) {
        results {
          id
          name
          path
        }
      }
    }
  `;

  const data = await executeGraphQLQuery(testQuery, {}, "Connection Test");
  
  if (data && data.search) {
    const count = data.search.results?.length || 0;
    console.log(`   ✅ Connection successful! Found ${count} PDFs`);
    return true;
  } else {
    throw new Error('Connection test failed');
  }
}

/**
 * Get all PDFs with corrected pagination
 */
async function getAllPDFs() {
  console.log('2. Fetching all PDFs...');

  // Corrected query with hasNext instead of hasNextPage
  const pdfQuery = `
    query GetAllPDFs($after: String) {
      search(
        where: {
          name: "Extension", 
          value: "pdf", 
          operator: EQ
        }
        first: 20
        after: $after
      ) {
        pageInfo {
          hasNext
          endCursor
        }
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
  `;

  let allPDFs = [];
  let hasNext = true;
  let cursor = null;
  let requestCount = 0;

  while (hasNext && requestCount < 100) {
    console.log(`   📄 Fetching PDF batch ${requestCount + 1}...`);
    
    const data = await executeGraphQLQuery(
      pdfQuery, 
      { after: cursor }, 
      `PDF Batch ${requestCount + 1}`
    );

    if (!data || !data.search?.results?.length) {
      console.log('   📄 No more PDFs found');
      break;
    }

    const pdfs = data.search.results;
    allPDFs = [...allPDFs, ...pdfs];
    
    hasNext = data.search.pageInfo?.hasNext || false;
    cursor = data.search.pageInfo?.endCursor || null;
    requestCount++;

    console.log(`   📄 Fetched ${pdfs.length} PDFs, total so far: ${allPDFs.length}`);
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log(`   📊 Total PDFs retrieved: ${allPDFs.length}`);
  return allPDFs;
}

/**
 * Extract course code from filename
 */
function extractCourseCode(filename) {
  if (!filename) return null;
  
  const patterns = [
    /([A-Z]{2,4}\s*\d{3,4}[A-Z]*)/i,  // BIOL 101, CHEM 1001A
    /([A-Z]{2,4}-\d{3,4}[A-Z]*)/i,    // BIOL-101A
    /([A-Z]{2,4}\d{3,4}[A-Z]*)/i,     // BIOL101A
  ];
  
  for (const pattern of patterns) {
    const match = filename.match(pattern);
    if (match) {
      return match[1].toUpperCase().replace(/\s+/g, ' ').replace(/-/g, ' ');
    }
  }
  
  return null;
}

/**
 * Clean filename for display
 */
function cleanDisplayName(filename) {
  if (!filename) return '';
  
  return filename
    .replace('.pdf', '')
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Format file size in human readable format
 */
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Process PDF item and extract metadata
 */
function processPDFItem(item) {
  const fields = {};
  
  // Convert fields array to object
  item.fields?.forEach(field => {
    fields[field.name] = field.value;
  });

  return {
    id: item.id,
    name: item.name,
    path: item.path,
    url: item.url?.url,
    urlPath: item.url?.path,
    // File metadata
    size: parseInt(fields.Size) || null,
    sizeFormatted: formatFileSize(parseInt(fields.Size) || 0),
    extension: fields.Extension || 'pdf',
    mimeType: fields['Mime Type'] || 'application/pdf',
    created: fields.Created,
    updated: fields.Updated,
    // Content metadata
    title: fields.Title || item.name?.replace('.pdf', '') || '',
    description: fields.Description || null,
    alt: fields.Alt || item.name || '',
    keywords: fields.Keywords || null,
    // Derived data
    courseCode: extractCourseCode(item.name),
    fileName: item.name || '',
    displayName: cleanDisplayName(item.name),
  };
}

/**
 * Test with just 5 PDFs for debugging
 */
async function testFivePDFs() {
  console.log('🧪 Testing with 5 PDFs');
  console.log('======================\n');

  const testQuery = `
    query TestFivePDFs {
      search(
        where: {
          name: "Extension", 
          value: "pdf", 
          operator: EQ
        }
        first: 5
      ) {
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
  `;

  const data = await executeGraphQLQuery(testQuery, {}, "Test 5 PDFs");
  
  if (!data || !data.search?.results?.length) {
    console.log('❌ No PDFs found in test');
    return [];
  }

  console.log(`📄 Found ${data.search.results.length} PDFs in test:`);
  data.search.results.forEach((pdf, index) => {
    console.log(`   ${index + 1}. ${pdf.name}`);
    console.log(`      Path: ${pdf.path}`);
    console.log(`      URL: ${pdf.url?.url || 'No URL'}`);
    console.log(`      CourseOutlines: ${pdf.path?.includes('CourseOutlines') ? '✅ YES' : '❌ NO'}`);
    console.log('');
  });

  return data.search.results;
}

/**
 * Main function to generate course outline PDF data
 */
async function main() {
  // Check for test mode
  const isTestMode = process.argv.includes('--test') || process.argv.includes('-t');
  
  if (isTestMode) {
    console.log('🧪 Running in TEST MODE - 5 PDFs only');
    console.log('=====================================\n');
    
    try {
      // Test connection first
      await testConnection();
      
      // Get 5 test PDFs
      const testPDFs = await testFivePDFs();
      
      if (testPDFs.length === 0) {
        throw new Error('No PDFs found in test mode');
      }

      // Filter for CourseOutlines PDFs
      const courseOutlinePDFs = testPDFs.filter(pdf => {
        const path = pdf.path || '';
        return path.includes('CourseOutlines');
      });

      console.log(`📁 CourseOutlines PDFs in test: ${courseOutlinePDFs.length}`);
      
      if (courseOutlinePDFs.length > 0) {
        console.log('\n📋 CourseOutlines PDFs found:');
        courseOutlinePDFs.forEach((pdf, index) => {
          const processed = processPDFItem(pdf);
          console.log(`   ${index + 1}. ${processed.displayName}`);
          console.log(`      Course Code: ${processed.courseCode || 'None detected'}`);
          console.log(`      URL: ${processed.url || 'No URL'}`);
        });
      }

      console.log('\n✅ Test completed successfully!');
      console.log('\nTo run full generation, use: node scripts/generate-course-pdfs.mjs');
      return;
      
    } catch (error) {
      console.error('\n❌ Test failed:', error.message);
      process.exit(1);
    }
  }

  console.log('🚀 Starting Course Outline PDF Generation');
  console.log('=========================================\n');

  try {
    // Test connection first
    await testConnection();

    // Get all PDFs
    const allPDFs = await getAllPDFs();
    
    if (allPDFs.length === 0) {
      throw new Error('No PDFs found in the system');
    }

    // Filter for CourseOutlines PDFs
    console.log('3. Filtering for CourseOutlines PDFs...');
    const courseOutlinePDFs = allPDFs.filter(pdf => {
      const path = pdf.path || '';
      return path.includes('CourseOutlines');
    });

    console.log(`   📁 CourseOutlines PDFs found: ${courseOutlinePDFs.length}`);

    if (courseOutlinePDFs.length === 0) {
      console.log('\n   🔍 No CourseOutlines PDFs found. Checking for similar paths...');
      
      // Look for any PDFs with "course" or "outline" in the path
      const similarPDFs = allPDFs.filter(pdf => {
        const path = (pdf.path || '').toLowerCase();
        return path.includes('course') || path.includes('outline');
      });
      
      console.log(`   📄 Found ${similarPDFs.length} PDFs with "course" or "outline" in path:`);
      similarPDFs.slice(0, 10).forEach(pdf => {
        console.log(`      - ${pdf.name}: ${pdf.path}`);
      });
      
      if (similarPDFs.length === 0) {
        console.log('\n   📄 Sample PDF paths for debugging:');
        allPDFs.slice(0, 10).forEach(pdf => {
          console.log(`      - ${pdf.name}: ${pdf.path}`);
        });
      }
    }

    // Process the PDFs
    console.log('4. Processing PDF metadata...');
    const processedPDFs = courseOutlinePDFs.map(processPDFItem);

    // Organize by course code
    const pdfsByCourse = {};
    processedPDFs.forEach(pdf => {
      const courseCode = pdf.courseCode || 'Unknown';
      if (!pdfsByCourse[courseCode]) {
        pdfsByCourse[courseCode] = [];
      }
      pdfsByCourse[courseCode].push(pdf);
    });

    // Create output data
    const outputData = {
      generated: new Date().toISOString(),
      summary: {
        totalPDFs: processedPDFs.length,
        courseCodes: Object.keys(pdfsByCourse).length,
        courses: Object.keys(pdfsByCourse).sort()
      },
      pdfs: processedPDFs,
      byCourse: pdfsByCourse,
      debug: {
        totalPDFsScanned: allPDFs.length,
        courseOutlinesFound: courseOutlinePDFs.length
      }
    };

    // Ensure output directory exists
    console.log('5. Saving to file...');
    const outputDir = path.join(process.cwd(), 'src', 'data', 'course-outline');
    await mkdir(outputDir, { recursive: true });

    // Save to JSON file
    const outputPath = path.join(outputDir, 'courses-outline-pdf.json');
    await writeFile(outputPath, JSON.stringify(outputData, null, 2));

    console.log('\n🎉 Generation Complete!');
    console.log('========================');
    console.log(`📁 File saved: ${outputPath}`);
    console.log(`📄 Total CourseOutlines PDFs: ${processedPDFs.length}`);
    console.log(`📚 Course codes found: ${Object.keys(pdfsByCourse).length}`);
    
    if (Object.keys(pdfsByCourse).length > 0) {
      console.log(`🏷️  Sample courses: ${Object.keys(pdfsByCourse).slice(0, 5).join(', ')}`);
    }

    if (processedPDFs.length > 0) {
      console.log('\n📋 Sample PDFs:');
      processedPDFs.slice(0, 3).forEach((pdf, index) => {
        console.log(`   ${index + 1}. ${pdf.displayName} (${pdf.courseCode || 'No code'})`);
        console.log(`      URL: ${pdf.url || 'No URL'}`);
      });
    }

    console.log('\n✅ Script completed successfully!');

  } catch (error) {
    console.error('\n❌ Generation failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main();