// components/HeroHomeSection.tsx
/**
 * HeroHomeSection Component
 * 
 * A bold hero section for the homepage featuring large text callouts
 * and a call-to-action button.
 * 
 * This component uses CSS variables and utility classes from globals.css,
 * adheres to the original markup structure, and integrates with other
 * components created for this project.
 * 
 * Features:
 * - Optional background image or video (local or YouTube)
 * - Text animations
 * - Responsive design
 * - Integration with Button component
 * 
 * @author Your Name
 * @version 1.0.0
 */

import React from 'react';
import styles from '@/styles/_HeroHomeSection.module.css';
import Button from '@/components/common/Button';
import { ButtonVariant } from '@/types';

interface HeroHomeSectionProps {
  /**
   * Optional className for additional styling
   */
  className?: string;
  
  /**
   * Main headline part 1
   */
  headlinePart1?: string;
  
  /**
   * Main headline part 2 (emphasized)
   */
  headlinePart2?: string;
  
  /**
   * Subheadline text
   */
  subheadline?: string;
  
  /**
   * Button text
   */
  buttonText?: string;
  
  /**
   * Button link URL
   */
  buttonHref?: string;
  
  /**
   * Background image URL (optional - defaults to gradient)
   */
  backgroundImage?: string;
  
  /**
   * Background video URL (optional - local MP4 file)
   * Note: this should be a direct MP4 file URL, not a YouTube link
   */
  backgroundVideo?: string;
  
  /**
   * YouTube video ID for background (optional)
   * Example: 'yLCMhFMxYb8' from https://www.youtube.com/watch?v=yLCMhFMxYb8
   */
  youtubeId?: string;
  
  /**
   * Enable text animations
   */
  animated?: boolean;
}

const HeroHomeSection: React.FC<HeroHomeSectionProps> = ({
  className = '',
  headlinePart1 = 'Hit the ground',
  headlinePart2 = 'working',
  subheadline = 'Graduate career-ready.',
  buttonText = 'Get started now!',
  buttonHref = '/program-list',
  backgroundImage = 'https://cdn.prod.website-files.com/66a28fdfe76f2f849d7b00f3/66e4fe8fecfe3a601045b24b_Homepage-1.webp',
  backgroundVideo,
  youtubeId,
  animated = true,
}) => {
  // Generate background style based on props
  const backgroundStyle = backgroundImage
    ? { backgroundImage: `linear-gradient(#0000004d, #0000004d), url(${backgroundImage}), linear-gradient(#000, #fff)` }
    : {};
  
  // Animation classes
  const animationClasses = animated ? styles['animated-text'] : '';
  
  return (
    <section 
      className={`${styles['c-hero__home']} ${className}`}
      style={backgroundStyle}
    >
      {/* YouTube background (if provided) */}
      {youtubeId && (
        <div className={styles['youtube-container']}>
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&controls=0&showinfo=0&rel=0&loop=1&mute=1&playlist=${youtubeId}`}
            title="Background video"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className={styles['youtube-iframe']}
          ></iframe>
        </div>
      )}
      
      {/* Local video background (if provided) */}
      {backgroundVideo && !youtubeId && (
        <div className={styles['video-container']}>
          <video
            autoPlay
            muted
            loop
            playsInline
            className={styles['background-video']}
          >
            <source src={backgroundVideo} type="video/mp4" />
          </video>
        </div>
      )}
      
      {/* Content */}
      <div className={`${styles['c-message']}`}>
        <div className={`${styles['c-grid']} content-center`}>
          <div className="flex flex-col">
            <div className={`${styles['c-bottom__spacer']} ${animationClasses}`}>
              <h2 className={`text-6xl font-bold leading-24 ${styles['white-font']}`}>
                {headlinePart1}
              </h2>
              <h1 className={`text-8xl font-bold ${styles['white-font']}`}>
                {headlinePart2}
              </h1>
              <h3 className={`text-3xl font-bold leading-24 ${styles['white-font']}`}>
                {subheadline}
              </h3>
            </div>
            
            {/* Slightly delayed animation for the button */}
            <div className={animated ? styles['button-animated'] : ''}>
              <Button
                href={buttonHref}
                variant={ButtonVariant.OUTLINE}
                className={styles['c-button__transparent']}
              >
                {buttonText}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroHomeSection;