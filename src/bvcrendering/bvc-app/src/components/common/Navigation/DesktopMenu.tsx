"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useNavigation } from "@/context/NavigationContext";
import { MainTab, Submenu } from "@/types/navigation";
import styles from "@/styles/_Navigation.module.css";
import QuickLinks from "./QuickLinks";

/**
 * DesktopMenu component
 *
 * Displays the desktop version of the menu with main tabs and submenus
 */
const DesktopMenu: React.FC = () => {
  const { state, navigationData, activateMainTab, activateSubmenu } =
    useNavigation();

  // Find active main tab and submenu
  const activeMainTab = navigationData.mainMenu.tabs.find(
    (tab) => tab.id === state.activeMainTab
  );

  const activeSubmenu = activeMainTab?.submenus.find(
    (submenu) => submenu.id === state.activeSubTab
  );

  // Set initial active tabs if not set
  // Set initial active tabs if not set
  useEffect(() => {
    if (!state.activeMainTab && navigationData.mainMenu.tabs.length > 0) {
      activateMainTab(navigationData.mainMenu.tabs[0].id);
    }

    if (
      state.activeMainTab &&
      !state.activeSubTab &&
      activeMainTab &&
      activeMainTab.submenus.length > 0
    ) {
      activateSubmenu(activeMainTab.submenus[0].id);
    }
  }, [
    state.activeMainTab,
    state.activeSubTab,
    navigationData,
    activeMainTab,
    activateMainTab,
    activateSubmenu,
  ]);

  /**
   * Render main tab buttons
   */
  const renderMainTabs = () => {
    return navigationData.mainMenu.tabs.map((tab) => (
      <button
        key={tab.id}
        className={`${styles.menuTabLink} ${
          tab.id === state.activeMainTab ? styles.menuTabLinkActive : ""
        }`}
        onClick={() => activateMainTab(tab.id)}
        data-tab-id={tab.id}
      >
        <div>{tab.label}</div>
      </button>
    ));
  };

  /**
   * Render submenu tabs for the active main tab
   */
  const renderSubmenuTabs = (tabData: MainTab) => {
    return tabData.submenus.map((submenu) => (
      <button
        key={submenu.id}
        className={`${styles.submenuTabLink} ${
          submenu.id === state.activeSubTab ? styles.submenuTabLinkActive : ""
        }`}
        onClick={() => activateSubmenu(submenu.id)}
        data-submenu-id={submenu.id}
      >
        <div>{submenu.label}</div>
      </button>
    ));
  };

  /**
   * Render links for the active submenu
   */
  const renderSubmenuLinks = (submenuData: Submenu) => {
    return submenuData.items.map((item, index) => (
      <div key={`item-${index}`} className={styles.linksList}>
        {item.title && (
          <div className={styles.submenuItemTitle}>{item.title}</div>
        )}
        {item.links.map((link, linkIndex) => (
          <React.Fragment key={`link-${linkIndex}`}>
            <Link
              href={link.url}
              className={styles.submenuLink}
              target={link.isExternal ? "_blank" : undefined}
              rel={link.isExternal ? "noopener noreferrer" : undefined}
            >
              {link.label}
            </Link>
            {link.sublinks?.map((sublink, sublinkIndex) => (
              <Link
                key={`sublink-${sublinkIndex}`}
                href={sublink.url}
                className={styles.submenuLinkSub}
                target={sublink.isExternal ? "_blank" : undefined}
                rel={sublink.isExternal ? "noopener noreferrer" : undefined}
              >
                {sublink.label}
              </Link>
            ))}
          </React.Fragment>
        ))}
      </div>
    ));
  };

  return (
    <div className={styles.menuStacks}>
      <div className={styles.menuStackLeft}>
        <div className={styles.tabMenu}>
          {/* Main tabs */}
          <div className={styles.tabMenuTabs}>{renderMainTabs()}</div>

          {/* Tab content */}
          <div className={styles.tabMenuContent}>
            {activeMainTab && (
              <div className={styles.tabPane}>
                <div className={styles.menuTabTitle}>{activeMainTab.label}</div>

                <div className={styles.tabSubmenu}>
                  {/* Submenu tabs */}
                  <div className={styles.submenuTabs}>
                    {renderSubmenuTabs(activeMainTab)}
                  </div>

                  {/* Submenu content */}
                  <div className={styles.submenuContent}>
                    {activeSubmenu && (
                      <div className={styles.submenuItemPane}>
                        <div className={styles.menuTabTitle}>
                          {activeSubmenu.label}
                        </div>
                        {renderSubmenuLinks(activeSubmenu)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className={styles.menuStackRight}>
        <div className={styles.quickLinksWrapper}>
          <QuickLinks />
        </div>
      </div>
    </div>
  );
};

export default DesktopMenu;
