// lib/navigationBreadcrumbUtils.ts
import { BreadcrumbItem } from '@/components/common/Breadcrumb';

/**
 * Interface for the navigation-based breadcrumb configuration
 */
interface NavigationBreadcrumbConfig {
  static: { [path: string]: BreadcrumbItem[] };
  metadata?: {
    generatedAt?: string;
    version?: string;
    source?: string;
    totalRoutes?: number;
  };
}

/**
 * Interface for navigation data structure
 */
interface NavigationTab {
  id: string;
  label: string;
  submenus: Array<{
    id: string;
    label: string;
    items: Array<{
      title: string;
      links: Array<{
        label: string;
        url: string;
        isExternal: boolean;
      }>;
    }>;
  }>;
}

// Cache for loaded data
let breadcrumbsConfig: NavigationBreadcrumbConfig | null = null;
let navigationData: any = null;
let programsData: any[] = [];

/**
 * Load configuration data with error handling
 */
async function loadConfigData() {
  if (breadcrumbsConfig && navigationData) {
    return { breadcrumbsConfig, navigationData, programsData };
  }

  try {
    // Try to load breadcrumbs config
    try {
      const breadcrumbsModule = await import('@/data/static/navigation-breadcrumbs.json');
      breadcrumbsConfig = breadcrumbsModule.default || breadcrumbsModule;
    } catch (error) {
      console.warn('Could not load navigation-breadcrumbs.json, using fallback');
      breadcrumbsConfig = {
        static: {
          'home': [{ label: 'Home', href: '/', isCurrentPage: true }]
        }
      };
    }

    // Try to load navigation data
    try {
      const navModule = await import('@/data/navigation-data.json');
      navigationData = navModule.default || navModule;
    } catch (error) {
      console.warn('Could not load navigation-data.json');
      navigationData = { navigationData: { mainMenu: { tabs: [] } } };
    }

    // Try to load programs data
    try {
      const programsModule = await import('@/data/cms/programs.json');
      programsData = programsModule.default || programsModule;
      if (!Array.isArray(programsData)) {
        programsData = [];
      }
    } catch (error) {
      console.warn('Could not load Programs.json');
      programsData = [];
    }

  } catch (error) {
    console.error('Error loading configuration data:', error);
    breadcrumbsConfig = { static: {} };
    navigationData = { navigationData: { mainMenu: { tabs: [] } } };
    programsData = [];
  }

  return { breadcrumbsConfig, navigationData, programsData };
}

/**
 * Get breadcrumb data for a specific path using navigation structure
 * 
 * @param path - The current page path
 * @returns Array of breadcrumb items following navigation structure
 */
export async function getBreadcrumbData(path: string): Promise<BreadcrumbItem[]> {
  const { breadcrumbsConfig: config } = await loadConfigData();
  
  // Remove leading/trailing slashes and normalize
  const normalizedPath = path.replace(/^\/|\/$/g, '');
  
  // 1. Try exact match from static config first (fastest)
  if (config?.static?.[normalizedPath]) {
    return config.static[normalizedPath];
  }
  
  // 2. Check for dynamic program routes
  if (normalizedPath.startsWith('programs/') || normalizedPath.startsWith('program-areas/')) {
    const programBreadcrumbs = await handleProgramRoutes(normalizedPath);
    if (programBreadcrumbs) {
      return programBreadcrumbs;
    }
  }
  
  // 3. Fall back to pattern-based generation
  return generateFallbackBreadcrumbs(normalizedPath);
}

/**
 * Handle program-specific routes with CMS data integration
 */
async function handleProgramRoutes(path: string): Promise<BreadcrumbItem[] | null> {
  const { programsData } = await loadConfigData();
  const segments = path.split('/');
  
  // Handle individual program pages: programs/[slug]
  if (segments[0] === 'programs' && segments.length === 2) {
    const programSlug = segments[1];
    const program = findProgramBySlug(programSlug, programsData);
    
    if (program) {
      return [
        { label: 'Study' }, // Tab - no link
        { 
          label: program.Name, 
          href: `/programs/${program.Slug}`, 
          isCurrentPage: true 
        }
      ];
    }
  }
  
  // Handle program area pages: program-areas/[area]/[slug]
  if (segments[0] === 'program-areas' && segments.length === 3) {
    const [, areaSlug, programSlug] = segments;
    const program = findProgramBySlug(programSlug, programsData);
    
    if (program) {
      const areaLabel = getAreaLabel(areaSlug);
      
      return [
        { label: 'Study' }, // Tab - no link
        { label: areaLabel, href: `/program-areas/${areaSlug}` },
        { 
          label: program.Name, 
          href: `/program-areas/${areaSlug}/${program.Slug}`, 
          isCurrentPage: true 
        }
      ];
    }
  }
  
  // Handle program area category pages: program-areas/[area]
  if (segments[0] === 'program-areas' && segments.length === 2) {
    const areaSlug = segments[1];
    const areaLabel = getAreaLabel(areaSlug);
    
    return [
      { label: 'Study' }, // Tab - no link
      { 
        label: areaLabel, 
        href: `/program-areas/${areaSlug}`, 
        isCurrentPage: true 
      }
    ];
  }
  
  return null;
}

