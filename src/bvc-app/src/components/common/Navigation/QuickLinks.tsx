'use client';

import React from 'react';
import Link from 'next/link';
import { useNavigation } from '@/context/NavigationContext';
import styles from '@/styles/_Navigation.module.css';

/**
 * QuickLinks component
 * 
 * Displays quick links in the right sidebar of the desktop menu
 */
const QuickLinks: React.FC = () => {
  const { navigationData } = useNavigation();

  return (
    <>
      {navigationData.quickLinks.sections.map((section, sectionIndex) => (
        <div key={`ql-section-${sectionIndex}`}>
          {section.title && (
            <div className={styles.quickLinksTitle}>{section.title}</div>
          )}
          <ul className={styles.quickLinksList}>
            {section.links.map((link, linkIndex) => (
              <li key={`ql-link-${linkIndex}`} className={styles.quickLinksItem}>
                <Link 
                  href={link.url}
                  className={styles.quickLink}
                  target={link.isExternal ? '_blank' : undefined}
                  rel={link.isExternal ? 'noopener noreferrer' : undefined}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
};

export default QuickLinks;