// components/PathSelectionSection.tsx
/**
 * PathSelectionSection Component
 * 
 * A responsive section component that displays different path options
 * for users to explore educational programs. The component includes:
 * - A colored divider at the top
 * - A 3x2 grid layout with various content cells
 * - Gradient backgrounds for certain cells
 * - Lists of program options
 * 
 * This component leverages the CSS variables and utility classes defined
 * in globals.css and maintains consistency with other components.
 *
 * @author Your Name
 * @version 1.0.0
 */

import React from 'react';
import Link from 'next/link';
import styles from '@/styles/_PathSelectionSection.module.css';
import Button from '@/components/common/Button';
import { ProgramLink, ButtonVariant } from '@/types';

// Props interface for the component
interface PathSelectionSectionProps {
  /**
   * Optional className for additional styling
   */
  className?: string;
  
  /**
   * Interest-based program links
   */
  interestLinks?: ProgramLink[];
  
  /**
   * Program type links
   */
  programTypeLinks?: ProgramLink[];
  
  /**
   * Application path links
   */
  applicationLinks?: ProgramLink[];
}

const PathSelectionSection: React.FC<PathSelectionSectionProps> = ({
  className = '',
  interestLinks = [
    { title: 'Business', href: '/program-areas/business' },
    { title: 'Entertainment Arts', href: '/program-areas/entertainment-arts' },
    { title: 'Technology', href: '/program-areas/technology' },
    { title: 'Health & Wellness', href: '/program-areas/health-wellness' },
    { title: 'Community Studies', href: '/program-areas/community-studies' },
    { title: 'Academic Upgrading', href: '/program-areas/academic-upgrading' },
  ],
  programTypeLinks = [
    { title: 'Programs, diplomas, post-diplomas and certificates', href: '/program-list' },
    { title: 'Extended education', href: '/study/extended-education' },
  ],
  applicationLinks = [
    { title: 'I am a first year student', href: '/apply/i-am-ready/i-am-a-first-year-student' },
    { title: 'I need academic upgrading', href: '/apply/i-am-ready/i-need-academic-upgrading' },
    { title: 'I want professional development', href: '/study/professional-development' },
    { title: 'I am an international student', href: '/apply/i-am-ready/i-am-an-international-student' },
    { title: 'I want to learn or improve my English', href: '/apply/i-am-ready/english-language-skills' },
    { title: 'I am a transfer student', href: '/apply/i-am-ready/i-am-a-transfer-student' },
  ],
}) => {
  return (
    <section className={`${styles['c-box-neutral10']} ${className}`}>
      {/* Colored divider at the top */}
      <div className={`${styles['c-divider__all-colors']} bg-divider-all-colors`}></div>
      
      {/* 3x2 Grid Layout */}
      <div className="mx-auto w-full max-w-screen-3xl py-10 px-[5%] sm:px-[5%] md:px-[8%] lg:px-[10%] 2xl:px-[10%] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        
        {/* Cell 1: Introduction */}
        <div className="flex flex-col justify-start">
          <h3 className="gradient-text-purple text-5xl md:text-5xl leading-[120%] font-medium mb-4">
            Select your<br />path
          </h3>
          <p className="text-base text-neutral-70 mb-6">
            We make applying to the program of your choice easy.
            <br /><br />
            Starting college is an exciting journey filled with new opportunities and discoveries.
            <br /><br />
            It's a time to explore, grow, and shape your future. We'll be with you every step of the way—from choosing the right courses to celebrating your successes.
          </p>
          <div className="mt-auto">
            <Link href="#" className="inline-flex items-center text-blue-100 hover:text-purple-100 transition-colors duration-300">
              <p>Explore <span className="material-icon align-middle ml-1">arrow_right_alt</span></p>
            </Link>
          </div>
        </div>
        
        {/* Cell 2: By Interest */}
        <div className={`${styles['box-gradient-bp']} rounded-lg overflow-hidden`}>
          <div className={`${styles['box-white-select-your-path']} bg-white rounded-lg`}>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2 text-neutral-70">By interest</h3>
              <p className="text-base mb-4 text-neutral-60">Tailor your education to your passions</p>
              <ul className="space-y-2">
                {interestLinks.map((link, index) => (
                  <li key={index} className="list-none">
                    <Link 
                      href={link.href} 
                      className="text-blue-100 hover:text-purple-100 transition-colors duration-300"
                    >
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        
        {/* Cell 3: Program Type */}
        <div className={`${styles['box-gradient-bp']} rounded-lg overflow-hidden`}>
          <div className={`${styles['box-white-select-your-path']} bg-white rounded-lg`}>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2 text-neutral-70">Program type</h3>
              <p className="text-base mb-4 text-neutral-60">Select the program type that suits your learning style.</p>
              <ul className="space-y-2">
                {programTypeLinks.map((link, index) => (
                  <li key={index} className="list-none">
                    <Link 
                      href={link.href} 
                      className="text-blue-100 hover:text-purple-100 transition-colors duration-300"
                    >
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        
        {/* Cell 4: Empty cell for layout */}
        <div className="hidden lg:block"></div>
        
        {/* Cell 5: Ready to Apply */}
        <div className={`${styles['box-gradient-bp']} rounded-lg overflow-hidden`}>
          <div className={`${styles['box-white-select-your-path']} bg-white rounded-lg`}>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2 text-neutral-70">Ready to apply?</h3>
              <p className="text-base mb-4 text-neutral-60">Follow the steps for your specific profile.</p>
              <ul className="space-y-2">
                {applicationLinks.map((link, index) => (
                  <li key={index} className="list-none">
                    <Link 
                      href={link.href} 
                      className="text-blue-100 hover:text-purple-100 transition-colors duration-300"
                    >
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        
        {/* Cell 6: Don't know where to start */}
        <div className="flex flex-col justify-center items-start p-6 bg-neutral-5 rounded-lg">
          <h4 className={`${styles['c-box-n10__stack-h4']} text-2xl font-semibold mb-2 text-neutral-80`}>
            Don't know where <br />to start?
          </h4>
          <h5 className={`${styles['c-box-n10__stack-h5']} text-xl mb-6 text-neutral-70`}>
            We can help you.
          </h5>
          <Button 
            href="#" 
            variant={ButtonVariant.GRADIENT_BLUE_PURPLE}
            iconBefore="add"
          >
            Connect with us
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PathSelectionSection;