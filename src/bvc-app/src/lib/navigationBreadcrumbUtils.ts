// lib/navigationBreadcrumbUtils.ts
import { BreadcrumbItem } from '@/components/common/Breadcrumb';
import breadcrumbsConfig from '@/data/static/navigation-breadcrumbs.json' with { type: 'json' };
import navigationData from '@/data/navigation-data.json' with { type: 'json' };
import programsData from '@/data/cms/Programs.json' with { type: 'json' };

/**
 * Interface for the navigation-based breadcrumb configuration
 */
interface NavigationBreadcrumbConfig {
  static: { [path: string]: BreadcrumbItem[] };
  patterns: {
    [pattern: string]: {
      template: BreadcrumbItem[];
      dataSource: string;
      mapping: { [key: string]: string };
    };
  };
  fallbacks: {
    segments: { [segment: string]: string };
    tabMapping: { [tab: string]: string };
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

/**
 * Type-safe access to breadcrumb and navigation configuration
 */
const config = breadcrumbsConfig as NavigationBreadcrumbConfig;
const navData = navigationData.navigationData.mainMenu;

/**
 * Get breadcrumb data for a specific path using navigation structure
 * 
 * This function uses the navigation-data.json to intelligently map
 * URLs to their proper navigation hierarchy and generate breadcrumbs.
 * 
 * @param path - The current page path
 * @returns Array of breadcrumb items following navigation structure
 */
export async function getBreadcrumbData(path: string): Promise<BreadcrumbItem[]> {
  // Remove leading/trailing slashes and normalize
  const normalizedPath = path.replace(/^\/|\/$/g, '');
  
  // 1. Try exact match from static config first (fastest)
  if (config.static[normalizedPath]) {
    return config.static[normalizedPath];
  }
  
  // 2. Try to find the path in navigation data
  const navBreadcrumbs = findNavigationBreadcrumbs(normalizedPath);
  if (navBreadcrumbs) {
    return navBreadcrumbs;
  }
  
  // 3. Check for dynamic program routes
  if (normalizedPath.startsWith('programs/') || normalizedPath.startsWith('program-areas/')) {
    const programBreadcrumbs = await handleProgramRoutes(normalizedPath);
    if (programBreadcrumbs) {
      return programBreadcrumbs;
    }
  }
  
  // 4. Fall back to pattern-based generation
  return generateFallbackBreadcrumbs(normalizedPath);
}

/**
 * Find breadcrumbs by searching through navigation data
 */
function findNavigationBreadcrumbs(path: string): BreadcrumbItem[] | null {
  const targetUrl = `/${path}`;
  
  // Search through all navigation tabs and submenus
  for (const tab of navData.tabs) {
    for (const submenu of tab.submenus) {
      for (const itemGroup of submenu.items) {
        for (const link of itemGroup.links) {
          if (link.url === targetUrl && !link.isExternal) {
            // Found the link, generate breadcrumb hierarchy
            return generateNavigationBreadcrumb(tab, submenu, link);
          }
        }
      }
    }
  }
  
  return null;
}

/**
 * Generate breadcrumb from navigation hierarchy
 */
function generateNavigationBreadcrumb(
  tab: NavigationTab, 
  submenu: any, 
  link: any
): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [];
  
  // Add tab as first item (no link - following reversed logic)
  breadcrumbs.push({
    label: tab.label
  });
  
  // Add submenu if it's different from the tab and not a direct tab link
  if (submenu.label !== tab.label && !isDirectTabLink(link.url, tab.id)) {
    breadcrumbs.push({
      label: submenu.label,
      href: getSubmenuHref(submenu, tab)
    });
  }
  
  // Add current page (with link - following reversed logic)
  breadcrumbs.push({
    label: link.label,
    href: link.url,
    isCurrentPage: true
  });
  
  return breadcrumbs;
}

/**
 * Check if a URL is a direct tab link (like /apply, /study)
 */
function isDirectTabLink(url: string, tabId: string): boolean {
  const directTabUrls: { [key: string]: string[] } = {
    'study': ['/study'],
    'apply': ['/apply'],
    'student-life': ['/student-life'],
    'applied-research': ['/applied-research'],
    'about-us': ['/about-us']
  };
  
  return directTabUrls[tabId]?.includes(url) || false;
}

/**
 * Generate submenu href based on submenu content
 */
function getSubmenuHref(submenu: any, tab: NavigationTab): string | undefined {
  // For some submenus, we might want to return a category page URL
  // This is contextual based on the site structure
  
  const submenuMappings: { [key: string]: string } = {
    'professional-development': '/study/professional-development-overview',
    'tuition-and-fees': '/study/tuition-and-fees',
    'ready-to-apply': '/apply/ready-to-apply',
    'financial-support': '/apply/financial/overview',
    'student-support': '/student-life/student-services',
    'our-organization': '/about-us/our-organization',
    'news-events': '/about-us/news-and-events'
  };
  
  return submenuMappings[submenu.id];
}

/**
 * Handle program-specific routes with CMS data integration
 */
async function handleProgramRoutes(path: string): Promise<BreadcrumbItem[] | null> {
  const segments = path.split('/');
  
  // Handle individual program pages: programs/[slug]
  if (segments[0] === 'programs' && segments.length === 2) {
    const programSlug = segments[1];
    const program = findProgramBySlug(programSlug);
    
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
    const program = findProgramBySlug(programSlug);
    
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
 * Find program data by slug from CMS
 */
function findProgramBySlug(slug: string) {
  return programsData.find((program: any) => 
    program.Slug === slug && 
    program.Archived === 'false' && 
    program.Draft === 'false'
  );
}

/**
 * Convert URL segment to readable label using fallback mapping
 */
function segmentToLabel(segment: string): string {
  // Check fallback mapping first
  if (config.fallbacks.segments[segment]) {
    return config.fallbacks.segments[segment];
  }
  
  // Default conversion
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Generate breadcrumbs when no static or navigation match is found
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
    'alumni': 'Alumni' // Special case - standalone
  };
  
  return pathToTabMapping[firstSegment] || null;
}

/**
 * Get all available static routes for sitemap generation
 */
export function getAllStaticBreadcrumbRoutes(): string[] {
  return Object.keys(config.static);
}

/**
 * Get breadcrumb data synchronously for build-time generation
 * Only works with static routes - use for SSG page generation
 */
export function getBreadcrumbDataSync(path: string): BreadcrumbItem[] | null {
  const normalizedPath = path.replace(/^\/|\/$/g, '');
  return config.static[normalizedPath] || null;
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
export function getNavigationContext(path: string): {
  tab?: string;
  submenu?: string;
  isExternalLink?: boolean;
} | null {
  const targetUrl = `/${path.replace(/^\/|\/$/g, '')}`;
  
  for (const tab of navData.tabs) {
    for (const submenu of tab.submenus) {
      for (const itemGroup of submenu.items) {
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
  
  return null;
}

/**
 * Development helper to check if a path has static breadcrumbs
 */
export function hasStaticBreadcrumbs(path: string): boolean {
  const normalizedPath = path.replace(/^\/|\/$/g, '');
  return !!config.static[normalizedPath];
}

/**
 * Get navigation-based breadcrumb configuration for debugging
 */
export function getBreadcrumbConfig() {
  return {
    config,
    navigationData: navData
  };
}