// components/ContentSection.tsx
import React, { ReactNode } from 'react';

interface ContentSectionProps {
  children: ReactNode;
  background?: string; // Optional background color class
  className?: string; // Additional classes for customization
}

/**
 * ContentSection component that provides:
 * - Full-width background
 * - Responsive padding for the content inside
 * - 20% padding on desktop (lg screens)
 * - 10% padding on tablets (md screens)
 * - 5% padding on mobile (sm screens and below)
 * 
 * @param children - Content to be rendered with padding
 * @param background - Optional background color class (e.g., "bg-gray-100")
 * @param className - Additional classes for the content container
 */
const ContentSection = ({ 
  children, 
  background = "bg-white", 
  className = "" 
}: ContentSectionProps) => {
  return (
    // Full-width container with the specified background
    <div className={`w-full ${background}`}>
      {/* Content container with responsive padding */}
      <div 
        className={`mx-auto w-full 
          px-[5%] sm:px-[5%] md:px-[8%] lg:px-[10%] 
          ${className}`}
      >
        {children}
      </div>
    </div>
  );
};

export default ContentSection;