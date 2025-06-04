/**
 * Navigation data types for the Bow Valley College menu system
 */

// Link item structure
export interface LinkItem {
    label: string;
    url: string;
    isExternal: boolean;
    sublinks?: LinkItem[];
  }
  
  // Menu item structure
  export interface MenuItem {
    title: string;
    links: LinkItem[];
  }
  
  // Submenu structure
  export interface Submenu {
    id: string;
    label: string;
    isActive: boolean;
    items: MenuItem[];
  }
  
  // Main tab structure
  export interface MainTab {
    id: string;
    label: string;
    isActive: boolean;
    submenus: Submenu[];
  }
  
  // Navigation data structure
  export interface NavigationData {
    mainMenu: {
      tabs: MainTab[];
    };
    quickLinks: {
      sections: {
        title: string;
        links: LinkItem[];
      }[];
    };
  }
  
  // Menu configuration for logos and icons
  export interface MenuConfig {
    logos: {
      white: string;
      color: string;
    };
    icons: {
      search: string;
      menu: string;
    };
    socialMedia: {
      facebook: string;
      instagram: string;
      twitter: string;
      linkedin: string;
      youtube: string;
    };
  }