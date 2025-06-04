'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useNavigation } from '@/context/NavigationContext';
import styles from '@/styles/_Navigation.module.css';

/**
 * SearchDrawer component
 * 
 * Displays the search drawer that slides down when the search button is clicked
 */
const SearchDrawer: React.FC = () => {
  const { state } = useNavigation();
  const [activeTab, setActiveTab] = useState<string>('general');

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className={`${styles.drawer} ${state.isSearchOpen ? styles.isOpen : ''} ${styles.searchDrawer}`}>
      <div className={styles.drawerContentSearch}>
        <div className={styles.searchBox}>
          <h2 className={styles.searchTitle}>I'm looking for...</h2>
          
          {/* Search Tabs */}
          <div className={styles.tabMenu}>
            <div className={styles.tabMenuTabs}>
              <button 
                className={`${styles.menuTabLink} ${activeTab === 'general' ? styles.menuTabLinkActive : ''}`}
                onClick={() => handleTabChange('general')}
              >
                <div>General search</div>
              </button>
              <button 
                className={`${styles.menuTabLink} ${activeTab === 'programs' ? styles.menuTabLinkActive : ''}`}
                onClick={() => handleTabChange('programs')}
              >
                <div>Programs &amp; Courses</div>
              </button>
              <button 
                className={`${styles.menuTabLink} ${activeTab === 'people' ? styles.menuTabLinkActive : ''}`}
                onClick={() => handleTabChange('people')}
              >
                <div>People</div>
              </button>
              <button 
                className={`${styles.menuTabLink} ${activeTab === 'documents' ? styles.menuTabLinkActive : ''}`}
                onClick={() => handleTabChange('documents')}
              >
                <div>Documents</div>
              </button>
            </div>
            
            {/* Tab Content */}
            <div className={styles.tabMenuContent}>
              {/* General Search Tab */}
              {activeTab === 'general' && (
                <div className={styles.tabPane}>
                  <form action="/search" className={styles.searchForm}>
                    <label htmlFor="search" className={styles.menuTabTitle}>All Bow Valley College</label>
                    <input 
                      className={styles.searchInput} 
                      maxLength={256} 
                      name="query"
                      placeholder="Search for…" 
                      type="search" 
                      id="search" 
                      required 
                    />
                    <button type="submit" className={styles.searchButton}>Search</button>
                  </form>
                </div>
              )}
              
              {/* Programs & Courses Tab */}
              {activeTab === 'programs' && (
                <div className={styles.tabPane}>
                  <div className={styles.searchFlexBox}>
                    <div className={styles.searchBox}>
                      <div className={styles.menuTabTitle}>Search Programs</div>
                      <div>
                        <Link href="/program-list" className={styles.searchLink}>
                          All Programs
                        </Link>
                      </div>
                    </div>
                    <div className={styles.searchBox}>
                      <div className={styles.menuTabTitle}>Search Courses</div>
                      <div>
                        <Link href="/study/extended-education" className={styles.searchLink}>
                          Available Courses
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* People Tab */}
              {activeTab === 'people' && (
                <div className={styles.tabPane}>
                  <div className={styles.searchFlexBox}>
                    <div className={styles.searchBox}>
                      <div className={styles.menuTabTitle}>Search the Board of Governors</div>
                      <div>
                        <Link href="/about-us/governance/board-of-governors" className={styles.searchLink}>
                          Board of Governors
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Documents Tab */}
              {activeTab === 'documents' && (
                <div className={styles.tabPane}>
                  <div className={styles.searchFlexBox}>
                    <div className={styles.searchBox}>
                      <div className={styles.menuTabTitle}>Policies</div>
                      <div>
                        <Link href="/about-us/our-organization/policies-and-compliance" className={styles.searchLink}>
                          All Policies
                        </Link>
                      </div>
                    </div>
                    <div className={styles.searchBox}>
                      <div className={styles.menuTabTitle}>Publications</div>
                      <div>
                        <Link href="/about-us/our-organization/publications" className={styles.searchLink}>
                          All Publications
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchDrawer;