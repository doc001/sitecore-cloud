/**
 * NavigationContext.tsx
 * Context for managing navigation state across components
 */
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { NavigationData, MainTab } from '@/types/navigation';
import { navigationData } from '@/data/navigationData';

interface NavigationState {
  isSearchOpen: boolean;
  isMenuOpen: boolean;
  activeMainTab: string | null;
  activeSubTab: string | null;
  currentMode: 'desktop' | 'mobile';
  menuStack: { level: number; title: string }[];
  currentLevel: number;
}

interface NavigationContextProps {
  state: NavigationState;
  navigationData: NavigationData;
  toggleSearchDrawer: () => void;
  toggleMenuDrawer: () => void;
  closeAllDrawers: () => void;
  activateMainTab: (tabId: string) => void;
  activateSubmenu: (submenuId: string) => void;
  navigateToHome: () => void;
  openSubmenu: (tabData: MainTab) => void;
  goBack: () => void;
  openMainMenu: () => void;
  closeMainMenu: () => void;
}

const defaultState: NavigationState = {
  isSearchOpen: false,
  isMenuOpen: false,
  activeMainTab: null,
  activeSubTab: null,
  currentMode: 'desktop',
  menuStack: [],
  currentLevel: 0,
};

const NavigationContext = createContext<NavigationContextProps | undefined>(undefined);

interface NavigationProviderProps {
  children: ReactNode;
}

/**
 * Navigation Provider component
 * Manages navigation state and provides methods to interact with navigation
 */
export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const [state, setState] = useState<NavigationState>(defaultState);

  // Load state from localStorage on component mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('bvc-navigation-state');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        setState(prevState => ({
          ...prevState,
          activeMainTab: parsedState.mainTab || null,
          activeSubTab: parsedState.subTab || null,
        }));
      } else if (navigationData.mainMenu.tabs.length > 0) {
        // Set default active tab if no saved state
        setState(prevState => ({
          ...prevState,
          activeMainTab: navigationData.mainMenu.tabs[0].id,
        }));
      }
    } catch (error) {
      console.error('Error loading navigation state:', error);
    }
  }, []);

  // Determine current mode based on window width
  useEffect(() => {
    const handleResize = () => {
      const newMode = window.innerWidth > 768 ? 'desktop' : 'mobile';
      if (newMode !== state.currentMode) {
        setState(prevState => ({ ...prevState, currentMode: newMode }));
      }
    };

    // Set initial mode
    handleResize();

    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [state.currentMode]);

  // Save state to localStorage when active tabs change
  useEffect(() => {
    if (state.activeMainTab) {
      try {
        localStorage.setItem(
          'bvc-navigation-state',
          JSON.stringify({
            mainTab: state.activeMainTab,
            subTab: state.activeSubTab,
          })
        );
      } catch (error) {
        console.error('Error saving navigation state:', error);
      }
    }
  }, [state.activeMainTab, state.activeSubTab]);

  // Toggle search drawer
  const toggleSearchDrawer = () => {
    setState(prevState => ({
      ...prevState,
      isSearchOpen: !prevState.isSearchOpen,
      isMenuOpen: false,
    }));
  };

  // Toggle menu drawer
  const toggleMenuDrawer = () => {
    setState(prevState => ({
      ...prevState,
      isMenuOpen: !prevState.isMenuOpen,
      isSearchOpen: false,
    }));
  };

  // Close all drawers
  const closeAllDrawers = () => {
    setState(prevState => ({
      ...prevState,
      isSearchOpen: false,
      isMenuOpen: false,
    }));
  };

  // Activate main tab
  const activateMainTab = (tabId: string) => {
    let selectedTab = null;
    
    for (let i = 0; i < navigationData.mainMenu.tabs.length; i++) {
      if (navigationData.mainMenu.tabs[i].id === tabId) {
        selectedTab = navigationData.mainMenu.tabs[i];
        break;
      }
    }
    
    if (!selectedTab) return;
    
    setState(prevState => ({
      ...prevState,
      activeMainTab: tabId,
      // When changing main tab, also set the active submenu to the first submenu
      activeSubTab: selectedTab.submenus.length > 0 ? selectedTab.submenus[0].id : null,
    }));
  };

  // Activate submenu
  const activateSubmenu = (submenuId: string) => {
    setState(prevState => ({
      ...prevState,
      activeSubTab: submenuId,
    }));
  };

  // Navigate to home
  const navigateToHome = () => {
    window.location.href = '/';
  };

  // Mobile navigation - Open submenu
  const openSubmenu = (tabData: MainTab) => {
    setState(prevState => ({
      ...prevState,
      activeMainTab: tabData.id,
      menuStack: [...prevState.menuStack, {
        level: prevState.currentLevel,
        title: "Menu"
      }],
      currentLevel: 1,
    }));
  };

  // Mobile navigation - Go back
  const goBack = () => {
    if (state.menuStack.length === 0) return;
    
    const lastState = state.menuStack[state.menuStack.length - 1];
    
    setState(prevState => ({
      ...prevState,
      menuStack: prevState.menuStack.slice(0, -1),
      currentLevel: lastState.level,
    }));
  };

  // Mobile navigation - Open main menu
  const openMainMenu = () => {
    setState(prevState => ({
      ...prevState,
      isMenuOpen: true,
    }));
  };

  // Mobile navigation - Close main menu
  const closeMainMenu = () => {
    setState(prevState => ({
      ...prevState,
      isMenuOpen: false,
      menuStack: [],
      currentLevel: 0,
    }));
  };

  return (
    <NavigationContext.Provider
      value={{
        state,
        navigationData,
        toggleSearchDrawer,
        toggleMenuDrawer,
        closeAllDrawers,
        activateMainTab,
        activateSubmenu,
        navigateToHome,
        openSubmenu,
        goBack,
        openMainMenu,
        closeMainMenu,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

/**
 * Custom hook to use the navigation context
 */
export const useNavigation = (): NavigationContextProps => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};