// scripts/generateNavigationBreadcrumbs.mjs
/**
 * Build-time script to generate breadcrumbs from navigation-data.json
 * 
 * This script reads the navigation structure and automatically generates
 * breadcrumb mappings following the navigation hierarchy.
 * 
 * Run this script during build process:
 * node scripts/generateNavigationBreadcrumbs.mjs
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  // Input files
  navigationDataPath: path.join(__dirname, '../src/data/static/navigation-data.json'),
  programsDataPath: path.join(__dirname, '../src/data/cms/Programs.json'),
  
  // Output file
  outputPath: path.join(__dirname, '../src/data/static/navigation-breadcrumbs.json'),
  
  // Ensure output directory exists
  outputDir: path.join(__dirname, '../src/data/static'),
};

/**
 * Helper function to convert program area to URL slug
 */
function areaToSlug(area) {
  return area
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')         // Replace spaces with hyphens
    .replace(/-+/g, '-')          // Replace multiple hyphens with single
    .trim();
}

/**
 * Helper function to determine submenu href
 */
function getSubmenuHref(submenu, tab) {
  // Special mappings for submenus that should have their own pages
  const submenuMappings = {
    'professional-development': '/study/professional-development-overview',
    'tuition-and-fees': '/study/tuition-and-fees',
    'ready-to-apply': '/apply/ready-to-apply',
    'financial-support': '/apply/financial/overview',
    'dates-deadlines': '/apply/dates-and-deadlines',
    'my-application': '/apply/my-application',
    'campus-life': '/student-life/campus-life',
    'student-support': '/student-life/student-support',
    'caree-employment': '/student-life/career-and-employment',
    'community': '/student-life/community',
    'graduation-convocation': '/student-life/graduation-and-convocation',
    'about': '/applied-research/about',
    'our-pillars': '/applied-research/our-pillars',
    'get-involved': '/applied-research/get-involved',
    'get-to-know-us': '/about-us/get-to-know-us',
    'our-organization': '/about-us/our-organization',
    'executive-offices-governance': '/about-us/governance',
    'schools': '/about-us/schools',
    'news-events': '/about-us/news-and-events',
    'contact-us': '/about-us/contact-us'
  };
  
  return submenuMappings[submenu.id];
}

/**
 * Check if a URL is a direct tab link
 */
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

/**
 * Generate breadcrumbs from navigation structure
 */
