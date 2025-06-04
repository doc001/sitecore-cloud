'use client';

// components/Navigation/Navigation.tsx
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import DrawerMenu from './DrawerMenu';
import styles from '@/styles/_Navigation.module.css';

/**
 * Props for the Navigation component
 * @param variant - The visual variant of the navigation (transparent, solid, etc.)
 */
interface NavigationProps {
  variant?: 'transparent' | 'solid' | 'white';
}

/**
 * Main navigation component for the website
 * 
 * Displays the logo and navigation buttons (search and menu)
 * Changes appearance based on scroll position and selected variant
 * Opens drawer menu when menu button is clicked
 */
const Navigation: React.FC<NavigationProps> = ({
  variant = 'transparent',
}) => {
  // State to track scroll position for style changes
  const [scrolled, setScrolled] = useState(false);
  
  // State to track if drawer menu is open
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // State to track if search is open
  const [searchOpen, setSearchOpen] = useState(false);
  
  // Update scrolled state based on window scroll position
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };
    
    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);
    
    // Initial check
    handleScroll();
    
    // Clean up listener
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);
  
  // Disable body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);
  
  // Handle search button click
  const handleSearchClick = () => {
    setSearchOpen(!searchOpen);
    if (drawerOpen) {
      setDrawerOpen(false);
    }
  };
  
  // Handle menu button click
  const handleMenuClick = () => {
    setDrawerOpen(!drawerOpen);
    if (searchOpen) {
      setSearchOpen(false);
    }
  };
  
  return (
    <>
      <div 
        className={`${styles.navBar} ${scrolled ? styles.scrolled : ''} ${
          styles[variant]
        } ${drawerOpen ? styles.menuOpen : ''}`}
      >
        <div className={styles.navContainer}>
          <div className={styles.logoWrapper}>
            <Link href="/">
              {/* White logo version */}
              <Image 
                width={174} 
                height={60} 
                src="https://cdn.prod.website-files.com/66be0b9180565f007da847e9/6761c683e17277dd60e2d404_66be0b9180565f007da847f7_Logo%20BVC%20White.svg"
                alt="Bow Valley College" 
                className={styles.navLogo + ' ' + styles.whiteLogo}
                priority
              />
              
              {/* Color logo version */}
              <Image 
                width={174} 
                height={60} 
                src="https://cdn.prod.website-files.com/66be0b9180565f007da847e9/6761c68481619685ca0a1137_66be0b9180565f007da847f7_Logo%20BVC%20Color.svg"
                alt="Bow Valley College" 
                className={styles.navLogo + ' ' + styles.colorLogo}
                priority
              />
            </Link>
          </div>
          
          <div className={styles.navButtons}>
            {/* Search button */}
            <div 
              className={`${styles.navButton} ${styles.searchButton}`}
              onClick={handleSearchClick}
            >
              <Image 
                width={24} 
                height={24} 
                src="https://cdn.prod.website-files.com/66be0b9180565f007da847e9/66be0b9180565f007da847f6_search_24dp.svg"
                alt="Search icon" 
                className={styles.navButtonIcon}
              />
              <div className={styles.navButtonText}>SEARCH</div>
            </div>
            
            {/* Menu button */}
            <div 
              className={`${styles.navButton} ${styles.menuButton}`}
              onClick={handleMenuClick}
              id="open-menu-btn"
            >
              <Image 
                width={24} 
                height={24} 
                src={drawerOpen 
                  ? "https://cdn.prod.website-files.com/66be0b9180565f007da847e9/66be0b9180565f007da847f4_close_icon.svg"
                  : "https://cdn.prod.website-files.com/66be0b9180565f007da847e9/66be0b9180565f007da847f5_menu_icon.svg"
                }
                alt={drawerOpen ? "Close icon" : "Menu icon"} 
                className={styles.navButtonIcon}
              />
              <div className={styles.navButtonText}>{drawerOpen ? "CLOSE" : "MENU"}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Drawer Menu Component */}
      <DrawerMenu 
        isOpen={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
      />
      
      {/* Search Overlay - Could be implemented separately */}
      {searchOpen && (
        <div className={styles.searchOverlay}>
          <div className={styles.searchContainer}>
            <input 
              type="text" 
              placeholder="Search..." 
              className={styles.searchInput} 
              autoFocus
            />
            <button 
              className={styles.closeSearchButton}
              onClick={() => setSearchOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Navigation;