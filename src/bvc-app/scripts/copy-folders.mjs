#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';

/**
 * Simple script to copy specific folders from src/ to public/
 * Handles both creating new folders and updating existing ones
 */

const FOLDERS_TO_COPY = [
  'src/data'
];

/**
 * Recursively copy a directory and all its contents
 */
async function copyDirectory(src, dest) {
  try {
    // Create destination directory if it doesn't exist
    await fs.mkdir(dest, { recursive: true });
    
    // Read the source directory
    const entries = await fs.readdir(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        // Recursively copy subdirectories
        await copyDirectory(srcPath, destPath);
      } else {
        // Copy files
        await fs.copyFile(srcPath, destPath);
        console.log(`Copied: ${srcPath} → ${destPath}`);
      }
    }
  } catch (error) {
    console.error(`Error copying directory ${src}:`, error.message);
  }
}

/**
 * Check if a directory exists
 */
async function directoryExists(dirPath) {
  try {
    const stats = await fs.stat(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Main function to copy all specified folders
 */
async function copyFolders() {
  console.log('🚀 Starting folder copy process...\n');
  
  for (const srcFolder of FOLDERS_TO_COPY) {
    // Check if source folder exists
    if (!(await directoryExists(srcFolder))) {
      console.log(`⚠️  Source folder doesn't exist: ${srcFolder}`);
      continue;
    }
    
    // Create destination path by replacing 'src/' with 'public/'
    const destFolder = srcFolder.replace(/^src\//, 'public/');
    
    console.log(`📁 Processing: ${srcFolder} → ${destFolder}`);
    
    // Check if destination exists
    const destExists = await directoryExists(destFolder);
    if (destExists) {
      console.log(`   Updating existing folder...`);
    } else {
      console.log(`   Creating new folder...`);
    }
    
    // Copy the directory
    await copyDirectory(srcFolder, destFolder);
    console.log(`✅ Completed: ${destFolder}\n`);
  }
  
  console.log('🎉 All folders processed successfully!');
}

// Run the script
copyFolders().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});