function generateNavigationBreadcrumbs(navigationData) {
  const breadcrumbs = {};
  
  // Process each tab
  navigationData.mainMenu.tabs.forEach(tab => {
    // Add direct tab routes
    if (tab.id !== 'study') { // Study is handled differently
      const tabPath = tab.id === 'about-us' ? 'about-us' : tab.id;
      breadcrumbs[tabPath] = [
        { label: tab.label, href: `/${tabPath}`, isCurrentPage: true }
      ];
    }
    
    // Process submenus
    tab.submenus.forEach(submenu => {
      // Process items in each submenu
      submenu.items.forEach(itemGroup => {
        itemGroup.links.forEach(link => {
          if (link.isExternal) return; // Skip external links
          
          const urlPath = link.url.replace(/^\//, ''); // Remove leading slash
          if (!urlPath) return; // Skip empty paths
          
          // Generate breadcrumb hierarchy
          const breadcrumbItems = [];
          
          // Add tab (no link for reversed logic)
          breadcrumbItems.push({
            label: tab.label
          });
          
          // Add submenu if it's not a direct tab link and has a meaningful submenu
          if (!isDirectTabLink(link.url, tab.id) && 
              submenu.label !== tab.label && 
              !isTopLevelPage(link.url, tab.id)) {
            
            const submenuHref = getSubmenuHref(submenu, tab);
            breadcrumbItems.push({
              label: submenu.label,
              ...(submenuHref && { href: submenuHref })
            });
          }
          
          // Add current page (with link for reversed logic)
          breadcrumbItems.push({
            label: link.label,
            href: link.url,
            isCurrentPage: true
          });
          
          breadcrumbs[urlPath] = breadcrumbItems;
        });
      });
    });
  });
  
  return breadcrumbs;
}

/**
 * Check if this is a top-level page under a tab
 */
function isTopLevelPage(url, tabId) {
  const topLevelPages = {
    'study': ['/program-list', '/apply/ready-to-apply', '/apply/financial/overview'],
    'apply': ['/apply/ready-to-apply', '/academic-calendar'],
    'student-life': ['/student-life'],
    'applied-research': ['/applied-research'],
    'about-us': ['/about-us', '/alumni']
  };
  
  return topLevelPages[tabId]?.includes(url) || false;
}

/**
 * Generate breadcrumbs for program pages
 */
function generateProgramBreadcrumbs(programs) {
  const programBreadcrumbs = {};
  
  programs.forEach(program => {
    // Skip archived or draft programs
    if (program.Archived === 'true' || program.Draft === 'true') {
      return;
    }
    
    // Basic program page breadcrumb (under Study tab)
    const basicPath = `programs/${program.Slug}`;
    programBreadcrumbs[basicPath] = [
      { label: 'Study' }, // Tab - no link
      { 
        label: program.Name, 
        href: `/programs/${program.Slug}`, 
        isCurrentPage: true 
      }
    ];
    
    // Program area-based breadcrumbs
    if (program['Program area']) {
      const areaSlug = areaToSlug(program['Program area']);
      const areaPath = `program-areas/${areaSlug}/${program.Slug}`;
      
      programBreadcrumbs[areaPath] = [
        { label: 'Study' }, // Tab - no link
        { 
          label: program['Program area'], 
          href: `/program-areas/${areaSlug}` 
        },
        { 
          label: program.Name, 
          href: `/program-areas/${areaSlug}/${program.Slug}`, 
          isCurrentPage: true 
        }
      ];
    }
  });
  
  return programBreadcrumbs;
}

/**
 * Generate breadcrumbs for program area category pages
 */
function generateProgramAreaBreadcrumbs(programs) {
  const areas = new Set();
  
  // Extract unique program areas
  programs.forEach(program => {
    if (program.Archived === 'true' || program.Draft === 'true') return;
    if (program['Program area']) {
      areas.add(program['Program area']);
    }
  });
  
  const areaBreadcrumbs = {};
  
  // Generate breadcrumbs for each area
  areas.forEach(area => {
    const areaSlug = areaToSlug(area);
    areaBreadcrumbs[`program-areas/${areaSlug}`] = [
      { label: 'Study' }, // Tab - no link
      { 
        label: area, 
        href: `/program-areas/${areaSlug}`, 
        isCurrentPage: true 
      }
    ];
  });
  
  return areaBreadcrumbs;
}

/**
 * Generate fallback mappings
 */
function generateFallbacks(navigationData, programs) {
  const segments = {};
  const tabMapping = {};
  
  // Extract tab mappings
  navigationData.mainMenu.tabs.forEach(tab => {
    tabMapping[tab.id] = tab.label;
  });
  
  // Common segment mappings
  const commonSegments = {
    'health-wellness': 'Health & Wellness',
    'entertainment-arts': 'Entertainment Arts',
    'community-studies': 'Community Studies',
    'academic-upgrading': 'Academic Upgrading',
    'university-transfer': 'University Transfer',
    'open-studies': 'Open Studies',
    'professional-development': 'Professional Development',
    'extended-education': 'Extended Education',
    'corporate-training': 'Corporate Training',
    'tuition-and-fees': 'Tuition & Fees',
    'high-school': 'High School',
    'international-students': 'International Students',
    'ready-to-apply': 'Ready to Apply',
    'dates-deadlines': 'Dates & Deadlines',
    'my-application': 'My Application',
    'financial-support': 'Financial Support',
    'student-life': 'Student Life',
    'campus-life': 'Campus Life',
    'student-support': 'Student Support',
    'career-employment': 'Career & Employment',
    'graduation-convocation': 'Graduation & Convocation',
    'applied-research': 'Applied Research',
    'our-pillars': 'Our Pillars',
    'get-involved': 'Get Involved',
    'about-us': 'About Us',
    'get-to-know-us': 'Get to know us',
    'our-organization': 'Our Organization',
    'executive-offices-governance': 'Executive Offices & Governance',
    'news-events': 'News & Events',
    'contact-us': 'Contact us'
  };
  
  Object.assign(segments, commonSegments);
  
  return { segments, tabMapping };
}

/**
 * Main build function
 */
async function buildNavigationBreadcrumbs() {
  try {
    console.log('🔨 Building navigation-based breadcrumbs...');
    
    // Ensure output directory exists
    await fs.mkdir(CONFIG.outputDir, { recursive: true });
    
    // Read navigation data
    console.log('📖 Reading navigation data...');
    const navigationData = JSON.parse(
      await fs.readFile(CONFIG.navigationDataPath, 'utf-8')
    );
    
    // Read programs data
    console.log('📖 Reading programs data...');
    const programsData = JSON.parse(
      await fs.readFile(CONFIG.programsDataPath, 'utf-8')
    );
    
    // Generate navigation-based breadcrumbs
    console.log('🔄 Generating navigation breadcrumbs...');
    const navBreadcrumbs = generateNavigationBreadcrumbs(navigationData.navigationData);
    
    // Generate program-specific breadcrumbs
    console.log('🔄 Generating program breadcrumbs...');
    const programBreadcrumbs = generateProgramBreadcrumbs(programsData);
    
    // Generate program area breadcrumbs
    console.log('🔄 Generating program area breadcrumbs...');
    const areaBreadcrumbs = generateProgramAreaBreadcrumbs(programsData);
    
    // Generate fallback mappings
    console.log('🔄 Generating fallback mappings...');
    const fallbacks = generateFallbacks(navigationData.navigationData, programsData);
    
    // Combine all breadcrumbs
    const completeBreadcrumbs = {
      static: {
        // Add home page
        'home': [
          { label: 'Home', href: '/', isCurrentPage: true }
        ],
        ...navBreadcrumbs,
        ...programBreadcrumbs,
        ...areaBreadcrumbs
      },
      patterns: {
        'programs/[slug]': {
          template: [
            { label: 'Study' },
            { label: '{programName}', href: '/programs/{slug}', isCurrentPage: true }
          ],
          dataSource: 'programs',
          mapping: {
            programName: 'Name',
            slug: 'Slug'
          }
        },
        'program-areas/[area]/[slug]': {
          template: [
            { label: 'Study' },
            { label: '{areaName}', href: '/program-areas/{area}' },
            { label: '{programName}', href: '/program-areas/{area}/{slug}', isCurrentPage: true }
          ],
          dataSource: 'programs',
          mapping: {
            areaName: 'Program area',
            programName: 'Name',
            area: 'Program area:slug',
            slug: 'Slug'
          }
        }
      },
      fallbacks,
      metadata: {
        version: '2.0.0',
        lastUpdated: new Date().toISOString(),
        description: 'Navigation-based breadcrumb configuration for Bow Valley College SSG site',
        source: 'navigation-data.json',
        reversedLogic: true,
        structure: 'Tab (no link) -> Submenu (optional link) -> Current Page (link)',
        buildStats: {
          navigationRoutes: Object.keys(navBreadcrumbs).length,
          programRoutes: Object.keys(programBreadcrumbs).length,
          areaRoutes: Object.keys(areaBreadcrumbs).length,
          totalRoutes: Object.keys(navBreadcrumbs).length + 
                       Object.keys(programBreadcrumbs).length + 
                       Object.keys(areaBreadcrumbs).length + 1 // +1 for home
        }
      }
    };
    
    // Write complete breadcrumbs file
    console.log('💾 Writing navigation breadcrumbs file...');
    await fs.writeFile(
      CONFIG.outputPath,
      JSON.stringify(completeBreadcrumbs, null, 2),
      'utf-8'
    );
    
    // Generate summary
    const stats = completeBreadcrumbs.metadata.buildStats;
    console.log('✅ Build complete!');
    console.log(`📊 Generated ${stats.totalRoutes} total breadcrumb routes:`);
    console.log(`   - ${stats.navigationRoutes} navigation routes`);
    console.log(`   - ${stats.programRoutes} program routes`);
    console.log(`   - ${stats.areaRoutes} program area routes`);
    console.log(`📁 Output: ${CONFIG.outputPath}`);
    
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

/**
 * Validation function
 */
async function validateBreadcrumbs() {
  try {
    console.log('🔍 Validating breadcrumb structure...');
    
    const breadcrumbData = JSON.parse(
      await fs.readFile(CONFIG.outputPath, 'utf-8')
    );
    
    let validationErrors = 0;
    
    Object.entries(breadcrumbData.static).forEach(([path, breadcrumbs]) => {
      if (!Array.isArray(breadcrumbs) || breadcrumbs.length === 0) {
        console.warn(`⚠️  Invalid breadcrumbs for path: ${path}`);
        validationErrors++;
        return;
      }
      
      const lastItem = breadcrumbs[breadcrumbs.length - 1];
      const firstItem = breadcrumbs[0];
      
      // Check reversed logic
      if (breadcrumbs.length > 1 && firstItem.href) {
        console.warn(`⚠️  First breadcrumb item (tab) should not have href for path: ${path}`);
        validationErrors++;
      }
      
      // Check if last item has href and isCurrentPage
      if (!lastItem.href || !lastItem.isCurrentPage) {
        console.warn(`⚠️  Last breadcrumb item missing href or isCurrentPage for path: ${path}`);
        validationErrors++;
      }
    });
    
    if (validationErrors === 0) {
      console.log('✅ All breadcrumbs are valid!');
    } else {
      console.log(`⚠️  Found ${validationErrors} validation issues`);
    }
    
    return validationErrors === 0;
  } catch (error) {
    console.error('❌ Validation failed:', error);
    return false;
  }
}

/**
 * Generate TypeScript types
 */
async function generateBreadcrumbTypes() {
  try {
    console.log('🔧 Generating TypeScript types...');
    
    const breadcrumbData = JSON.parse(
      await fs.readFile(CONFIG.outputPath, 'utf-8')
    );
    
    const routes = Object.keys(breadcrumbData.static);
    
    const typeDefinition = `// Auto-generated navigation-based breadcrumb types
// Generated on: ${new Date().toISOString()}
// Source: navigation-data.json

export type NavigationBreadcrumbRoute = 
${routes.map(route => `  | '${route}'`).join('\n')};

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrentPage?: boolean;
}

export interface NavigationBreadcrumbData {
  [key: string]: BreadcrumbItem[];
}

export interface NavigationContext {
  tab?: string;
  submenu?: string;
  isExternalLink?: boolean;
}

// Navigation tabs
export type NavigationTab = 'Study' | 'Apply' | 'Student Life' | 'Applied Research' | 'About Us';

// Route count: ${routes.length}
// Last updated: ${new Date().toLocaleString()}
`;
    
    const typesPath = path.join(CONFIG.outputDir, 'navigation-breadcrumb-types.ts');
    await fs.writeFile(typesPath, typeDefinition, 'utf-8');
    
    console.log('📝 TypeScript types generated: navigation-breadcrumb-types.ts');
    
  } catch (error) {
    console.error('❌ Type generation failed:', error);
  }
}

/**
 * Generate route manifest for Next.js
 */
async function generateRouteManifest() {
  try {
    console.log('📋 Generating route manifest...');
    
    const breadcrumbData = JSON.parse(
      await fs.readFile(CONFIG.outputPath, 'utf-8')
    );
    
    const routes = Object.keys(breadcrumbData.static);
    
    // Categorize routes by navigation tab
    const routesByTab = {
      'Study': [],
      'Apply': [],
      'Student Life': [],
      'Applied Research': [],
      'About Us': [],
      'Other': []
    };
    
    routes.forEach(route => {
      const breadcrumb = breadcrumbData.static[route];
      if (breadcrumb && breadcrumb.length > 0) {
        const tabLabel = breadcrumb[0].label;
        if (routesByTab[tabLabel]) {
          routesByTab[tabLabel].push({
            path: `/${route}`,
            breadcrumbCount: breadcrumb.length,
            currentPageLabel: breadcrumb[breadcrumb.length - 1].label
          });
        } else {
          routesByTab['Other'].push({
            path: `/${route}`,
            breadcrumbCount: breadcrumb.length,
            currentPageLabel: breadcrumb[breadcrumb.length - 1].label
          });
        }
      }
    });
    
    const manifest = {
      metadata: {
        generatedAt: new Date().toISOString(),
        totalRoutes: routes.length,
        source: 'navigation-data.json',
        reversedLogic: true
      },
      routesByTab,
      summary: {
        studyRoutes: routesByTab['Study'].length,
        applyRoutes: routesByTab['Apply'].length,
        studentLifeRoutes: routesByTab['Student Life'].length,
        appliedResearchRoutes: routesByTab['Applied Research'].length,
        aboutUsRoutes: routesByTab['About Us'].length,
        otherRoutes: routesByTab['Other'].length
      }
    };
    
    const manifestPath = path.join(CONFIG.outputDir, 'navigation-route-manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
    
    console.log('📋 Route manifest created: navigation-route-manifest.json');
    console.log(`📊 Routes by tab:`);
    Object.entries(manifest.summary).forEach(([tab, count]) => {
      console.log(`   - ${tab}: ${count} routes`);
    });
    
  } catch (error) {
    console.error('❌ Route manifest generation failed:', error);
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  
  switch (command) {
    case 'build':
      await buildNavigationBreadcrumbs();
      break;
    case 'validate':
      await validateBreadcrumbs();
      break;
    case 'types':
      await generateBreadcrumbTypes();
      break;
    case 'manifest':
      await generateRouteManifest();
      break;
    case 'all':
    default:
      await buildNavigationBreadcrumbs();
      await validateBreadcrumbs();
      await generateBreadcrumbTypes();
      await generateRouteManifest();
      break;
  }
}

export { 
  buildNavigationBreadcrumbs, 
  validateBreadcrumbs, 
  generateBreadcrumbTypes,
  generateRouteManifest 
};