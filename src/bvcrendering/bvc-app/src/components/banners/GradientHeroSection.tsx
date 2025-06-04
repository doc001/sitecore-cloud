// components/GradientHeroSection.tsx
/**
 * GradientHeroSection Component
 * 
 * A hero section component with gradient styling that displays a custom heading
 * with part of the text emphasized using a gradient span. This component follows
 * the markup provided: 
 * <section class="c-gradient-nbp is-25">
 *   <h2 class="c-blue-gradient__h2">
 *     Our programs <br>
 *     <span class="text-span">empower you for your career journey</span> 
 *     and a lifetime of continuous learning and growth.
 *   </h2>
 * </section>
 * 
 * And leverages the CSS variables and utility classes from the globals.css file.
 *
 * @author Your Name
 * @version 1.0.0
 */
'use client';

import React from 'react';
import styles from '@/styles/_GradientHeroSection.module.css';

interface GradientHeroSectionProps {
  /**
   * Optional className for additional styling
   */
  className?: string;
  
  /**
   * Text before the emphasized span
   */
  textBefore?: string;
  
  /**
   * Text to be emphasized with gradient styling
   */
  emphasizedText?: string;
  
  /**
   * Text after the emphasized span
   */
  textAfter?: string;
  
  /**
   * Whether to animate the gradient background
   */
  animated?: boolean;
}

const GradientHeroSection: React.FC<GradientHeroSectionProps> = ({
  className = '',
  textBefore = 'Our programs',
  emphasizedText = 'empower you for your career journey',
  textAfter = 'and a lifetime of continuous learning and growth.',
  animated = false,
}) => {
  // Combine gradient classes with optional animation
  const gradientClasses = `${styles['c-gradient-nbp']} ${styles['is-25']} ${animated ? styles['animated-gradient'] : ''}`;
  
  return (
    <section className={`${gradientClasses} ${className}`}>
      {/* Optional overlay for better text readability */}
      <div className={styles['gradient-overlay']}></div>
      
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <h2 className={`${styles['c-blue-gradient__h2']} text-3xl md:text-xl lg:text-3xl font-semibold max-w-4xl mx-auto`}>
          {textBefore} <br />
          <span className="text-span gradient-text-blue">
            {emphasizedText}
          </span> {textAfter}
        </h2>
      </div>
    </section>
  );
};

export default GradientHeroSection;