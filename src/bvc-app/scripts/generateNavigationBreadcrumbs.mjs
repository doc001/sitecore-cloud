// scripts/generateBreadcrumbs.mjs
/**
 * Simple and robust breadcrumb generator from navigation data
 * 
 * Usage: node scripts/generateBreadcrumbs.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting breadcrumb generation...');
console.log('📁 Script directory:', __dirname);

// Try to find the files in common locations
const possiblePaths = {
  navigationData: [
    path.join(__dirname, '../navigation-data.json'),
    path.join(__dirname, '../src/data/navigation-data.json'),
    path.join(__dirname, '../src/data/static/navigation-data.json'),
    path.join(__dirname, '../data/navigation-data.json'),
    path.join(process.cwd(), 'navigation-data.json'),
    path.join(process.cwd(), 'src/data/navigation-data.json')
  ],
  programsData: [
    path.join(__dirname, '../programs.json'),
    path.join(__dirname, '../src/data/programs.json'),
    path.join(__dirname, '../src/data/cms/programs.json'),
    path.join(__dirname, '../data/programs.json'),
    path.join(process.cwd(), 'programs.json'),
    path.join(process.cwd(), 'src/data/programs.json')
  ]
};

function findFile(pathArray, fileName) {
  console.log(`🔍 Looking for ${fileName}...`);
  
  for (const filePath of pathArray) {
    console.log(`   Checking: ${filePath}`);
    try {
      if (fs.existsSync(filePath)) {
        console.log(`✅ Found ${fileName} at: ${filePath}`);
        return filePath;
      }
    } catch (error) {
      console.log(`   ❌ Error checking ${filePath}:`, error.message);
    }
  }
  
  console.log(`❌ Could not find ${fileName} in any of the expected locations`);
  return null;
}

async function generateBreadcrumbs() {
  try {
    // Find the input files
    const navigationPath = findFile(possiblePaths.navigationData, 'navigation-data.json');
    const programsPath = findFile(possiblePaths.programsData, 'programs.json');
    
    if (!navigationPath) {
      console.error('❌ navigation-data.json not found. Please ensure the file exists.');
      process.exit(1);
    }
    
    // Read navigation data
    console.log('📖 Reading navigation data...');
    const navigationRaw = fs.readFileSync(navigationPath, 'utf-8');
    const navigationData = JSON.parse(navigationRaw);
    console.log('✅ Navigation data loaded');
    
    // Read programs data if available
    let programsData = [];
    if (programsPath) {
      console.log('📖 Reading programs data...');
      const programsRaw = fs.readFileSync(programsPath, 'utf-8');
      programsData = JSON.parse(programsRaw);
      console.log(`✅ Programs data loaded (${programsData.length} programs)`);
    } else {
      console.log('⚠️  Programs data not found, continuing without program breadcrumbs');
    }
    
    // Generate breadcrumbs
    console.log('🔄 Generating breadcrumbs...');
    const breadcrumbs = generateNavigationBreadcrumbs(navigationData, programsData);
    
    // Determine output path - create in src/data/static folder
    const outputDir = path.join(process.cwd(), 'src', 'data', 'static');
    const outputPath = path.join(outputDir, 'navigation-breadcrumbs.json');
    
    // Ensure the output directory exists
    console.log('📁 Ensuring output directory exists:', outputDir);
    fs.mkdirSync(outputDir, { recursive: true });
    
    console.log('💾 Writing breadcrumbs to:', outputPath);
    
    // Write output file
    fs.writeFileSync(outputPath, JSON.stringify(breadcrumbs, null, 2), 'utf-8');
    
    console.log('✅ Breadcrumbs generated successfully!');
    console.log(`📊 Generated ${Object.keys(breadcrumbs.static).length} routes`);
    console.log(`📁 Output file: ${outputPath}`);
    
  } catch (error) {
    console.error('❌ Error generating breadcrumbs:', error);
    process.exit(1);
  }
}

function generateNavigationBreadcrumbs(navigationData, programsData = []) {
  console.log('🔨 Processing navigation structure...');
  
  const breadcrumbs = {
    static: {
      // Add home page
      'home': [
        { label: 'Home', href: '/', isCurrentPage: true }
      ]
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      version: '1.0.0',
      source: 'navigation-data.json'
    }
  };
  
  // Check if navigationData has the expected structure
  if (!navigationData.navigationData?.mainMenu?.tabs) {
    console.log('📋 Navigation structure:', Object.keys(navigationData));
    if (navigationData.mainMenu?.tabs) {
      // Direct structure
      processNavigationTabs(navigationData.mainMenu.tabs, breadcrumbs);
    } else if (navigationData.tabs) {
      // Even more direct
      processNavigationTabs(navigationData.tabs, breadcrumbs);
    } else {
      console.error('❌ Could not find navigation tabs in the expected structure');
      console.log('Available keys:', Object.keys(navigationData));
      return breadcrumbs;
    }
  } else {
    // Expected nested structure
    processNavigationTabs(navigationData.navigationData.mainMenu.tabs, breadcrumbs);
  }
  
  // Add program-specific breadcrumbs if programs data is available
  if (programsData.length > 0) {
    console.log('🔄 Adding program breadcrumbs...');
    addProgramBreadcrumbs(programsData, breadcrumbs);
  }
  
  return breadcrumbs;
}

function processNavigationTabs(tabs, breadcrumbs) {
  console.log(`🔄 Processing ${tabs.length} navigation tabs...`);
  
  tabs.forEach(tab => {
    console.log(`   Processing tab: ${tab.label}`);
    
    // Add direct tab route if it's not 'study'
    if (tab.id !== 'study') {
      const tabPath = tab.id === 'about-us' ? 'about-us' : tab.id;
      breadcrumbs.static[tabPath] = [
        { label: tab.label, href: `/${tabPath}`, isCurrentPage: true }
      ];
    }
    
    // Process submenus
    if (tab.submenus) {
      tab.submenus.forEach(submenu => {
        console.log(`     Processing submenu: ${submenu.label}`);
        
        if (submenu.items) {
          submenu.items.forEach(itemGroup => {
            if (itemGroup.links) {
              itemGroup.links.forEach(link => {
                if (!link.isExternal && link.url) {
                  const urlPath = link.url.replace(/^\//, '');
                  if (urlPath) {
                    breadcrumbs.static[urlPath] = generateBreadcrumbForLink(tab, submenu, link);
                  }
                }
              });
            }
          });
        }
      });
    }
  });
}

function generateBreadcrumbForLink(tab, submenu, link) {
  const breadcrumbItems = [];
  
  // Add tab (no link for reversed logic)
  breadcrumbItems.push({
    label: tab.label
  });
  
  // Add submenu if it's meaningful
  if (submenu.label !== tab.label && !isDirectTabLink(link.url, tab.id)) {
    breadcrumbItems.push({
      label: submenu.label
    });
  }
  
  // Add current page (with link for reversed logic)
  breadcrumbItems.push({
    label: link.label,
    href: link.url,
    isCurrentPage: true
  });
  
  return breadcrumbItems;
}

function isDirectTabLink(url, tabId) {
  const directTabUrls = {
    'study': ['/study'],
    'apply': ['/apply'],
    'student-life': ['/student-life'],
    'applied-research': ['/applied-research'],
    'about-us': ['/about-us']
  };
  
  return directTabUrls[tabId]?.includes(url) || false;
}

function addProgramBreadcrumbs(programsData, breadcrumbs) {
  const publishedPrograms = programsData.filter(program => 
    program.Archived === 'false' && program.Draft === 'false'
  );
  
  console.log(`   Adding breadcrumbs for ${publishedPrograms.length} published programs...`);
  
  publishedPrograms.forEach(program => {
    // Basic program page breadcrumb
    const basicPath = `programs/${program.Slug}`;
    breadcrumbs.static[basicPath] = [
      { label: 'Study' },
      { 
        label: program.Name, 
        href: `/programs/${program.Slug}`, 
        isCurrentPage: true 
      }
    ];
  });
}

// Run the script
generateBreadcrumbs();