/**
 * Find program data by slug from CMS
 */
function findProgramBySlug(slug: string, programs: any[]) {
  if (!Array.isArray(programs)) return null;
  
  return programs.find((program: any) => 
    program?.Slug === slug && 
    program?.Archived === 'false' && 
    program?.Draft === 'false'
  );
}

/**
 * Get human-readable label for program area
 */
function getAreaLabel(areaSlug: string): string {
  const areaMapping: { [key: string]: string } = {
    'business': 'Business',
    'entertainment-arts': 'Entertainment Arts',
    'technology': 'Technology',
    'health-wellness': 'Health & Wellness',
    'community-studies': 'Community Studies',
    'academic-upgrading': 'Academic Upgrading'
  };
  
  return areaMapping[areaSlug] || segmentToLabel(areaSlug);
}

/**
 * Convert URL segment to readable label
 */
function segmentToLabel(segment: string): string {
  const specialCases: { [key: string]: string } = {
    'program-list': 'Find a Program',
    'health-wellness': 'Health & Wellness',
    'entertainment-arts': 'Entertainment Arts',
    'community-studies': 'Community Studies',
    'academic-upgrading': 'Academic Upgrading',
    'university-transfer': 'University Transfer',
    'open-studies': 'Open Studies',
    'student-life': 'Student Life',
    'applied-research': 'Applied Research',
    'about-us': 'About Us'
  };
  
  if (specialCases[segment]) {
    return specialCases[segment];
  }
  
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Generate breadcrumbs when no static match is found
 */
function generateFallbackBreadcrumbs(path: string): BreadcrumbItem[] {
  if (!path) {
    return [{ label: 'Home', href: '/', isCurrentPage: true }];
  }
  
  const segments = path.split('/');
  
  // Try to determine which tab this path belongs to
  const tabLabel = determineTabFromPath(segments[0]);
  
  if (tabLabel) {
    // Generate breadcrumbs with tab as first item
    const breadcrumbs: BreadcrumbItem[] = [
      { label: tabLabel } // Tab - no link
    ];
    
    // Add remaining segments
    segments.forEach((segment, index) => {
      if (index === 0) return; // Skip first segment as it's covered by tab
      
      const isLastItem = index === segments.length - 1;
      const label = segmentToLabel(segment);
      const href = `/${segments.slice(0, index + 1).join('/')}`;
      
      breadcrumbs.push({
        label,
        href,
        isCurrentPage: isLastItem
      });
    });
    
    return breadcrumbs;
  }
  
  // Default fallback without tab context
  return segments.map((segment, index) => {
    const isFirstItem = index === 0;
    const isLastItem = index === segments.length - 1;
    const label = segmentToLabel(segment);
    
    // Apply reversed logic for auto-generated breadcrumbs
    if (isFirstItem && segments.length > 1) {
      // First item after home - NO link
      return { label, isCurrentPage: false };
    } else {
      // All other items including current page - HAVE links
      const href = `/${segments.slice(0, index + 1).join('/')}`;
      return { label, href, isCurrentPage: isLastItem };
    }
  });
}

/**
 * Determine which navigation tab a path belongs to
 */
function determineTabFromPath(firstSegment: string): string | null {
  const pathToTabMapping: { [key: string]: string } = {
    'study': 'Study',
    'programs': 'Study',
    'program-areas': 'Study',
    'program-list': 'Study',
    'apply': 'Apply',
    'student-life': 'Student Life',
    'applied-research': 'Applied Research',
    'about-us': 'About Us',
    'schools': 'About Us',
    'alumni': 'Alumni'
  };
  
  return pathToTabMapping[firstSegment] || null;
}

/**
 * Get all available static routes for sitemap generation
 */
export async function getAllStaticBreadcrumbRoutes(): Promise<string[]> {
  const { breadcrumbsConfig: config } = await loadConfigData();
  return Object.keys(config?.static || {});
}

/**
 * Get breadcrumb data synchronously for build-time generation
 * Only works with static routes - use for SSG page generation
 */
export function getBreadcrumbDataSync(path: string): BreadcrumbItem[] | null {
  // This function cannot work with async imports
  // Return null to indicate async loading is needed
  return null;
}

/**
 * Generate breadcrumbs for search results with navigation context
 */
export function generateSearchBreadcrumbs(
  searchParams: {
    search?: string;
    type?: string;
    school?: string;
    area?: string;
  },
  basePath: string = 'program-list'
): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Study' }, // Tab - no link
  ];
  
  // Add base page
  if (basePath === 'program-list') {
    breadcrumbs.push({
      label: 'Find a Program',
      href: '/program-list'
    });
  }
  
  // Add filter-specific breadcrumbs
  if (searchParams.area) {
    const areaLabel = getAreaLabel(searchParams.area);
    breadcrumbs.push({
      label: areaLabel,
      href: `/program-areas/${searchParams.area}`
    });
  }
  
  if (searchParams.type) {
    const typeHref = new URLSearchParams(
      Object.fromEntries(Object.entries(searchParams).filter(([_, v]) => v))
    ).toString();
    
    breadcrumbs.push({
      label: searchParams.type,
      href: `/${basePath}?${typeHref}`
    });
  }
  
  if (searchParams.search) {
    const searchHref = new URLSearchParams(
      Object.fromEntries(Object.entries(searchParams).filter(([_, v]) => v))
    ).toString();
    
    breadcrumbs.push({
      label: `Search: "${searchParams.search}"`,
      href: `/${basePath}?${searchHref}`,
      isCurrentPage: true
    });
  } else {
    // Make the last item current page
    if (breadcrumbs.length > 1) {
      breadcrumbs[breadcrumbs.length - 1].isCurrentPage = true;
    }
  }
  
  return breadcrumbs;
}

