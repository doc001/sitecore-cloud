import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const API_KEY = '1de0a54766cd85198cd74190cf1a5f9fcbb8b1654ddc380900e87ecceaffb88f';
const BASE_URL = 'https://api.webflow.com/v2';
const SITE_ID = '66a28fdfe76f2f849d7b00f3';
const PROGRAMS_COLLECTION_ID = '66e850bcbf766fccf5d09a24';

// Ensure data directory exists
const dataDir = path.join(__dirname, '../src/data/cms');
console.log(`📂 Data directory: ${dataDir}`);

if (!fs.existsSync(dataDir)) {
  console.log('🔨 Creating data directory...');
  fs.mkdirSync(dataDir, { recursive: true });
}

/**
 * Get collection info to determine the collection name
 */
async function getCollectionInfo(siteId, collectionId) {
  const url = `${BASE_URL}/sites/${siteId}/collections/${collectionId}`;
  
  console.log(`🔍 Fetching collection info from: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`📡 Collection info response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error Response: ${errorText}`);
      throw new Error(`Failed to fetch collection info: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Collection info retrieved: ${data.displayName || data.slug}`);
    return data;
  } catch (error) {
    console.error('❌ Error fetching collection info:', error);
    throw error;
  }
}

/**
 * Fetch all items from a Webflow collection
 */
async function fetchCollectionItems(siteId, collectionId) {
  const url = `${BASE_URL}/sites/${siteId}/collections/${collectionId}/items`;
  
  console.log(`🔍 Fetching items from: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`📡 Items response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error Response: ${errorText}`);
      throw new Error(`Failed to fetch collection items: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Items retrieved: ${data.items?.length || 0} items`);
    return data;
  } catch (error) {
    console.error('❌ Error fetching collection items:', error);
    throw error;
  }
}

/**
 * Save data to JSON file
 */
function saveToFile(data, filename) {
  const filePath = path.join(dataDir, `${filename}.json`);
  
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`✅ Data saved to: ${filePath}`);
    console.log(`📄 File size: ${fs.statSync(filePath).size} bytes`);
  } catch (error) {
    console.error('❌ Error saving file:', error);
    throw error;
  }
}

/**
 * List all collections in a site
 */
async function listCollections(siteId) {
  const url = `${BASE_URL}/sites/${siteId}/collections`;
  
  console.log(`🔍 Listing collections from: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`📡 Collections response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error Response: ${errorText}`);
      throw new Error(`Failed to list collections: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Found ${data.collections?.length || 0} collections`);
    
    // List all collections with their IDs
    if (data.collections) {
      console.log(`📋 Available collections:`);
      data.collections.forEach(collection => {
        console.log(`  - ${collection.displayName || collection.slug} (ID: ${collection.id})`);
      });
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error listing collections:', error);
    throw error;
  }
}

/**
 * Main function to fetch and save collection data
 */
async function fetchAndSaveCollection(siteId = SITE_ID, collectionId = PROGRAMS_COLLECTION_ID) {
  try {
    console.log(`🚀 Starting Webflow data fetch...`);
    console.log(`🌐 Site ID: ${siteId}`);
    console.log(`📁 Collection ID: ${collectionId}`);
    
    // First, list all collections to see what's available
    console.log(`🔍 Checking available collections...`);
    const collectionsData = await listCollections(siteId);
    
    // Check if our target collection exists
    const targetCollection = collectionsData.collections?.find(col => col.id === collectionId);
    
    if (!targetCollection) {
      console.error(`❌ Collection ${collectionId} not found in site ${siteId}`);
      console.log(`💡 Available collections listed above. Please use one of those collection IDs.`);
      process.exit(1);
    }
    
    const collectionName = targetCollection.displayName || targetCollection.slug || 'unknown-collection';
    console.log(`✅ Found target collection: "${collectionName}"`);
    
    console.log(`📊 Fetching items from "${collectionName}" collection...`);
    
    // Fetch all items from the collection
    const itemsData = await fetchCollectionItems(siteId, collectionId);
    
    console.log(`📊 Found ${itemsData.items?.length || 0} items`);
    
    // Create a clean filename from collection name
    const cleanFilename = collectionName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Save the data
    saveToFile(itemsData, cleanFilename);
    
    console.log(`🎉 Successfully processed collection: ${collectionName}`);
    return itemsData;
    
  } catch (error) {
    console.error('❌ Error processing collection:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Export for use in other modules
export { fetchAndSaveCollection, fetchCollectionItems, getCollectionInfo, listCollections };

// Always run the main function
console.log('🚀 Starting Webflow data fetch...');
fetchAndSaveCollection()
  .then(() => {
    console.log('✨ Process completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Process failed:', error);
    process.exit(1);
  });