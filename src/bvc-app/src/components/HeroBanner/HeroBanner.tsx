// components/HeroBanner/HeroBanner.tsx
import React from 'react';
import styles from '@/styles/_HeroBanner.module.css';

interface HeroBannerProps {
  backgroundImage?: string;
  heading?: string;
  subheading?: string;
  description?: string;
  ctaText?: string;
  ctaLink?: string;
}

/**
 * Responsive Hero Banner Component
 * - Mobile: 90vh height with specific background positioning
 * - Desktop: 590px max height with different background settings
 * - Uses CSS modules for styling and custom CSS variables from globals.css
 * - Conditionally renders elements only if data exists (not blank/empty)
 */
const HeroBanner: React.FC<HeroBannerProps> = ({
  backgroundImage,
  heading,
  subheading,
  description,
  ctaText,
  ctaLink
}) => {
  // Helper function to check if a string is not empty/blank
  const isNotEmpty = (str: string | undefined | null): boolean => {
    return str !== undefined && str !== null && str.trim() !== '';
  };

  // Don't render the component if no background image is provided
  if (!isNotEmpty(backgroundImage)) {
    return null;
  }

  return (
    <div 
      className={styles.heroBanner}
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      {/* Content Container with responsive padding using design system */}
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 sm:mx-[10%] lg:px-8">
        
        {/* Main Heading - Only render if heading exists */}
        {isNotEmpty(heading) && (
          <h2 className="max-w-2xl text-balance text-3xl font-semibold text-white sm:text-5xl">
            {heading}
          </h2>
        )}
        
        {/* Hero Title - Only render if subheading exists */}
        {isNotEmpty(subheading) && (
          <h1 className="leading-20 sm:leading-30 max-w-2xl text-balance text-6xl font-bold text-white sm:text-8xl">
            {subheading}
          </h1>
        )}
        
        {/* Description - Only render if description exists */}
        {isNotEmpty(description) && (
          <h3 className="max-w-xl text-balance text-xl font-semibold text-white sm:text-3xl">
            {description}
          </h3>
        )}
        
        {/* CTA Button - Only render if both ctaText and ctaLink exist */}
        {isNotEmpty(ctaText) && isNotEmpty(ctaLink) && (
          <div className="mt-10 flex items-center gap-x-6">
            <a 
              href={ctaLink}
              className="rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-colors duration-200"
              style={{
                backgroundColor: 'var(--color-blue-100)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--blue--100-tr-80)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-blue-100)';
              }}
            >
              {ctaText}
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroBanner;