// components/Breadcrumb/Breadcrumb.tsx
import React from 'react';
import Link from 'next/link';
import styles from '@/styles/Breadcrumb.module.css';

/**
 * Interface for a breadcrumb item
 * @param label - The text to display for the breadcrumb
 * @param href - The URL the breadcrumb should link to (optional for non-clickable items)
 * @param isCurrentPage - Whether this breadcrumb represents the current page
 */
export interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrentPage?: boolean;
}

/**
 * Props for the Breadcrumb component
 * @param items - Array of breadcrumb items to display
 * @param variant - Visual style variant of the breadcrumb
 * @param showHomeIcon - Whether to show the home icon at the start
 */
interface BreadcrumbProps {
  items: BreadcrumbItem[];
  variant?: 'general' | 'program' | 'ecommerce' | 'open-studies';
  showHomeIcon?: boolean;
}

/**
 * Enhanced Breadcrumb component for navigation hierarchy - App Router Compatible
 * 
 * REVERSED LOGIC:
 * - Home icon: Always a link
 * - First item in array: NOT a link (just text)
 * - Middle items: Links
 * - Last item (current page): IS a link
 * 
 * DYNAMIC ROUTE SUPPORT:
 * - Integrates with profile types from types/index.ts
 * - Uses actual profile titles instead of URL segments
 * - Maintains proper href links for all clickable items
 * 
 * SSG COMPATIBLE:
 * - Server Component by default in App Router
 * - Renders at build time for static generation
 */
const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  variant = 'program',
  showHomeIcon = true,
}) => {
  // Ensure we always have at least one item
  const breadcrumbItems = items.length > 0 ? items : [{ label: 'Home', href: '/' }];
  
  return (
    <div className={`${styles.breadcrumbsBackground} h-20 flex`}>
      <div className={`${styles.containerWidth} align-middle`}>
        <div className={styles.breadcrumbWrapper}>
          {/* Home icon link, shown conditionally */}
          {showHomeIcon && (
            <>
              <Link href="/" className={styles.breadcrumbIcon}>
                <span className="material-icon">home</span>
              </Link>
              <div className={styles.breadcrumbSeparator}>&gt;</div>
            </>
          )}
          
          {/* Map through breadcrumb items */}
          {breadcrumbItems.map((item, index) => {
            const isLast = index === breadcrumbItems.length - 1;
            const isFirst = index === 0;
            const totalItems = breadcrumbItems.length;
            
            // REVERSED LOGIC: Determine if this item should be a link or not
            let shouldBeLink = true;
            
            // Rule: If it's the first item AND there are multiple items, it should NOT be a link
            if (isFirst && totalItems > 1) {
              shouldBeLink = false;
            }
            
            return (
              <React.Fragment key={`${item.label}-${index}`}>
                {shouldBeLink && item.href ? (
                  /* Render as link - only if it should be a link AND has href */
                  <Link href={item.href} className={styles.breadcrumbLink}>
                    {item.label}
                  </Link>
                ) : (
                  /* Render as plain text - for first item or items without href */
                  <div className={styles.breadcrumbNoLink}>
                    {item.label}
                  </div>
                )}
                
                {/* Add separator if not the last item */}
                {!isLast && (
                  <div className={styles.breadcrumbSeparator}>&gt;</div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Breadcrumb;