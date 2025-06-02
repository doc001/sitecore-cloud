// lib/breadcrumbData.ts
import { BreadcrumbItem } from '@/components/common/Breadcrumb';

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
 * This would typically be stored in a JSON file or fetched from an API
 */
const breadcrumbsData: BreadcrumbMap = {
  // Home page (just for completeness)
  'home': [
    { label: 'Home', isCurrentPage: true }
  ],
  
  // Apply section
  'apply': [
    { label: 'Apply', isCurrentPage: true }
  ],
  
  // Ready to apply page (matching the example in markup)
  'apply/ready-to-apply': [
    { label: 'Apply', href: '/apply' },
    { label: 'I am Ready to Apply', isCurrentPage: true }
  ],
  
  // Other examples
  'programs': [
    { label: 'Programs', isCurrentPage: true }
  ],
  
  'programs/undergraduate': [
    { label: 'Programs', href: '/programs' },
    { label: 'Undergraduate', isCurrentPage: true }
  ],
  
  'programs/undergraduate/business': [
    { label: 'Programs', href: '/programs' },
    { label: 'Undergraduate', href: '/programs/undergraduate' },
    { label: 'Business', isCurrentPage: true }
  ],
};

/**
 * Gets breadcrumb data for a specific path
 * 
 * @param path - The current page path
 * @returns Array of breadcrumb items
 */
export async function getBreadcrumbData(path: string): Promise<BreadcrumbItem[]> {
  // Remove leading/trailing slashes and normalize
  const normalizedPath = path.replace(/^\/|\/$/g, '');
  
  // Return predefined breadcrumbs if they exist
  if (breadcrumbsData[normalizedPath]) {
    return breadcrumbsData[normalizedPath];
  }
  
  // If no predefined breadcrumbs, generate them from the path segments
  const segments = normalizedPath.split('/');
  
  return segments.map((segment, index) => {
    // Create a readable label from the segment
    const label = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    // Build the href for this segment
    const href = index === segments.length - 1 
      ? undefined 
      : `/${segments.slice(0, index + 1).join('/')}`;
    
    // Mark the last segment as the current page
    const isCurrentPage = index === segments.length - 1;
    
    return { label, href, isCurrentPage };
  });
}