/**
 * Validate breadcrumb structure for development
 */
export function validateBreadcrumbStructure(items: BreadcrumbItem[]): boolean {
  if (items.length === 0) return false;
  
  const hasMultipleItems = items.length > 1;
  const firstItem = items[0];
  const lastItem = items[items.length - 1];
  
  if (hasMultipleItems) {
    // First item should not have href (tab level)
    if (firstItem.href) {
      console.warn('Breadcrumb validation: First item (tab) should not have href');
      return false;
    }
  }
  
  // Last item should have href and be current page
  if (!lastItem.href) {
    console.warn('Breadcrumb validation: Last item should have href');
    return false;
  }
  
  if (!lastItem.isCurrentPage) {
    console.warn('Breadcrumb validation: Last item should be marked as current page');
    return false;
  }
  
  return true;
}

/**
 * Get navigation context for a given path
 */
export async function getNavigationContext(path: string): Promise<{
  tab?: string;
  submenu?: string;
  isExternalLink?: boolean;
} | null> {
  const { navigationData } = await loadConfigData();
  
  if (!navigationData?.navigationData?.mainMenu?.tabs) {
    return null;
  }
  
  const targetUrl = `/${path.replace(/^\/|\/$/g, '')}`;
  
  for (const tab of navigationData.navigationData.mainMenu.tabs) {
    if (tab.submenus) {
      for (const submenu of tab.submenus) {
        if (submenu.items) {
          for (const itemGroup of submenu.items) {
            if (itemGroup.links) {
              for (const link of itemGroup.links) {
                if (link.url === targetUrl) {
                  return {
                    tab: tab.label,
                    submenu: submenu.label,
                    isExternalLink: link.isExternal
                  };
                }
              }
            }
          }
        }
      }
    }
  }
  
  return null;
}

/**
 * Development helper to check if a path has static breadcrumbs
 */
export async function hasStaticBreadcrumbs(path: string): Promise<boolean> {
  const { breadcrumbsConfig: config } = await loadConfigData();
  const normalizedPath = path.replace(/^\/|\/$/g, '');
  return !!(config?.static?.[normalizedPath]);
}

/**
 * Get navigation-based breadcrumb configuration for debugging
 */
export async function getBreadcrumbConfig() {
  const { breadcrumbsConfig: config, navigationData } = await loadConfigData();
  return {
    config,
    navigationData
  };
}