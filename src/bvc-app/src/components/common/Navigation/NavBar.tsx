'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useNavigation } from '@/context/NavigationContext';
import { menuConfig } from '@/data/navigationData';
import styles from '@/styles/_Navigation.module.css';

/**
 * NavBar component
 * 
 * Displays the top navigation bar with the logo, apply button, search button, and menu button
 */
const NavBar: React.FC = () => {
  const { 
    state, 
    toggleSearchDrawer, 
    toggleMenuDrawer, 
    navigateToHome 
  } = useNavigation();

  return (
    <div className={`${styles.navBar} ${(state.isSearchOpen || state.isMenuOpen) ? styles.drawerOpen : ''}`}>
      <div className={styles.navContainer}>
        {/* Logo */}
        <div className={styles.logoWrapper} onClick={navigateToHome}>
          <img 
            width="174" 
            src={menuConfig.logos.white}
            alt="Bow Valley College" 
            className={`${styles.navLogo} ${styles.whiteLogo}`}
          />
          <img 
            width="174" 
            src={menuConfig.logos.color}
            alt="Bow Valley College" 
            className={`${styles.navLogo} ${styles.colorLogo}`}
          />
        </div>
        
        {/* Nav Buttons */}
        <div className={styles.navButtons}>
          {/* Apply Button */}
          <div className={styles.navButton}>
            <Link href="/apply/ready-to-apply" className={styles.applyButton}>
              Ready to Apply
            </Link>
          </div>
          
          {/* Search Button */}
          <div 
            className={`${styles.navButton} ${styles.searchButton}`} 
            onClick={toggleSearchDrawer}
          >
            <img 
              src={menuConfig.icons.search}
              alt="Search icon" 
              className={styles.navButtonIcon}
            />
            <div className={styles.navButtonText}>SEARCH</div>
          </div>
          
          {/* Menu Button */}
          <div 
            className={`${styles.navButton} ${styles.menuButton}`} 
            onClick={toggleMenuDrawer}
            id="open-menu-btn"
          >
            <img 
              src={menuConfig.icons.menu}
              alt="Menu icon" 
              className={styles.navButtonIcon}
            />
            <div className={styles.navButtonText}>MENU</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavBar;