'use client';

import React from 'react';
import Link from 'next/link';
import { useNavigation } from '@/context/NavigationContext';
import styles from '@/styles/_Navigation.module.css';
import { menuConfig } from '@/data/navigationData';
import DesktopMenu from './DesktopMenu';
import MobileMenu from './MobileMenu';
import SocialMediaIcons from './SocialMediaIcons';

/**
 * MenuDrawer component
 * 
 * Displays the menu drawer that slides down when the menu button is clicked
 * Contains both desktop and mobile menu components
 */
const MenuDrawer: React.FC = () => {
  const { state } = useNavigation();

  return (
    <div className={`${styles.drawer} ${state.isMenuOpen ? styles.isOpen : ''} ${styles.menuDrawer}`}>
      <div className={styles.drawerContent}>
        {/* Desktop Menu */}
        <DesktopMenu />
        
        {/* Footer Layout */}
        <div className={styles.drawerFooterLayout}>
          <div className={styles.footerCell}>
            <SocialMediaIcons />
          </div>
          <div className={styles.footerCell}>
            <p className={styles.footerText}>
              <strong>Calgary Downtown</strong><br />
              345 - 6 Avenue SE, Calgary, AB T2G 4V1
            </p>
          </div>
          <div className={styles.footerCell}>
            <a href="mailto:info@bowvalleycollege.ca" className={styles.footerLink}>
              info@bowvalleycollege.ca
            </a>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu Container */}
      <div className={styles.drawerContentMobile}>
        <MobileMenu />
      </div>
    </div>
  );
};

export default MenuDrawer;