'use client';

import React from 'react';
import styles from "@/styles/_GradientHeroSection.module.css"

interface GenericHeroProps {
  title?: string;
  subtitle?: string;
  description?: string;
  className?: string;
}

/**
 * GenericHero component
 * 
 * A call-to-action component that displays a prominent message encouraging users to apply
 * Uses CSS variables from globals.css for consistent styling across the application
 * 
 * @param title - The main title (defaults to "I am ready")
 * @param subtitle - The subtitle displayed below the title (defaults to "to apply.")
 * @param description - The descriptive text (defaults to "You're ready to make this happen...")
 * @param className - Additional CSS classes for customization
 */
const GenericHero: React.FC<GenericHeroProps> = ({
  title = "I am ready",
  subtitle = "to apply.",
  description = "You're ready to make this happen. Let's take the first step together.",
  className = '',
}) => {
  return (
    <div className={`${styles['c-gradient-nbp']} ${styles['is-75']}`}>
      <div className="container-layout grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Left column with main heading */}
        <div 
          className="opacity-100 transform transition-all duration-500 ease-in-out"
          style={{ 
            transform: 'translate3d(0px, 0px, 0px) scale3d(1, 1, 1) rotateX(0deg) rotateY(0deg) rotateZ(0deg) skew(0deg, 0deg)',
            transformStyle: 'preserve-3d' 
          }}
        >
          <div className="mb-8">
            {/* xxl white-font class equivalent */}
            <h2 className="text-5xl font-bold text-[color:var(--color-white)] mb-2">
              {title}
            </h2>
            {/* xxxl white-font class equivalent */}
            <h1 className="text-7xl font-bold text-[color:var(--color-white)]">
              {subtitle}
            </h1>
          </div>
        </div>

        {/* Right column with description */}
        <div>
          {/* c-hero-__general-h2 class equivalent */}
          <h2 className="text-2xl md:text-3xl font-medium text-[color:var(--color-white)]">
            {description}
          </h2>
        </div>
      </div>
    </div>
  );
};

export default GenericHero;