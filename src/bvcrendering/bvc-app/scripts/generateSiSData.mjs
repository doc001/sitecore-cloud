#!/usr/bin/env node
import dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });

import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ESM modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// GraphQL endpoint configuration
const GRAPHQL_ENDPOINT = process.env.SITECORE_GRAPHQL_ENDPOINT || 'https://your-sitecore-instance.com/sitecore/api/graph/edge';
const API_KEY = process.env.SITECORE_API_KEY;

// Pagination configuration
const PAGE_SIZE = 20; // Adjust based on your Sitecore configuration
const MAX_ITEMS = 1000; // Safety limit to prevent infinite loops

// Sitecore XMC GraphQL query with correct field names
const GET_ALL_ITEMS_QUERY = `
  query GetAllItemsInPath($path: String!, $first: Int, $after: String) {
    item(path: $path, language: "en") {
      id
      children(first: $first, after: $after) {
        results {
          id
          name
          displayName
          path
          template {
            name
          }
          fields {
            name
            value
          }
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

// Sitecore XMC query with first parameter only (no offset support in XMC)
const GET_ITEMS_BATCH_QUERY = `
  query GetItemsBatch($path: String!, $first: Int) {
    item(path: $path, language: "en") {
      id
      children(first: $first) {
        results {
          id
          name
          displayName
          path
          template {
            name
          }
          fields {
            name
            value
          }
        }
        total
      }
    }
  }
`;

// Fallback query for basic item retrieval without pagination
const GET_BASIC_ITEMS_QUERY = `
  query GetBasicItems($path: String!) {
    item(path: $path, language: "en") {
      id
      children {
        results {
          id
          name
          displayName
          path
          template {
            name
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

// Define the paths to query
const PATHS_CONFIG = [
  {
    key: 'deliveryTypes',
    path: '/sitecore/content/BVC/BVC/Data/SisData/Delivery Types'
  },
  {
    key: 'campuses',
    path: '/sitecore/content/BVC/BVC/Data/SisData/Campuses'
  },
  {
    key: 'feeTypes',
    path: '/sitecore/content/BVC/BVC/Data/SisData/Fee Types'
  },
  {
    key: 'timeBlocks',
    path: '/sitecore/content/BVC/BVC/Data/SisData/Time Blocks'
  }
];

/**
 * Execute GraphQL query against Sitecore XMC with retry logic
 * @param {string} query - The GraphQL query
 * @param {object} variables - Query variables
 * @param {number} retryCount - Current retry attempt
 * @returns {Promise<object>} - Query result
 */
async function executeGraphQLQuery(query, variables, retryCount = 0) {
  const maxRetries = 3;
  
  try {
    console.log(`🔍 Querying path: ${variables.path} ${variables.after ? `(cursor: ${variables.after})` : ''}${variables.offset ? `(offset: ${variables.offset})` : ''}`);
    
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'sc_apikey': API_KEY || '',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        query,
        variables
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    return result.data;
  } catch (error) {
    console.error(`❌ Error executing GraphQL query (attempt ${retryCount + 1}):`, error.message);
    
    // Retry logic for transient failures
    if (retryCount < maxRetries && (error.message.includes('timeout') || error.message.includes('503') || error.message.includes('502'))) {
      console.log(`🔄 Retrying in ${(retryCount + 1) * 2} seconds...`);
      await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000));
      return executeGraphQLQuery(query, variables, retryCount + 1);
    }
    
    throw error;
  }
}

/**
 * Fetch all items for a given path using Sitecore XMC cursor-based pagination
 * @param {string} path - Sitecore path to query
 * @returns {Promise<Array>} - All items from the path
 */
async function fetchAllItemsWithCursor(path) {
  const allItems = [];
  let hasNext = true;
  let cursor = null;
  let totalFetched = 0;
  let totalItems = null;

  console.log(`📄 Starting Sitecore XMC cursor-based pagination for: ${path}`);

  while (hasNext && totalFetched < MAX_ITEMS) {
    try {
      const variables = {
        path,
        first: PAGE_SIZE,
        ...(cursor && { after: cursor })
      };

      const data = await executeGraphQLQuery(GET_ALL_ITEMS_QUERY, variables);
      
      if (!data?.item?.children) {
        console.warn(`⚠️  No children found for path: ${path}`);
        break;
      }

      const { results, pageInfo, total } = data.item.children;
      
      // Set total on first iteration
      if (totalItems === null && total) {
        totalItems = total;
        console.log(`📊 Total items available: ${totalItems}`);
      }
      
      if (results && results.length > 0) {
        allItems.push(...results);
        totalFetched += results.length;
        
        console.log(`📊 Fetched ${results.length} items (${totalFetched}/${totalItems || '?'} total)`);
      }

      // Check if there are more pages using Sitecore's hasNext field
      hasNext = pageInfo?.hasNext || false;
      cursor = pageInfo?.endCursor || null;

      // Safety checks to prevent infinite loops
      if (!cursor && hasNext) {
        console.warn('⚠️  hasNext is true but no endCursor provided, stopping pagination');
        hasNext = false;
      }

      // If we got fewer results than requested, we might be at the end
      if (results && results.length < PAGE_SIZE) {
        console.log('📄 Received fewer items than requested, likely at end of results');
        hasNext = false;
      }

    } catch (error) {
      console.error(`❌ Error during cursor pagination: ${error.message}`);
      break;
    }
  }

  console.log(`✅ Completed fetching ${totalFetched} items for ${path}`);
  return allItems;
}

/**
 * Fetch all items using batch requests (fallback for when cursor pagination fails)
 * Since Sitecore XMC doesn't support offset, we'll use multiple batch requests
 * @param {string} path - Sitecore path to query
 * @returns {Promise<Array>} - All items from the path
 */
async function fetchAllItemsWithBatch(path) {
  const allItems = [];
  let batchSize = PAGE_SIZE;
  let totalItems = null;

  console.log(`📄 Starting batch fetching for: ${path}`);

  try {
    // First, try to get a larger batch to see if we can get all items at once
    const variables = {
      path,
      first: 100 // Try larger batch first
    };

    const data = await executeGraphQLQuery(GET_ITEMS_BATCH_QUERY, variables);
    
    if (!data?.item?.children) {
      console.warn(`⚠️  No children found for path: ${path}`);
      return [];
    }

    const { results, total } = data.item.children;
    totalItems = total;
    
    console.log(`📊 Found ${totalItems} total items, fetched ${results?.length || 0} in first batch`);
    
    if (results && results.length > 0) {
      allItems.push(...results);
    }

    // If we got all items in the first batch, we're done
    if (results && results.length >= totalItems) {
      console.log(`✅ Got all ${totalItems} items in single batch`);
      return allItems;
    }

  } catch (error) {
    console.error(`❌ Batch fetching failed: ${error.message}`);
    
    // Fall back to basic query without pagination
    console.log('🔄 Falling back to basic query without pagination parameters');
    try {
      const data = await executeGraphQLQuery(GET_BASIC_ITEMS_QUERY, { path });
      
      if (data?.item?.children?.results) {
        console.log(`✅ Retrieved ${data.item.children.results.length} items using basic query`);
        return data.item.children.results;
      }
    } catch (basicError) {
      console.error(`❌ Basic query also failed: ${basicError.message}`);
    }
  }

  return allItems;
}

/**
 * Fetch all items for a path, trying cursor-based pagination first, then batch method
 * @param {string} path - Sitecore path to query
 * @returns {Promise<Array>} - All items from the path
 */
async function fetchAllItems(path) {
  try {
    // Try cursor-based pagination first (ideal for large datasets)
    console.log(`🎯 Attempting cursor-based pagination for: ${path}`);
    return await fetchAllItemsWithCursor(path);
  } catch (error) {
    console.warn(`⚠️  Cursor-based pagination failed, trying batch method: ${error.message}`);
    
    try {
      // Fallback to batch fetching
      return await fetchAllItemsWithBatch(path);
    } catch (fallbackError) {
      console.error(`❌ All pagination methods failed for ${path}:`, fallbackError.message);
      
      // Last resort: try basic query without any pagination
      console.log('🆘 Last resort: trying basic query without pagination');
      try {
        const data = await executeGraphQLQuery(GET_BASIC_ITEMS_QUERY, { path });
        if (data?.item?.children?.results) {
          console.log(`✅ Basic query succeeded with ${data.item.children.results.length} items`);
          return data.item.children.results;
        }
      } catch (basicError) {
        console.error(`❌ Even basic query failed: ${basicError.message}`);
      }
      
      return [];
    }
  }
}

/**
 * Extract field values from Sitecore item fields array
 * @param {Array} fields - Array of field objects from Sitecore
 * @returns {object} - Key-value pairs of field names and values
 */
function extractFieldValues(fields) {
  if (!fields || !Array.isArray(fields)) return {};
  
  return fields.reduce((acc, field) => {
    if (field.name && field.value) {
      // Convert field name to camelCase for easier JavaScript usage
      const camelCaseName = field.name
        .replace(/[^a-zA-Z0-9]/g, ' ')
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
          return index === 0 ? word.toLowerCase() : word.toUpperCase();
        })
        .replace(/\s+/g, '');
      
      acc[camelCaseName] = field.value;
    }
    return acc;
  }, {});
}

/**
 * Transform the raw GraphQL data into a more usable format
 * @param {Array} items - Raw items from GraphQL
 * @param {string} pathKey - The key identifier for this path
 * @returns {object} - Transformed data structure
 */
function transformData(items, pathKey) {
  if (!items || !Array.isArray(items)) {
    console.warn(`⚠️  No items array found for path key: ${pathKey}`);
    return {
      items: [],
      count: 0
    };
  }

  // Transform items into a more accessible format
  const transformedItems = items.map(item => {
    const fieldValues = extractFieldValues(item.fields);
    
    return {
      id: item.id,
      name: item.name,
      displayName: item.displayName || item.name,
      path: item.path,
      template: item.template?.name,
      // Create a slug from the name for URL-friendly usage
      slug: item.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || '',
      // Include extracted field values
      fields: fieldValues,
      // Raw fields for debugging if needed
      rawFields: item.fields || []
    };
  });

  return {
    items: transformedItems,
    count: transformedItems.length,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Main function to generate the SIS data JSON
 */
async function generateSisData() {
  console.log('🚀 Starting SIS data generation with pagination support...');
  
  // Validate required environment variables
  if (!API_KEY) {
    console.warn('⚠️  SITECORE_API_KEY not found in environment variables');
  }

  const sisData = {
    metadata: {
      generatedAt: new Date().toISOString(),
      version: '2.0.0',
      source: 'Sitecore XMC GraphQL',
      pageSize: PAGE_SIZE,
      maxItems: MAX_ITEMS
    },
    data: {}
  };

  // Process each path configuration
  for (const pathConfig of PATHS_CONFIG) {
    try {
      console.log(`\n📊 Processing ${pathConfig.key}...`);
      
      // Fetch all items for this path with pagination
      const allItems = await fetchAllItems(pathConfig.path);
      
      // Transform and store the data
      sisData.data[pathConfig.key] = transformData(allItems, pathConfig.key);
      
      console.log(`✅ Successfully processed ${pathConfig.key} - Found ${sisData.data[pathConfig.key].count} items`);
      
    } catch (error) {
      console.error(`❌ Failed to process ${pathConfig.key}:`, error.message);
      
      // Add empty data structure for failed queries to prevent build issues
      sisData.data[pathConfig.key] = {
        items: [],
        count: 0,
        error: error.message,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  // Ensure src/data directory exists
  const dataDir = join(__dirname, '../src/data');
  mkdirSync(dataDir, { recursive: true });

  // Write the JSON file
  const outputPath = join(dataDir, 'sis-data.json');
  
  try {
    writeFileSync(outputPath, JSON.stringify(sisData, null, 2), 'utf8');
    console.log(`\n🎉 Successfully generated SIS data at: ${outputPath}`);
    
    // Log summary
    console.log('\n📈 Generation Summary:');
    let totalItems = 0;
    Object.entries(sisData.data).forEach(([key, data]) => {
      totalItems += data.count;
      console.log(`  - ${key}: ${data.count} items ${data.error ? `(❌ Error: ${data.error})` : '✅'}`);
    });
    console.log(`  📊 Total items across all categories: ${totalItems}`);
    
  } catch (error) {
    console.error('❌ Failed to write JSON file:', error.message);
    process.exit(1);
  }

  return sisData;
}

/**
 * Create a lookup map for easy data access
 * This generates an additional file for quick ID-based lookups
 */
function generateLookupMap(sisData) {
  const lookupMap = {
    metadata: sisData.metadata,
    lookups: {}
  };

  // Create ID-based lookups for each data type
  Object.entries(sisData.data).forEach(([key, data]) => {
    lookupMap.lookups[key] = {
      byId: {},
      byName: {},
      bySlug: {}
    };
    
    data.items.forEach(item => {
      // ID-based lookup
      lookupMap.lookups[key].byId[item.id] = item;
      
      // Name-based lookup
      if (item.name) {
        lookupMap.lookups[key].byName[item.name.toLowerCase()] = item;
      }
      
      // Slug-based lookup
      if (item.slug) {
        lookupMap.lookups[key].bySlug[item.slug] = item;
      }
    });
  });

  // Write lookup map file
  const outputPath = join(__dirname, '../src/data/sis-data-lookup.json');
  writeFileSync(outputPath, JSON.stringify(lookupMap, null, 2), 'utf8');
  console.log(`📋 Generated lookup map at: ${outputPath}`);
}

/**
 * Generate TypeScript definitions for the data structure
 */
function generateTypeDefinitions(sisData) {
  let typeDefinitions = `// Auto-generated TypeScript definitions for SIS data
// Generated at: ${new Date().toISOString()}

export interface SisItem {
  id: string;
  name: string;
  displayName: string;
  path: string;
  template?: string;
  slug: string;
  fields: Record<string, string>;
  rawFields: Array<{ name: string; value: string }>;
}

export interface SisDataCategory {
  items: SisItem[];
  count: number;
  lastUpdated: string;
  error?: string;
}

export interface SisData {
  metadata: {
    generatedAt: string;
    version: string;
    source: string;
    pageSize: number;
    maxItems: number;
  };
  data: {
`;

  // Add specific types for each category
  Object.keys(sisData.data).forEach(key => {
    typeDefinitions += `    ${key}: SisDataCategory;\n`;
  });

  typeDefinitions += `  };
}

export interface SisLookupMap {
  metadata: SisData['metadata'];
  lookups: {
`;

  Object.keys(sisData.data).forEach(key => {
    typeDefinitions += `    ${key}: {
      byId: Record<string, SisItem>;
      byName: Record<string, SisItem>;
      bySlug: Record<string, SisItem>;
    };\n`;
  });

  typeDefinitions += `  };
}
`;

  // Write TypeScript definitions
  const outputPath = join(__dirname, '../src/types/sis-data.ts');
  const typesDir = dirname(outputPath);
  mkdirSync(typesDir, { recursive: true });
  
  writeFileSync(outputPath, typeDefinitions, 'utf8');
  console.log(`📝 Generated TypeScript definitions at: ${outputPath}`);
}

// Execute the script
(async () => {
  try {
    const sisData = await generateSisData();
    
    // Generate lookup map
    generateLookupMap(sisData);
    
    // Generate TypeScript definitions
    generateTypeDefinitions(sisData);
    
    console.log('\n🏁 SIS data generation completed successfully!');
    console.log('\n📋 Generated files:');
    console.log('  - src/data/sis-data.json (main data file)');
    console.log('  - src/data/sis-data-lookup.json (lookup maps)');
    console.log('  - src/types/sis-data.ts (TypeScript definitions)');
    
  } catch (error) {
    console.error('\n💥 Script execution failed:', error.message);
    process.exit(1);
  }
})();