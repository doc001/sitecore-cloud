'use client';

import React from 'react';
import styles from '@/styles/_GradientHeroSection.module.css';

interface HeroBannerSectionProps {
  className?: string;
  subtitle?: string;
  title?: string;
  containerClassName?: string;
  contentData?: {
    subtitle?: string;
    title?: string;
  };
}

/**
 * HeroBannerSection component for displaying a hero section with a gradient background
 * 
 * This component uses Tailwind CSS classes and provides a responsive hero section
 * with configurable content via props or JSON data provided in contentData.
 * 
 * @param className - Additional CSS classes for the hero component
 * @param subtitle - The subtitle displayed above the main title (fallback if not in contentData)
 * @param title - The main title displayed in the hero section (fallback if not in contentData)
 * @param height - Height of the hero section (40vh, 60vh, 80vh, or 100vh)
 * @param containerClassName - Additional CSS classes for the container element
 * @param contentData - JSON data containing subtitle and title text
 */
const HeroBannerSection: React.FC<HeroBannerSectionProps> = ({
  className = '',
  subtitle = 'How to apply',
  title = 'I am a first-year student.',
  containerClassName = '',
  contentData,
}) => {
  // Use contentData values if provided, otherwise fall back to props
  const displaySubtitle = contentData?.subtitle || subtitle;
  const displayTitle = contentData?.title || title;
  
  // Define gradient styles for c-gradient-nbp
  // This assumes we need to create a custom class for the navy-blue-purple gradient
  // based on your globals.css which has various gradient utilities
  const gradientStyle = {
    backgroundImage: 'linear-gradient(220deg, var(--color-blue-100), var(--color-purple-100) 50%, var(--color-navy-100))',
  };
  
  return (
    <section 
      className={`${styles['c-gradient-nbp']} ${styles['is-75']}`}
    >
      <div className={`w-full max-w-7xl mx-auto px-6 md:px-8 lg:px-10 py-12 md:py-16 ${containerClassName}`}>
        {displaySubtitle && (
          <div className="text-white text-lg md:text-xl mb-3 font-medium">{displaySubtitle}</div>
        )}
        {displayTitle && (
          <h1 className="text-white text-3xl md:text-5xl font-bold">{displayTitle}</h1>
        )}
      </div>
    </section>
  );
};

export default HeroBannerSection;