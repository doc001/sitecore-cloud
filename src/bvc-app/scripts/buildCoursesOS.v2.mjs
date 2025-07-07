#!/usr/bin/env node
// scripts/export-os-valid-courses.mjs

/**
 * Complete working course data builder for Sitecore XMC
 * Enhanced with proper pagination support and TimeBlock mapping
 * Uses correct Sitecore XMC GraphQL schema (hasNext, endCursor, default 10 items)
 * Includes lookup resolution and comprehensive fee data with nested pagination
 * Maps TimeBlock data from sis-data-lookup.json when containerName is "TimeBlock"
 */

import dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });

import fs from "fs";
import path from "path";
import fetch from "node-fetch";

// Pagination configuration - Sitecore XMC defaults to 10 items per page
const PAGE_SIZE = 10; // Sitecore XMC default page size
const LARGE_BATCH_SIZE = 50; // For batch requests
const MAX_ITEMS = 500; // Safety limit per course

// ————— Read input files —————
const validCoursesPath = path.resolve("src", "data", "osValidCourses.json");
const validCoursesRaw = fs.readFileSync(validCoursesPath, "utf-8");
const validCourses = JSON.parse(validCoursesRaw);

const lookupDataPath = path.resolve("src", "data", "sis-data-lookup.json");
const lookupDataRaw = fs.readFileSync(lookupDataPath, "utf-8");
const lookupData = JSON.parse(lookupDataRaw);

// ————— Enhanced GraphQL queries with proper Sitecore XMC pagination —————
const GET_COURSE_SECTIONS_PAGINATED = /* GraphQL */ `
  query GetCourseSectionsPaginated($coursePath: String!, $first: Int, $after: String) {
    item(path: $coursePath, language: "en") {
      id
      name: field(name: "Name") { value }
      credits: field(name: "Credits") { value }
      children(first: $first, after: $after) {
        results {
          id
          name
          sisID: field(name: "sisID") { value }
          courseName: field(name: "Name") { value }
          deliveryType: field(name: "Delivery Type") { value }
          campus: field(name: "Campus") { value }
          hours: field(name: "Hours") { value }
          registrationStart: field(name: "Registration Start") { value }
          registrationEnd: field(name: "Registration End") { value }
          startDate: field(name: "Start Date") { value }
          endDate: field(name: "End Date") { value }
          seatsAvailable: field(name: "Seats Are Available") { value }
        }
        pageInfo {
          hasNext
          endCursor
        }
        total
      }
    }
  }
`;

const GET_COURSE_SECTIONS_BATCH = /* GraphQL */ `
  query GetCourseSectionsBatch($coursePath: String!, $first: Int) {
    item(path: $coursePath, language: "en") {
      id
      name: field(name: "Name") { value }
      credits: field(name: "Credits") { value }
      children(first: $first) {
        results {
          id
          name
          sisID: field(name: "sisID") { value }
          courseName: field(name: "Name") { value }
          deliveryType: field(name: "Delivery Type") { value }
          campus: field(name: "Campus") { value }
          hours: field(name: "Hours") { value }
          registrationStart: field(name: "Registration Start") { value }
          registrationEnd: field(name: "Registration End") { value }
          startDate: field(name: "Start Date") { value }
          endDate: field(name: "End Date") { value }
          seatsAvailable: field(name: "Seats Are Available") { value }
        }
        total
      }
    }
  }
`;

const GET_COURSE_SECTIONS_BASIC = /* GraphQL */ `
  query GetCourseSectionsBasic($coursePath: String!) {
    item(path: $coursePath, language: "en") {
      id
      name: field(name: "Name") { value }
      credits: field(name: "Credits") { value }
      children {
        results {
          id
          name
          sisID: field(name: "sisID") { value }
          courseName: field(name: "Name") { value }
          deliveryType: field(name: "Delivery Type") { value }
          campus: field(name: "Campus") { value }
          hours: field(name: "Hours") { value }
          registrationStart: field(name: "Registration Start") { value }
          registrationEnd: field(name: "Registration End") { value }
          startDate: field(name: "Start Date") { value }
          endDate: field(name: "End Date") { value }
          seatsAvailable: field(name: "Seats Are Available") { value }
        }
      }
    }
  }
`;

const GET_FEE_CONTAINERS_PAGINATED = /* GraphQL */ `
  query GetFeeContainersPaginated($coursePath: String!, $first: Int, $after: String) {
    item(path: $coursePath, language: "en") {
      children(first: $first, after: $after) {
        results {
          id
          name
        }
        pageInfo {
          hasNext
          endCursor
        }
        total
      }
    }
  }
`;

const GET_FEE_ITEMS_PAGINATED = /* GraphQL */ `
  query GetFeeItemsPaginated($containerPath: String!, $first: Int, $after: String) {
    item(path: $containerPath, language: "en") {
      children(first: $first, after: $after) {
        results {
          id
          name
          FeeType: field(name: "Fee Type") { value }
          Amount: field(name: "amount") { value }
          TimeBlock: field(name: "TimeBlock") { value }
          Day: field(name: "Day") { value }
        }
        pageInfo {
          hasNext
          endCursor
        }
        total
      }
    }
  }
`;

