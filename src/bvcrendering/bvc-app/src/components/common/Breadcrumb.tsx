// components/Breadcrumb/Breadcrumb.tsx
import React from 'react';
import Link from 'next/link';
import styles from '@/styles/Breadcrumb.module.css';

/**
 * Interface for a breadcrumb item
 * @param label - The text to display for the breadcrumb
 * @param href - The URL the breadcrumb should link to (optional for current page)
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
 * @param variant - Visual style variant of the breadcrumb (default is "general")
 * @param showHomeIcon - Whether to show the home icon at the start (defaults to true)
 */
interface BreadcrumbProps {
  items: BreadcrumbItem[];
  variant?: 'general' | 'program' | 'ecommerce' | 'open-studies';
  showHomeIcon?: boolean;
}

/**
 * Breadcrumb component for navigation hierarchy
 * 
 * Displays a trail of links showing the navigation path from home to current page
 * - Always shows a "Home" link at the beginning if showHomeIcon is true
 * - Uses ">" as a separator between items
 * - Current page is shown without a link
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
                home
              </Link>
              <div className={styles.breadcrumbSeparator}>&gt;</div>
            </>
          )}

          {/* Map through breadcrumb items */}
          {breadcrumbItems.map((item, index) => {
            const isLast = index === breadcrumbItems.length - 1;
            
            // Render differently based on whether item is current page or a link
            return (
              <React.Fragment key={`${item.label}-${index}`}>
                {/* If it's the current page or explicitly marked as current, don't make it a link */}
                {(isLast || item.isCurrentPage) ? (
                  <div className={styles.breadcrumbNoLink}>
                    {item.label}
                  </div>
                ) : (
                  /* Otherwise it's a clickable link */
                  <Link href={item.href || '#'} className={styles.breadcrumbLink}>
                    {item.label}
                  </Link>
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