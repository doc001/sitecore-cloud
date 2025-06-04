// components/DrawerMenu/DrawerMenu.tsx
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import navigationData from '@/data/navigation-data.json';
import styles from '@/styles/_DrawerMenu.module.css';

interface DrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const DrawerMenu: React.FC<DrawerMenuProps> = ({ isOpen, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<string>('study'); // Default to first tab
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);
  
  // Handle escape key press
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);
  
  // Find the active tab
  const activeTabData = navigationData.navigationData.mainMenu.tabs.find(tab => tab.id === activeTab);
  
  if (!isOpen) return null;
  
  return (
    <div className={styles.drawerOverlay}>
      <div 
        ref={menuRef}
        className={`${styles.drawerMenu} ${isOpen ? styles.open : ''}`}
      >
        <div className={styles.drawerContent}>
          {/* Main tabs navigation */}
          <div className={styles.mainTabs}>
            {navigationData.navigationData.mainMenu.tabs.map((tab) => (
              <button
                key={tab.id}
                className={`${styles.tabButton} ${activeTab === tab.id ? styles.activeTab : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          {/* Submenus for the active tab */}
          {activeTabData && (
            <div className={styles.submenuContainer}>
              <div className={styles.menuGrid}>
                {activeTabData.submenus.map((submenu) => (
                  <div key={submenu.id} className={styles.menuSection}>
                    <h3 className={styles.sectionTitle}>{submenu.label}</h3>
                    <ul className={styles.menuItems}>
                      {submenu.items[0].links.map((link, linkIndex) => (
                        <li key={`link-${linkIndex}`} className={styles.menuItem}>
                          <Link 
                            href={link.url} 
                            className={styles.menuLink}
                            target={link.isExternal ? "_blank" : undefined}
                            rel={link.isExternal ? "noopener noreferrer" : undefined}
                            onClick={onClose}
                          >
                            <span className={styles.linkLabel}>{link.label}</span>
                            {link.isExternal && (
                              <span className={styles.externalIcon}>
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M10 10H2V2H6V0H2C0.9 0 0 0.9 0 2V10C0 11.1 0.9 12 2 12H10C11.1 12 12 11.1 12 10V6H10V10ZM7 0V2H9.59L3.76 7.83L5.17 9.24L11 3.41V6H13V0H7Z" fill="currentColor"/>
                                </svg>
                              </span>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Quick links section */}
          <div className={styles.quickLinksSection}>
            <h3 className={styles.quickLinksTitle}>
              {navigationData.navigationData.quickLinks.sections[0].title}
            </h3>
            <div className={styles.quickLinks}>
              {navigationData.navigationData.quickLinks.sections[0].links.map((link, index) => (
                <Link 
                  key={`quick-${index}`}
                  href={link.url}
                  className={styles.quickLink}
                  target={link.isExternal ? "_blank" : undefined}
                  rel={link.isExternal ? "noopener noreferrer" : undefined}
                  onClick={onClose}
                >
                  {link.label}
                  {link.isExternal && (
                    <span className={styles.externalIcon}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 10H2V2H6V0H2C0.9 0 0 0.9 0 2V10C0 11.1 0.9 12 2 12H10C11.1 12 12 11.1 12 10V6H10V10ZM7 0V2H9.59L3.76 7.83L5.17 9.24L11 3.41V6H13V0H7Z" fill="currentColor"/>
                      </svg>
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DrawerMenu;