const GET_FEES_BASIC = /* GraphQL */ `
  query GetFeesBasic($coursePath: String!) {
    item(path: $coursePath, language: "en") {
      children {
        results {
          id
          name
          children {
            results {
              id
              name
              FeeType: field(name: "Fee Type") { value }
              Amount: field(name: "amount") { value }
              TimeBlock: field(name: "TimeBlock") { value }
              Day: field(name: "Day") { value }
            }
          }
        }
      }
    }
  }
`;

/**
 * Execute GraphQL query with error handling and retry logic
 */
async function executeGraphQLQuery(query, variables, context, retryCount = 0) {
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
 * Utility function to normalize Sitecore IDs
 * Handles various ID formats from GraphQL
 */
function normalizeId(id) {
  if (!id) return null;
  
  // Remove curly braces and trim whitespace
  const cleaned = id.replace(/[{}]/g, '').trim();
  
  return cleaned;
}

/**
 * Clean up credits value - remove floating point decimals if they're .0
 * Examples: "3.0" -> "3", "4.5" -> "4.5", "3" -> "3"
 */
function normalizeCredits(credits) {
  if (!credits) return '';
  
  const trimmed = credits.toString().trim();
  
  // If it's a number with .0, remove the .0
  if (trimmed.includes('.')) {
    const parsed = parseFloat(trimmed);
    // If it's a whole number (like 3.0), return as integer string
    if (parsed % 1 === 0) {
      return parsed.toString().split('.')[0];
    }
    // Otherwise keep the decimal (like 4.5)
    return parsed.toString();
  }
  
  return trimmed;
}

/**
 * Enhanced lookup function that tries multiple ID formats
 */
function findInLookup(lookupCategory, id) {
  if (!id || !lookupCategory) return null;
  
  const normalizedId = normalizeId(id);
  
  // Try various formats to find a match
  const lookupAttempts = [
    normalizedId,                                    // AB98C091-3E88-437F-8E21-3869FAB80C8B
    normalizedId.replace(/-/g, ''),                 // AB98C0913E88437F8E213869FAB80C8B
    normalizedId.toUpperCase(),                     // AB98C091-3E88-437F-8E21-3869FAB80C8B
    normalizedId.toUpperCase().replace(/-/g, ''),   // AB98C0913E88437F8E213869FAB80C8B
    normalizedId.toLowerCase(),                     // ab98c091-3e88-437f-8e21-3869fab80c8b
    normalizedId.toLowerCase().replace(/-/g, ''),   // ab98c0913e88437f8e213869fab80c8b
  ];
  
  // If ID doesn't have hyphens but is 32 chars, try adding them in GUID format
  if (normalizedId.length === 32 && !normalizedId.includes('-')) {
    const withHyphens = `${normalizedId.substring(0, 8)}-${normalizedId.substring(8, 12)}-${normalizedId.substring(12, 16)}-${normalizedId.substring(16, 20)}-${normalizedId.substring(20, 32)}`;
    lookupAttempts.push(withHyphens);
    lookupAttempts.push(withHyphens.toUpperCase());
    lookupAttempts.push(withHyphens.toLowerCase());
  }
  
  // Try each format until we find a match
  for (const attempt of lookupAttempts) {
    if (lookupCategory.byId?.[attempt]) {
      return lookupCategory.byId[attempt];
    }
  }
  
  return null;
}

/**
 * Find TimeBlock data by various lookup methods
 * Tries: byId, byName (exact), byName (case-insensitive), and sisId field matching
 */
function findTimeBlockData(timeBlockIdentifier) {
  if (!timeBlockIdentifier || !lookupData.lookups?.timeBlocks) return null;
  
  const timeBlocks = lookupData.lookups.timeBlocks;
  
  // Method 1: Try direct ID lookup
  let timeBlockData = findInLookup(timeBlocks, timeBlockIdentifier);
  if (timeBlockData) {
    return timeBlockData;
  }
  
  // Method 2: Try name-based lookup (exact match)
  if (timeBlocks.byName?.[timeBlockIdentifier.toLowerCase()]) {
    return timeBlocks.byName[timeBlockIdentifier.toLowerCase()];
  }
  
  // Method 3: Try slug-based lookup
  if (timeBlocks.bySlug?.[timeBlockIdentifier.toLowerCase()]) {
    return timeBlocks.bySlug[timeBlockIdentifier.toLowerCase()];
  }
  
  // Method 4: Search through all timeBlocks for sisId field match
  for (const timeBlock of Object.values(timeBlocks.byId || {})) {
    // Check if the timeBlock has a sisId field that matches
    if (timeBlock.fields?.sisId === timeBlockIdentifier) {
      return timeBlock;
    }
    
    // Also check name match (case-insensitive)
    if (timeBlock.name?.toLowerCase() === timeBlockIdentifier.toLowerCase()) {
      return timeBlock;
    }
    
    // Check displayName match
    if (timeBlock.displayName?.toLowerCase() === timeBlockIdentifier.toLowerCase()) {
      return timeBlock;
    }
  }
  
  return null;
}

/**
 * Process TimeBlock data from lookup and format for output
 */
function processTimeBlockData(timeBlockIdentifier, feeItemName) {
  // First, try to find existing TimeBlock data
  const timeBlockData = findTimeBlockData(timeBlockIdentifier || feeItemName);
  
  if (timeBlockData) {
    // Extract fields from the found timeBlock data
    const fields = timeBlockData.fields || {};
    
    return {
      id: timeBlockData.id,
      name: timeBlockData.name,
      displayName: timeBlockData.displayName,
      endTime: fields.endTime || '',
      startTime: fields.startTime || '',
      sisId: fields.sisId || timeBlockData.name || '',
      created: fields.created || '',
      updated: fields.updated || '',
      // Include any other fields that might be present
      ...Object.keys(fields).reduce((acc, key) => {
        if (!['endTime', 'startTime', 'sisId', 'created', 'updated'].includes(key)) {
          acc[key] = fields[key];
        }
        return acc;
      }, {})
    };
  }
  
  // If no TimeBlock data found, create a fallback TimeBlock using the fee item name
  if (feeItemName) {
    // Clean the fee item name - remove underscores and normalize
    const cleanedName = feeItemName.replace(/_/g, ' ').trim();
    const fallbackSisId = feeItemName.replace(/_/g, '');
    
    console.warn(`⚠️  TimeBlock not found for identifier: "${timeBlockIdentifier || feeItemName}", creating fallback TimeBlock`);
    
    return {
      id: null, // No ID since this is a fallback
      name: cleanedName,
      displayName: cleanedName,
      endTime: '',
      startTime: '',
      sisId: fallbackSisId,
      created: '',
      updated: '',
      isFallback: true // Flag to indicate this is a generated fallback
    };
  }
  
  // If we have neither identifier nor fee item name, return null
  console.warn(`⚠️  No TimeBlock identifier or fee item name provided`);
  return null;
}

/**
 * Fetch all course sections with comprehensive pagination support
 */
async function fetchAllCourseSections(coursePath, sisID) {
  console.log(`    📄 Fetching course sections with pagination: ${coursePath}`);
  
  const allSections = [];
  let hasNext = true;
  let cursor = null;
  let totalFetched = 0;
  let totalSections = null;
  let pageCount = 0;

  // Try cursor-based pagination first
  while (hasNext && totalFetched < MAX_ITEMS) {
    pageCount++;
    try {
      const variables = {
        coursePath,
        first: PAGE_SIZE,
        ...(cursor && { after: cursor })
      };

      console.log(`      📊 Fetching page ${pageCount} (cursor: ${cursor ? 'present' : 'none'})`);

      const data = await executeGraphQLQuery(
        GET_COURSE_SECTIONS_PAGINATED,
        variables,
        `course sections page ${pageCount} for ${sisID}`
      );

      if (!data?.item?.children) {
        console.warn(`    ⚠️  No children found for course ${sisID}`);
        break;
      }

      const { results, pageInfo, total } = data.item.children;

      // Set total on first iteration
      if (totalSections === null && total) {
        totalSections = total;
        console.log(`    📊 Total sections available: ${totalSections}`);
      }

      if (results && results.length > 0) {
        allSections.push(...results);
        totalFetched += results.length;
        
        console.log(`      ✅ Page ${pageCount}: ${results.length} sections (${totalFetched}/${totalSections || '?'} total)`);
      }

      // Check pagination status using Sitecore XMC fields
      hasNext = pageInfo?.hasNext === true;
      cursor = pageInfo?.endCursor || null;

      // Safety checks
      if (!cursor && hasNext) {
        console.warn('    ⚠️  hasNext is true but no endCursor provided, stopping pagination');
        hasNext = false;
      }

      if (results && results.length < PAGE_SIZE && hasNext) {
        console.log('    📄 Received fewer sections than requested but hasNext is true, continuing...');
      }

      // If we got no results, stop
      if (!results || results.length === 0) {
        console.log('    📄 No more results, stopping pagination');
        hasNext = false;
      }

    } catch (error) {
      console.error(`    ❌ Error during cursor pagination page ${pageCount}: ${error.message}`);
      break;
    }
  }

  // If pagination failed or we got no results, try fallback methods
  if (allSections.length === 0) {
    console.log(`    🔄 Cursor pagination failed, trying batch fetch for ${sisID}...`);
    
    try {
      // Try larger batch request
      const data = await executeGraphQLQuery(
        GET_COURSE_SECTIONS_BATCH,
        { coursePath, first: LARGE_BATCH_SIZE },
        `batch course sections ${sisID}`
      );

      if (data?.item?.children?.results) {
        allSections.push(...data.item.children.results);
        console.log(`    ✅ Batch fetch succeeded with ${data.item.children.results.length} sections`);
      } else {
        throw new Error('No results from batch query');
      }
    } catch (batchError) {
      console.log(`    🔄 Batch failed, trying basic fetch for ${sisID}...`);
      
      try {
        // Final fallback to basic query
        const data = await executeGraphQLQuery(
          GET_COURSE_SECTIONS_BASIC,
          { coursePath },
          `basic course sections ${sisID}`
        );

        if (data?.item?.children?.results) {
          allSections.push(...data.item.children.results);
          console.log(`    ✅ Basic fetch succeeded with ${data.item.children.results.length} sections`);
        }
      } catch (basicError) {
        console.error(`    ❌ All section fetch methods failed for ${sisID}`);
      }
    }
  }

  console.log(`    ✅ Total sections retrieved for ${sisID}: ${allSections.length} (used ${pageCount} page requests)`);
  return allSections;
}

/**
 * Fetch all fee items from a specific fee container with pagination
 */
async function fetchFeeItemsFromContainer(containerPath, containerName, sisID, sectionName) {
  console.log(`        💰 Fetching fee items from container: ${containerPath}`);
  
  const allFeeItems = [];
  let hasNext = true;
  let cursor = null;
  let totalFetched = 0;
  let pageCount = 0;

  // Try cursor-based pagination for fee items
  while (hasNext && totalFetched < MAX_ITEMS) {
    pageCount++;
    try {
      const variables = {
        containerPath,
        first: PAGE_SIZE,
        ...(cursor && { after: cursor })
      };

      const data = await executeGraphQLQuery(
        GET_FEE_ITEMS_PAGINATED,
        variables,
        `fee items page ${pageCount} from ${containerName} for ${sisID}/${sectionName}`
      );

      if (!data?.item?.children) {
        break;
      }

      const { results, pageInfo } = data.item.children;

      if (results && results.length > 0) {
        allFeeItems.push(...results);
        totalFetched += results.length;
        console.log(`          📋 Page ${pageCount}: ${results.length} fee items (${totalFetched} total)`);
      }

      hasNext = pageInfo?.hasNext === true;
      cursor = pageInfo?.endCursor || null;

      if (!cursor && hasNext) {
        hasNext = false;
      }

      if (!results || results.length === 0) {
        hasNext = false;
      }

    } catch (error) {
      console.error(`        ❌ Error fetching fee items page ${pageCount}: ${error.message}`);
      break;
    }
  }

  return allFeeItems;
}

/**
 * Fetch all fee containers and their items with comprehensive pagination
 * SIMPLIFIED VERSION - Reduced nesting to avoid GraphQL depth limits
 */
async function fetchAllFeesWithPagination(feesPath, sisID, sectionName) {
  console.log(`      💰 Fetching fees with pagination: ${feesPath}`);
  
  const allFees = [];
  
  // First, try a simple direct query to get fee containers
  try {
    const data = await executeGraphQLQuery(
      GET_FEES_BASIC,
      { coursePath: feesPath },
      `basic fees for ${sisID}/${sectionName}`
    );

    if (data?.item?.children?.results) {
      console.log(`        📂 Found ${data.item.children.results.length} fee containers`);
      
      for (const container of data.item.children.results) {
        if (container.children?.results) {
          for (const feeItem of container.children.results) {
            const feeTypeId = normalizeId(feeItem.FeeType?.value) || '';
            const amount = feeItem.Amount?.value || '';
            const timeBlock = feeItem.TimeBlock?.value || '';
            const day = feeItem.Day?.value || '';
            
            const feeTypeResolved = resolveFeeType(feeTypeId);
            
            // Enhanced fee object with TimeBlock mapping
            const feeObject = {
              containerName: container.name,
              feeItemName: feeItem.name,
              feeTypeId: normalizeId(feeTypeId),
              feeType: feeTypeResolved ? {
                id: feeTypeResolved.id,
                name: feeTypeResolved.name,
                displayName: feeTypeResolved.displayName,
                slug: feeTypeResolved.slug
              } : null,
              amount: amount,
              timeBlock: null,
              day: day
            };
            
            // Special handling for TimeBlock containers
            if (container.name.toLowerCase() === 'timeblock') {
              console.log(`          🕐 Processing TimeBlock for item: ${feeItem.name}`);
              
              // Try to find TimeBlock data using the fee item name or timeBlock field
              const timeBlockData = processTimeBlockData(timeBlock, feeItem.name);
              
              if (timeBlockData) {
                feeObject.timeBlock = timeBlockData;
                if (timeBlockData.isFallback) {
                  console.log(`          ⚠️  Using fallback TimeBlock: ${timeBlockData.name}`);
                } else {
                  console.log(`          ✅ TimeBlock mapped: ${timeBlockData.sisId} (${timeBlockData.startTime} - ${timeBlockData.endTime})`);
                }
              }
            }
            
            allFees.push(feeObject);
          }
        }
      }
      console.log(`      ✅ Basic fees fetch succeeded with ${allFees.length} fees`);
    } else {
      console.log(`      ⚠️  No fees found at ${feesPath}`);
    }
  } catch (basicError) {
    console.log(`      ⚠️  No fees found at ${feesPath}: ${basicError.message}`);
  }

  console.log(`      ✅ Total fees retrieved: ${allFees.length}`);
  return allFees;
}

/**
 * Lookup resolver functions with enhanced ID normalization
 */
function resolveDeliveryType(id) {
  if (!id) return null;
  
  const result = findInLookup(lookupData.lookups?.deliveryTypes, id);
  if (!result) {
    console.warn(`⚠️  Delivery Type not found for ID: "${id}" (normalized: "${normalizeId(id)}")`);
  }
  return result;
}

function resolveCampus(id) {
  if (!id) return null;
  
  const result = findInLookup(lookupData.lookups?.campuses, id);
  if (!result) {
    console.warn(`⚠️  Campus not found for ID: "${id}" (normalized: "${normalizeId(id)}")`);
  }
  return result;
}

function resolveFeeType(id) {
  if (!id) return null;
  
  const result = findInLookup(lookupData.lookups?.feeTypes, id);
  if (!result) {
    console.warn(`⚠️  Fee Type not found for ID: "${id}" (normalized: "${normalizeId(id)}")`);
  }
  return result;
}

/**
 * Get comprehensive course data with full pagination support
 */
async function getCourseDataByPath(sisID) {
  const coursePath = `/sitecore/content/BVC/BVC/Data/SisData/Credit Courses/${sisID}`;
  
  console.log(`  📂 Processing course: ${coursePath}`);
  
  // Get course metadata first
  let courseRoot = null;
  try {
    const data = await executeGraphQLQuery(
      GET_COURSE_SECTIONS_BASIC,
      { coursePath },
      `course metadata ${sisID}`
    );
    courseRoot = data?.item;
  } catch (error) {
    console.error(`  ❌ Failed to get course metadata for ${sisID}: ${error.message}`);
    return null;
  }

  if (!courseRoot) {
    console.warn(`  ❌ No course found at path ${coursePath}`);
    return null;
  }

  // Fetch all sections with comprehensive pagination
  const allSections = await fetchAllCourseSections(coursePath, sisID);
  
  console.log(`  ✅ Found course: ${courseRoot.name?.value || sisID} with ${allSections.length} sections`);

  // Build enhanced course data with lookup resolution and comprehensive fees
  const enhancedChildren = [];
  
  for (let i = 0; i < allSections.length; i++) {
    const section = allSections[i];
    console.log(`    🔍 Processing section ${i + 1}/${allSections.length}: ${section.name}`);
    
    const deliveryTypeResolved = resolveDeliveryType(section.deliveryType?.value);
    const campusResolved = resolveCampus(section.campus?.value);

    // Get fees for this specific section with full pagination
    const feesPath = `/sitecore/content/BVC/BVC/Data/SisData/Credit Courses/${sisID}/${section.name}`;
    const fees = await fetchAllFeesWithPagination(feesPath, sisID, section.name);

    const enhancedSection = {
      id: section.id,
      name: section.name,
      sisID: section.sisID?.value || '',
      courseName: section.courseName?.value || '',
      
      // Original ID values (normalized)
      deliveryTypeId: normalizeId(section.deliveryType?.value) || '',
      campusId: normalizeId(section.campus?.value) || '',
      
      // Resolved lookup values
      deliveryType: deliveryTypeResolved ? {
        id: deliveryTypeResolved.id,
        name: deliveryTypeResolved.name,
        displayName: deliveryTypeResolved.displayName,
        slug: deliveryTypeResolved.slug
      } : null,
      
      campus: campusResolved ? {
        id: campusResolved.id,
        name: campusResolved.name,
        displayName: campusResolved.displayName,
        slug: campusResolved.slug
      } : null,
      
      // Course schedule and registration details
      hours: section.hours?.value || '',
      registrationStart: section.registrationStart?.value || '',
      registrationEnd: section.registrationEnd?.value || '',
      startDate: section.startDate?.value || '',
      endDate: section.endDate?.value || '',
      seatsAvailable: section.seatsAvailable?.value || '',
      
      // Comprehensive fees data with pagination and TimeBlock mapping
      fees: fees,
      feesSummary: {
        totalFees: fees.length,
        containers: [...new Set(fees.map(f => f.containerName))],
        feeTypes: [...new Set(fees.map(f => f.feeType?.name).filter(Boolean))],
        timeBlockCount: fees.filter(f => f.containerName.toLowerCase() === 'timeblock' && f.timeBlock).length
      }
    };

    enhancedChildren.push(enhancedSection);
    console.log(`    ✅ Section ${section.name}: ${fees.length} fees processed (${enhancedSection.feesSummary.timeBlockCount} TimeBlocks)`);
  }

  return {
    id: courseRoot.id,
    sisID: sisID,
    name: courseRoot.name?.value || sisID,
    credits: normalizeCredits(courseRoot.credits?.value || ''),
    children: enhancedChildren,
    summary: {
      totalSections: enhancedChildren.length,
      totalFees: enhancedChildren.reduce((sum, section) => sum + section.fees.length, 0),
      totalTimeBlocks: enhancedChildren.reduce((sum, section) => sum + section.feesSummary.timeBlockCount, 0),
      sectionsWithFees: enhancedChildren.filter(section => section.fees.length > 0).length
    }
  };
}

/**
 * Write individual course JSON file
 */
function writeCourseFile(courseData, outputDir) {
  const courseFileName = `course-${courseData.sisID}.json`;
  const courseFilePath = path.join(outputDir, courseFileName);
  
  // Create individual course file with clean structure
  const individualCourseData = {
    metadata: {
      generatedAt: new Date().toISOString(),
      version: "4.0.0",
      source: "Sitecore XMC GraphQL - Individual Course Data",
      sisID: courseData.sisID,
      courseName: courseData.name
    },
    course: courseData
  };
  
  try {
    fs.writeFileSync(courseFilePath, JSON.stringify(individualCourseData, null, 2), "utf-8");
    console.log(`    📁 Generated individual file: ${courseFileName}`);
    return courseFileName;
  } catch (error) {
    console.error(`    ❌ Failed to write ${courseFileName}: ${error.message}`);
    return null;
  }
}

/**
 * Generate course index file for easy reference
 */
function generateCourseIndex(enhancedCourseData, outputDir) {
  const courseIndex = {
    metadata: {
      generatedAt: new Date().toISOString(),
      version: "4.0.0",
      source: "Sitecore XMC GraphQL - Course Index",
      totalCourses: enhancedCourseData.length
    },
    courses: enhancedCourseData.map(course => ({
      sisID: course.sisID,
      name: course.name,
      fileName: `course-${course.sisID}.json`,
      summary: {
        totalSections: course.children.length,
        totalFees: course.summary.totalFees,
        totalTimeBlocks: course.summary.totalTimeBlocks,
        sectionsWithFees: course.summary.sectionsWithFees,
        hasDeliveryTypes: course.children.some(section => section.deliveryType),
        hasCampuses: course.children.some(section => section.campus),
        hasTimeBlocks: course.summary.totalTimeBlocks > 0,
        containers: [...new Set(
          course.children.flatMap(section => 
            section.fees.map(fee => fee.containerName)
          )
        )],
        feeTypes: [...new Set(
          course.children.flatMap(section => 
            section.fees.map(fee => fee.feeType?.name).filter(Boolean)
          )
        )]
      }
    }))
  };
  
  const indexPath = path.join(outputDir, 'course-index.json');
  fs.writeFileSync(indexPath, JSON.stringify(courseIndex, null, 2), "utf-8");
  console.log(`📋 Generated course index: course-index.json`);
  
  return courseIndex;
}

/**
 * Generate summary statistics file
 */
function generateSummaryStats(stats, enhancedCourseData, outputDir) {
  const summaryStats = {
    metadata: {
      generatedAt: new Date().toISOString(),
      version: "4.0.0",
      source: "Sitecore XMC GraphQL - Summary Statistics"
    },
    overview: {
      totalCourses: stats.totalCourses,
      totalSections: stats.totalSections,
      totalFees: stats.totalFees,
      totalTimeBlocks: stats.totalTimeBlocks,
      successRate: ((stats.successes / (stats.successes + stats.failures)) * 100).toFixed(1) + '%'
    },
    courseDistribution: {
      coursesWithManySection: stats.coursesWithManySection,
      coursesWithManyFees: stats.coursesWithManyFees,
      coursesWithTimeBlocks: stats.coursesWithTimeBlocks,
      maxSectionsInCourse: stats.maxSectionsInCourse,
      maxFeesInCourse: stats.maxFeesInCourse,
      maxTimeBlocksInCourse: stats.maxTimeBlocksInCourse
    },
    lookupResolution: {
      resolvedDeliveryTypes: stats.resolvedDeliveryTypes,
      resolvedCampuses: stats.resolvedCampuses,
      resolvedFeeTypes: stats.resolvedFeeTypes,
      resolvedTimeBlocks: stats.resolvedTimeBlocks
    },
    paginationUsage: stats.paginationUsage,
    containerTypes: [...new Set(
      enhancedCourseData.flatMap(course => 
        course.children.flatMap(section => 
          section.fees.map(fee => fee.containerName)
        )
      )
    )].sort(),
    feeTypes: [...new Set(
      enhancedCourseData.flatMap(course => 
        course.children.flatMap(section => 
          section.fees.map(fee => fee.feeType?.name).filter(Boolean)
        )
      )
    )].sort()
  };
  
  const statsPath = path.join(outputDir, 'summary-stats.json');
  fs.writeFileSync(statsPath, JSON.stringify(summaryStats, null, 2), "utf-8");
  console.log(`📊 Generated summary statistics: summary-stats.json`);
  
  return summaryStats;
}

/**
 * Main function to build all courses with comprehensive pagination support and TimeBlock mapping
 */
async function buildAllCoursesComplete() {
  if (!Array.isArray(validCourses) || !validCourses.every(x => typeof x === "string")) {
    throw new Error("`validCourses.json` must be a string array of SIS IDs");
  }

  const endpoint = process.env.SITECORE_GRAPHQL_ENDPOINT;
  const apiKey = process.env.SITECORE_API_KEY;

  if (!endpoint || !apiKey) {
    throw new Error("Missing required environment variables: SITECORE_GRAPHQL_ENDPOINT, SITECORE_API_KEY");
  }

  console.log(`🚀 Processing ${validCourses.length} SIS IDs with comprehensive pagination and TimeBlock mapping...`);
  console.log(`📁 Will generate individual JSON files for each course for SSG optimization`);
  console.log(`⚙️  Pagination settings: page size ${PAGE_SIZE}, batch size ${LARGE_BATCH_SIZE}, max items ${MAX_ITEMS}`);
  console.log(`📊 Using lookup data with:`);
  console.log(`   • ${Object.keys(lookupData.lookups?.deliveryTypes?.byId || {}).length} delivery types`);
  console.log(`   • ${Object.keys(lookupData.lookups?.campuses?.byId || {}).length} campuses`);
  console.log(`   • ${Object.keys(lookupData.lookups?.feeTypes?.byId || {}).length} fee types`);
  console.log(`   • ${Object.keys(lookupData.lookups?.timeBlocks?.byId || {}).length} time blocks`);
  console.log();

  // Create output directories
  const dataDir = path.resolve("src", "data");
  const coursesDir = path.resolve(dataDir, "oScourses");
  
  // Ensure directories exist
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(coursesDir, { recursive: true });
  
  console.log(`📁 Output directories:`);
  console.log(`   • Main data: ${dataDir}`);
  console.log(`   • Individual courses: ${coursesDir}`);
  console.log();

  const enhancedCourseData = [];
  const stats = {
    totalCourses: 0,
    totalSections: 0,
    totalFees: 0,
    totalTimeBlocks: 0,
    successes: 0,
    failures: 0,
    resolvedDeliveryTypes: 0,
    resolvedCampuses: 0,
    resolvedFeeTypes: 0,
    resolvedTimeBlocks: 0,
    coursesWithManySection: 0,
    coursesWithManyFees: 0,
    coursesWithTimeBlocks: 0,
    maxSectionsInCourse: 0,
    maxFeesInCourse: 0,
    maxTimeBlocksInCourse: 0,
    paginationUsage: {
      coursesRequiringPagination: 0,
      sectionsRequiringPagination: 0,
      feesRequiringPagination: 0
    },
    individualFiles: {
      generated: [],
      failed: []
    }
  };

  for (let i = 0; i < validCourses.length; i++) {
    const sisID = validCourses[i];
    console.log(`\n📚 Processing ${i + 1}/${validCourses.length}: SISID=${sisID}...`);

    const courseData = await getCourseDataByPath(sisID);

    if (!courseData) {
      console.warn(`  ❌ Could not retrieve data for ${sisID}`);
      stats.failures++;
      stats.individualFiles.failed.push(sisID);
      continue;
    }

    // Update statistics
    stats.totalCourses++;
    stats.successes++;
    stats.totalSections += courseData.children.length;
    stats.totalFees += courseData.summary.totalFees;
    stats.totalTimeBlocks += courseData.summary.totalTimeBlocks;
    
    // Track courses with many sections/fees
    if (courseData.children.length >= PAGE_SIZE) {
      stats.coursesWithManySection++;
      stats.paginationUsage.coursesRequiringPagination++;
    }
    
    if (courseData.summary.totalFees >= 40) {
      stats.coursesWithManyFees++;
    }
    
    if (courseData.summary.totalTimeBlocks > 0) {
      stats.coursesWithTimeBlocks++;
    }
    
    // Track max values
    if (courseData.children.length > stats.maxSectionsInCourse) {
      stats.maxSectionsInCourse = courseData.children.length;
    }
    
    if (courseData.summary.totalFees > stats.maxFeesInCourse) {
      stats.maxFeesInCourse = courseData.summary.totalFees;
    }
    
    if (courseData.summary.totalTimeBlocks > stats.maxTimeBlocksInCourse) {
      stats.maxTimeBlocksInCourse = courseData.summary.totalTimeBlocks;
    }
    
    // Count resolved lookups
    courseData.children.forEach(section => {
      if (section.deliveryType) stats.resolvedDeliveryTypes++;
      if (section.campus) stats.resolvedCampuses++;
      
      section.fees.forEach(fee => {
        if (fee.feeType) stats.resolvedFeeTypes++;
        if (fee.timeBlock) stats.resolvedTimeBlocks++;
      });
    });

    // Add to main collection
    enhancedCourseData.push(courseData);
    
    // Write individual course file
    const fileName = writeCourseFile(courseData, coursesDir);
    if (fileName) {
      stats.individualFiles.generated.push(fileName);
    } else {
      stats.individualFiles.failed.push(sisID);
    }
    
    console.log(`  ✅ ${sisID}: ${courseData.children.length} sections, ${courseData.summary.totalFees} fees, ${courseData.summary.totalTimeBlocks} TimeBlocks`);
  }

  // Generate additional files for SSG optimization
  console.log(`\n📋 Generating index and summary files...`);
  
  // 1. Main combined file (for backwards compatibility)
  const mainOutputPath = path.resolve(dataDir, "coursesData.json");
  const mainOutputData = {
    metadata: {
      generatedAt: new Date().toISOString(),
      version: "4.0.0",
      source: "Sitecore XMC GraphQL - Complete Solution with Individual Files",
      note: "Individual course files are available in /oScourses/ directory",
      paginationSettings: {
        pageSize: PAGE_SIZE,
        largeBatchSize: LARGE_BATCH_SIZE,
        maxItems: MAX_ITEMS,
        note: "Uses proper Sitecore XMC pagination (hasNext, endCursor, default 10 items)"
      },
      timeBlockMapping: {
        enabled: true,
        note: "TimeBlock containers are mapped to sis-data-lookup.json timeBlocks data",
        lookupMethods: ["byId", "byName", "bySlug", "sisId field matching"]
      },
      stats: stats
    },
    courses: enhancedCourseData
  };
  
  fs.writeFileSync(mainOutputPath, JSON.stringify(mainOutputData, null, 2), "utf-8");
  console.log(`✅ Generated main file: coursesData.json`);
  
  // 2. Course index file
  generateCourseIndex(enhancedCourseData, coursesDir);
  
  // 3. Summary statistics file
  generateSummaryStats(stats, enhancedCourseData, dataDir);

  console.log(`\n🎉 BUILD COMPLETE! 🎉`);
  console.log(`\n📈 Final Statistics:`);
  console.log(`   ✅ Total Courses: ${stats.totalCourses}`);
  console.log(`   📄 Total Sections: ${stats.totalSections}`);
  console.log(`   💰 Total Fees: ${stats.totalFees}`);
  console.log(`   🕐 Total TimeBlocks: ${stats.totalTimeBlocks}`);
  console.log(`   🎯 Success Rate: ${((stats.successes / validCourses.length) * 100).toFixed(1)}%`);
  console.log(`   📊 Courses with 10+ sections: ${stats.coursesWithManySection}`);
  console.log(`   💸 Courses with 40+ fees: ${stats.coursesWithManyFees}`);
  console.log(`   ⏰ Courses with TimeBlocks: ${stats.coursesWithTimeBlocks}`);
  console.log(`   🔝 Max sections in a course: ${stats.maxSectionsInCourse}`);
  console.log(`   💎 Max fees in a course: ${stats.maxFeesInCourse}`);
  console.log(`   ⏱️  Max TimeBlocks in a course: ${stats.maxTimeBlocksInCourse}`);
  console.log(`   🔗 Resolved Delivery Types: ${stats.resolvedDeliveryTypes}`);
  console.log(`   🏫 Resolved Campuses: ${stats.resolvedCampuses}`);
  console.log(`   💳 Resolved Fee Types: ${stats.resolvedFeeTypes}`);
  console.log(`   🕒 Resolved TimeBlocks: ${stats.resolvedTimeBlocks}`);
  
  console.log(`\n📁 Individual Files:`);
  console.log(`   📋 Generated: ${stats.individualFiles.generated.length} files`);
  console.log(`   ❌ Failed: ${stats.individualFiles.failed.length} files`);
  
  if (stats.individualFiles.failed.length > 0) {
    console.log(`   Failed SIS IDs: ${stats.individualFiles.failed.join(', ')}`);
  }
  
  console.log(`\n📋 Generated Files Structure:`);
  console.log(`   📁 src/data/`);
  console.log(`   ├── coursesData.json (main combined file)`);
  console.log(`   ├── summary-stats.json (statistics)`);
  console.log(`   └── oScourses/`);
  console.log(`       ├── course-index.json (course list with summaries)`);
  console.log(`       ├── course-{sisID}.json (individual course files)`);
  console.log(`       └── ... (${stats.individualFiles.generated.length} total course files)`);
  
  console.log(`\n🔧 SSG Usage Examples:`);
  console.log(`   • Load specific course: import courseData from '@/data/oScourses/course-ACCT101.json'`);
  console.log(`   • Get course list: import courseIndex from '@/data/oScourses/course-index.json'`);
  console.log(`   • Load statistics: import stats from '@/data/summary-stats.json'`);
  console.log(`   • Main data: import allCourses from '@/data/coursesData.json'`);
  
  console.log(`\n✨ Benefits for SSG:`);
  console.log(`   • Smaller bundle sizes (load only needed courses)`);
  console.log(`   • Faster build times (incremental updates possible)`);
  console.log(`   • Better performance (individual file imports)`);
  console.log(`   • Easier debugging (isolated course data)`);
  console.log(`   • Flexible data combining (mix with other JSON files)`);
}

// Execute the script
buildAllCoursesComplete().catch((err) => {
  console.error("❌ Script failed:", err.message);
  console.error("Stack trace:", err.stack);
  process.exit(1);
});