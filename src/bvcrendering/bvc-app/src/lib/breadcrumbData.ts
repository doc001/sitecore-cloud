// lib/breadcrumbData.ts
import { BreadcrumbItem } from '@/components/common/Breadcrumb';
import { PROFILE_INFO_MAP, ApplicantProfileType } from '@/types/index';

/**
 * Breadcrumb mapping type
 * - Keys represent page routes
 * - Values are arrays of breadcrumb items for that route
 */
interface BreadcrumbMap {
  [key: string]: BreadcrumbItem[];
}

/**
 * Map of predefined breadcrumb data for common routes
 * REVERSED LOGIC: Current page (last item) HAS a link, first item after home has NO link
 */
const breadcrumbsData: BreadcrumbMap = {
  // Home page
  'home': [
    { label: 'Home', href: '/', isCurrentPage: true }
  ],
  
  // Apply section
  'apply': [
    { label: 'Apply', href: '/apply', isCurrentPage: true }
  ],
  
  // Ready to apply page
  'apply/ready-to-apply': [
    { label: 'Apply' }, // First item after home - NO link
    { label: 'I am Ready to Apply', href: '/apply/ready-to-apply', isCurrentPage: true }
  ],

  // I am ready section
  'apply/i-am-ready': [
    { label: 'Apply' }, // First item after home - NO link
    { label: 'I am Ready to Apply', href: '/apply/ready-to-apply'},
    { label: 'Choose Your Profile', href: '/apply/i-am-ready', isCurrentPage: true }
  ],

  // I am first year student
  'apply/i-am-ready/i-am-a-first-year-student': [
    { label: 'Apply' }, // No link
    { label: 'I Am Ready', href: '/apply/i-am-ready' },
    { label: 'First-Year Student Application', href: '/apply/i-am-ready/i-am-a-first-year-student', isCurrentPage: true }
  ],
  
  // Programs section
  'programs': [
    { label: 'Programs', href: '/programs', isCurrentPage: true }
  ],
  
  'programs/undergraduate': [
    { label: 'Programs' }, // First item after home - NO link
    { label: 'Undergraduate', href: '/programs/undergraduate', isCurrentPage: true }
  ],
  
  'programs/undergraduate/business': [
    { label: 'Programs' }, // First item after home - NO link
    { label: 'Undergraduate', href: '/programs/undergraduate' },
    { label: 'Business', href: '/programs/undergraduate/business', isCurrentPage: true }
  ],
};

/**
 * Helper function to check if a path segment is an applicant profile type
 */
function isApplicantProfileType(segment: string): segment is ApplicantProfileType {
  return segment in PROFILE_INFO_MAP;
}

/**
 * Helper function to get profile title from PROFILE_INFO_MAP
 */
function getProfileTitle(profileType: ApplicantProfileType): string {
  return PROFILE_INFO_MAP[profileType].title;
}

/**
 * Helper function to convert URL segment to readable label
 */
function segmentToLabel(segment: string): string {
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Gets breadcrumb data for a specific path
 * 
 * @param path - The current page path
 * @returns Array of breadcrumb items with reversed logic applied
 */
export async function getBreadcrumbData(path: string): Promise<BreadcrumbItem[]> {
  // Remove leading/trailing slashes and normalize
  const normalizedPath = path.replace(/^\/|\/$/g, '');
  
  // Return predefined breadcrumbs if they exist
  if (breadcrumbsData[normalizedPath]) {
    return breadcrumbsData[normalizedPath];
  }
  
  // Handle dynamic routes with profile types
  const segments = normalizedPath.split('/');
  
  // Special handling for apply routes with profile types
  if (segments[0] === 'apply' && segments.length >= 3) {
    const lastSegment = segments[segments.length - 1];
    
    // Check if the last segment is a profile type
    if (isApplicantProfileType(lastSegment)) {
      return generateApplyProfileBreadcrumbs(segments, lastSegment);
    }
  }
  
  // Default generation for other paths
  return generateDefaultBreadcrumbs(segments);
}

/**
 * Generate breadcrumbs specifically for apply profile routes
 */
function generateApplyProfileBreadcrumbs(segments: string[], profileType: ApplicantProfileType): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [];
  
  segments.forEach((segment, index) => {
    const isFirstItem = index === 0;
    const isLastItem = index === segments.length - 1;
    
    let label: string;
    let href: string | undefined;
    
    // Generate appropriate label
    if (isLastItem && isApplicantProfileType(segment)) {
      // Use profile title from PROFILE_INFO_MAP for the current page
      label = getProfileTitle(profileType);
    } else {
      // Use standard conversion for other segments
      label = segmentToLabel(segment);
    }
    
    // Apply reversed logic for href
    if (isFirstItem && segments.length > 1) {
      // First item after home - NO link
      href = undefined;
    } else {
      // All other items including current page - HAVE links
      href = `/${segments.slice(0, index + 1).join('/')}`;
    }
    
    breadcrumbs.push({
      label,
      href,
      isCurrentPage: isLastItem
    });
  });
  
  return breadcrumbs;
}

/**
 * Generate default breadcrumbs for non-profile routes
 */
function generateDefaultBreadcrumbs(segments: string[]): BreadcrumbItem[] {
  return segments.map((segment, index) => {
    const label = segmentToLabel(segment);
    const isFirstItem = index === 0;
    const isLastItem = index === segments.length - 1;
    
    // REVERSED LOGIC for auto-generated breadcrumbs:
    if (isFirstItem && segments.length > 1) {
      // First item after home - NO link, NO href
      return { 
        label, 
        isCurrentPage: false 
      };
    } else {
      // All other items including current page - HAVE links
      const href = `/${segments.slice(0, index + 1).join('/')}`;
      const isCurrentPage = isLastItem;
      
      return { 
        label, 
        href, 
        isCurrentPage 
      };
    }
  });
}

/**
 * Helper function to validate breadcrumb data structure
 */
export function validateBreadcrumbStructure(items: BreadcrumbItem[]): boolean {
  if (items.length === 0) return false;
  
  const hasMultipleItems = items.length > 1;
  const firstItem = items[0];
  const lastItem = items[items.length - 1];
  
  if (hasMultipleItems) {
    // First item should not have href
    if (firstItem.href) {
      console.warn('Breadcrumb validation: First item should not have href in reversed logic');
      return false;
    }
  }
  
  // Last item should have href
  if (!lastItem.href) {
    console.warn('Breadcrumb validation: Last item should have href in reversed logic');
    return false;
  }
  
  // Last item should be marked as current page
  if (!lastItem.isCurrentPage) {
    console.warn('Breadcrumb validation: Last item should be marked as current page');
    return false;
  }
  
  return true;
}

/**
 * Example usage and expected outputs:
 * 
 * Path: '/apply/i-am-ready/i-am-a-first-year-student'
 * Output: [
 *   { label: 'Apply' }, // No link
 *   { label: 'I Am Ready', href: '/apply/i-am-ready' },
 *   { label: 'First-Year Student Application', href: '/apply/i-am-ready/i-am-a-first-year-student', isCurrentPage: true }
 * ]
 * 
 * Path: '/apply/i-am-ready/i-am-an-international-student'
 * Output: [
 *   { label: 'Apply' }, // No link
 *   { label: 'I Am Ready', href: '/apply/i-am-ready' },
 *   { label: 'International Student Application', href: '/apply/i-am-ready/i-am-an-international-student', isCurrentPage: true }
 * ]
 */