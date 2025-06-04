'use client';

import React from 'react';
import Image from 'next/image';
import { menuConfig } from '@/data/navigationData';
import styles from '@/styles/_Navigation.module.css';

/**
 * SocialMediaIcons component
 * 
 * Displays social media icons in the footer of the menu drawer
 */
const SocialMediaIcons: React.FC = () => {
  return (
    <div className={styles.socialMediaBox}>
      <a 
        href="http://www.facebook.com/bowvalleycollege" 
        target="_blank" 
        rel="noopener noreferrer"
        className={styles.socialMediaIcon}
      >
        <img 
          width="17" 
          height="17"
          src={menuConfig.socialMedia.facebook}
          alt="Follow us on Facebook" 
          className={styles.socialMediaImg}
        />
      </a>
      <a 
        href="https://www.instagram.com/bowvalley/" 
        target="_blank" 
        rel="noopener noreferrer"
        className={styles.socialMediaIcon}
      >
        <img 
          width="17" 
          height="17"
          src={menuConfig.socialMedia.instagram}
          alt="Follow us on Instagram" 
          className={styles.socialMediaImg}
        />
      </a>
      <a 
        href="http://twitter.com/BowValley" 
        target="_blank" 
        rel="noopener noreferrer"
        className={styles.socialMediaIcon}
      >
        <img 
          width="17" 
          height="17"
          src={menuConfig.socialMedia.twitter}
          alt="Follow us on Twitter" 
          className={styles.socialMediaImg}
        />
      </a>
      <a 
        href="https://www.linkedin.com/school/bow-valley-college" 
        target="_blank" 
        rel="noopener noreferrer"
        className={styles.socialMediaIcon}
      >
        <img 
          width="17" 
          height="17"
          src={menuConfig.socialMedia.linkedin}
          alt="Follow us on LinkedIn" 
          className={styles.socialMediaImg}
        />
      </a>
      <a 
        href="https://www.youtube.com/@BowValleyCollege" 
        target="_blank" 
        rel="noopener noreferrer"
        className={styles.socialMediaIcon}
      >
        <img 
          width="17" 
          height="17"
          src={menuConfig.socialMedia.youtube}
          alt="Follow us on Youtube" 
          className={styles.socialMediaImg}
        />
      </a>
    </div>
  );
};

export default SocialMediaIcons;