'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useNavigation } from '@/context/NavigationContext';
import { MainTab, Submenu, LinkItem } from '@/types/navigation';
import styles from '@/styles/_Navigation.module.css';

/**
 * MobileMenu component
 * 
 * Displays the mobile version of the menu with hierarchical navigation
 */
const MobileMenu: React.FC = () => {
  const { 
    state, 
    navigationData, 
    goBack, 
    openSubmenu, 
    closeMainMenu 
  } = useNavigation();

  // Create refs for menu levels
  const mainLevel = useRef<HTMLDivElement>(null);
  const subLevel = useRef<HTMLDivElement>(null);

  /**
   * Render mobile menu item
   */
  const renderMenuItem = (label: string, hasSubmenu: boolean = false, onClick?: () => void) => (
    <div className={styles.menuItems} onClick={onClick}>
      <span className={styles.mtTitle}>{label}</span>
      {hasSubmenu && <span className={styles.arrows}>›</span>}
    </div>
  );

  /**
   * Render mobile menu link
   */
  const renderMenuLink = (linkData: LinkItem) => (
    <div className={styles.menuItems}>
      <Link 
        href={linkData.url}
        target={linkData.isExternal ? '_blank' : undefined}
        rel={linkData.isExternal ? 'noopener noreferrer' : undefined}
      >
        {linkData.label}
      </Link>
    </div>
  );

  /**
   * Render drawer content for a submenu
   */
  const renderDrawerContent = (submenuData: Submenu) => (
    <div 
      className={`${styles.drawerM} ${styles.drawerOpen}`} 
      data-rel={submenuData.id}
    >
      {submenuData.items.flatMap(item => 
        item.links.map((link, index) => (
          <div key={`drawer-item-${index}`} className={styles.drawerItem}>
            <Link 
              href={link.url}
              className={styles.drawerItemLink}
              target={link.isExternal ? '_blank' : undefined}
              rel={link.isExternal ? 'noopener noreferrer' : undefined}
            >
              {link.label}
            </Link>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className={styles.mobileMenuContainer} id="mobile-menu">
      <div className={styles.mobileMenuHeader}>
        <div 
          className={styles.backButton} 
          id="back-btn" 
          onClick={goBack}
          style={{ visibility: state.currentLevel === 0 ? 'hidden' : 'visible' }}
        >
          <span className={styles.arrows}>&lt;&nbsp;</span>Back to menu
        </div>
        <h2 id="menu-title" className={styles.menuTitle}>
          {state.menuStack.length > 0 
            ? navigationData.mainMenu.tabs.find(tab => tab.id === state.activeMainTab)?.label || 'Menu'
            : 'Menu'
          }
        </h2>
        <div className={styles.closeButton} onClick={closeMainMenu}>✕</div>
      </div>
      
      <div className={styles.mobileMenuContent} id="menu-content">
        {/* Main Menu Level */}
        <div 
          ref={mainLevel}
          className={`${styles.menuLevel} ${state.currentLevel === 0 ? styles.menuLevelActive : ''}`} 
          data-level="0"
        >
          {/* Main Navigation Items */}
          {navigationData.mainMenu.tabs.map((tab) => (
            <React.Fragment key={`main-tab-${tab.id}`}>
              {renderMenuItem(tab.label, true, () => {
                openSubmenu(tab);
              })}
            </React.Fragment>
          ))}
          
          {/* Quick Links Section */}
          <div className={styles.quickLinks}>
            {navigationData.quickLinks.sections.map((section, sectionIndex) => (
              <React.Fragment key={`ql-section-${sectionIndex}`}>
                {section.title && (
                  <div className={styles.sectionTitle}>{section.title}</div>
                )}
                {section.links.map((link, linkIndex) => (
                  <React.Fragment key={`ql-link-${linkIndex}`}>
                    {renderMenuLink(link)}
                  </React.Fragment>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
        
        {/* Submenu Level */}
        {state.activeMainTab && (
          <div 
            ref={subLevel}
            className={`${styles.menuLevel} ${state.currentLevel === 1 ? styles.menuLevelActive : ''}`} 
            data-level="1"
          >
            {navigationData.mainMenu.tabs
              .find(tab => tab.id === state.activeMainTab)
              ?.submenus.map((submenu) => (
                <React.Fragment key={`submenu-${submenu.id}`}>
                  {renderMenuItem(submenu.label, true)}
                  {renderDrawerContent(submenu)}
                </React.Fragment>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileMenu;