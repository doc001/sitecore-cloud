// MainMenu.tsx
import React, { useState, useEffect } from "react";
import { navigationData } from "@/lib/navigationData";

type NavLink = { label: string; url: string; isExternal: boolean };
type NavSubmenuSection = { title: string; links: NavLink[] };
type NavSubmenu = {
  id: string;
  label: string;
  isActive: boolean;
  items: NavSubmenuSection[];
};
type NavTab = {
  id: string;
  label: string;
  isActive: boolean;
  submenus: NavSubmenu[];
};

const MainMenu: React.FC = () => {
    // Initialize all tabs inactive; will set active on mount
    const [tabs, setTabs] = useState<NavTab[]>(() =>
      navigationData.mainMenu.tabs.map(tab => ({ ...tab, isActive: false }))
    );
    const [activeTab, setActiveTab] = useState<NavTab>(tabs[0]);
    const [selectedSubmenu, setSelectedSubmenu] = useState<NavSubmenu>(
      tabs[0].submenus[0]
    );
  
    // On mount, read saved tab & submenu from localStorage
    useEffect(() => {
      const savedTabId = localStorage.getItem("activeTab");
      const initialTab = savedTabId
        ? navigationData.mainMenu.tabs.find(t => t.id === savedTabId)
        : navigationData.mainMenu.tabs[0];
  
      if (initialTab) {
        // Activate the saved or default tab
        const updatedTabs = navigationData.mainMenu.tabs.map(t => ({
          ...t,
          isActive: t.id === initialTab.id,
        }));
        setTabs(updatedTabs);
        setActiveTab(initialTab);
  
        // Load saved submenu under that tab
        const savedSubId = localStorage.getItem("selectedSubmenu");
        const initialSub =
          savedSubId && initialTab.submenus.some(s => s.id === savedSubId)
            ? initialTab.submenus.find(s => s.id === savedSubId)!
            : initialTab.submenus[0];
        setSelectedSubmenu(initialSub);
      }
    }, []);
  
    const handleMainNavClick = (tab: NavTab) => {
      const updated = tabs.map(t => ({ ...t, isActive: t.id === tab.id }));
      setTabs(updated);
      setActiveTab(tab);
      // Persist
      localStorage.setItem("activeTab", tab.id);
  
      // Reset to first submenu on tab change
      const defaultSub = tab.submenus[0];
      setSelectedSubmenu(defaultSub);
      localStorage.setItem("selectedSubmenu", defaultSub.id);
    };
  
    const handleSubmenuClick = (sub: NavSubmenu) => {
      setSelectedSubmenu(sub);
      localStorage.setItem("selectedSubmenu", sub.id);
    };

  return (
    <>
      <div className="bottom-0 left-0 fixed right-0 top-0 z-30 h-screen">
        <div className="auto-cols-fr grid-cols-[1fr] grid-rows-[auto_auto_auto] grid h-full">
          <div className="py-20 w-full h-full m-auto" id="div-6">
            <div className="menu-container border-b-stone-300 border-b-2 border-t-stone-300 border-t-2 px-38 flex w-full h-[75vh]">
              <div className="items-start flex-col flex-grow justify-start pl-5 flex">
                <div className="flex-col justify-around w-full">
                  <div className="mt-7 text-(--color-navy-100) font-bold">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => handleMainNavClick(tab)}
                      className={`group relative mr-6 py-0.5 transition-colors duration-200 cursor-pointer ${
                        tab.isActive
                          ? 'text-[var(--color-blue-100)]'
                          : 'text-[var(--color-navy-100)] hover:text-[var(--color-blue-100)]'
                      }`}
                    >
                      <span className="text-md font-semibold">{tab.label}</span>
                      <span
                        className={`absolute bottom-0 left-0 h-0.5 w-full bg-[var(--color-blue-100)] transition-transform duration-200 ${
                          tab.isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                        }`}
                      />
                    </button>
                  ))}
                  </div>

                  {/* Submenus and Links */}
                  <div className="flex pt-8 overflow-hidden">
                    <div className="w-full pr-3">
                      <div className="mb-3.5 w-80 pl-3 text-xs uppercase text-(--color-navy-100)">
                        {activeTab.label}
                      </div>
                      <div className="flex">
                        {/* Submenu Tabs */}
                        <nav className="flex flex-col w-2/4 min-w-[21.88rem] gap-3 pr-5 border-r-2 border-dashed border-r-zinc-400 text-2xl text-(--color-navy-100)">
                          {activeTab.submenus.map((sub) => (
                            <button
                              key={sub.id}
                              onClick={() => handleSubmenuClick(sub)}
                              className={`text-left pl-2 pr-8 mb-2 inline-block cursor-pointer ${
                                selectedSubmenu.id === sub.id
                                  ? "border-l-4 border-l-(--color-blue-100)"
                                  : "border-l-4 border-l-transparent hover:text-(--color-blue-100)"
                              }`}
                            >
                              {sub.label}
                            </button>
                          ))}
                        </nav>

                        {/* Links for selected submenu */}
                        <div className="pl-11 text-lg overflow-hidden">
                          {selectedSubmenu.items.map((section) => (
                            <div key={section.title}>
                              <div className="mb-3 uppercase text-xs text-(--color-navy-100)">
                                {section.title}
                              </div>
                              <div className="flex flex-col gap-[1.13rem] text-xl text-(--color-navy-100)/[0.9]">
                                {section.links.map((link) => (
                                  <a
                                    key={link.url}
                                    href={link.url}
                                    target={
                                      link.isExternal ? "_blank" : undefined
                                    }
                                    rel={
                                      link.isExternal
                                        ? "noopener noreferrer"
                                        : undefined
                                    }
                                    className="group flex items-center space-x-2"
                                  >
                                    <span className="hover:text-(--color-blue-100)" >
                                      {link.label}
                                    </span>
                                  </a>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-zinc-100 items-start flex-col justify-start pl-5 flex w-64">
                <div className="pt-32">
                  <div>
                    <div className="text-(--color-navy-100) text-xs uppercase mb-3">
                      Quick links
                    </div>
                    <ul className="mb-3 pl-10 text-sm text-zinc-500 list-none">
                      {navigationData.quickLinks.sections[0].links.map(
                        (link) => (
                          <li key={link.url} className="-ml-10 mb-2 list-item">
                            <a
                              href={link.url}
                              target={link.isExternal ? "_blank" : undefined}
                              rel={
                                link.isExternal
                                  ? "noopener noreferrer"
                                  : undefined
                              }
                            >
                              {link.label}
                            </a>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="menu-container auto-cols-fr justify-between flex gap-4 p-10">
              <div className="items-start flex-col justify-start flex text-(--color-blue-100)">
                <div className="auto-cols-fr grid-cols-[1fr_1fr] grid-rows-[auto_auto] pt-2 inline-flex gap-4">
                  <a
                    href="http://www.facebook.com/bowvalleycollege"
                    className="items-start flex-col-reverse text-center underline inline-block w-7 h-7 max-w-full rounded"
                  >
                    <div className="text-indigo-900 items-center cursor-pointer justify-center flex w-full h-full">
                      <img
                        src="https://cdn.prod.website-files.com/66a28fdfe76f2f849d7b00f3/66aa4df7a5b405433135eafb_icon_facebook.svg"
                        className="align-middle inline-block w-4 h-4 max-w-full"
                      />
                    </div>
                  </a>
                  <a
                    href="https://www.instagram.com/bowvalley/"
                    className="items-start flex-col-reverse text-center underline inline-block w-7 h-7 max-w-full rounded"
                  >
                    <div className="text-indigo-900 items-center cursor-pointer justify-center flex w-full h-full">
                      <img
                        src="https://cdn.prod.website-files.com/66a28fdfe76f2f849d7b00f3/66aa4df6a5b405433135e9ec_icon_instagram.svg"
                        className="align-middle inline-block w-4 h-4 max-w-full"
                      />
                    </div>
                  </a>
                  <a
                    href="http://twitter.com/BowValley"
                    className="items-start flex-col-reverse text-center underline inline-block w-7 h-7 max-w-full rounded"
                  >
                    <div className="text-indigo-900 items-center cursor-pointer justify-center flex w-full h-full">
                      <img
                        src="https://cdn.prod.website-files.com/66a28fdfe76f2f849d7b00f3/67e7193d527e350d80ea3faf_icon_x.svg"
                        className="align-middle inline-block w-4 h-4 max-w-full"
                      />
                    </div>
                  </a>
                  <a
                    href="https://www.linkedin.com/school/bow-valley-college"
                    className="items-start flex-col-reverse text-center underline inline-block w-7 h-7 max-w-full rounded"
                  >
                    <div className="text-indigo-900 items-center cursor-pointer justify-center flex w-full h-full">
                      <img
                        src="https://cdn.prod.website-files.com/66a28fdfe76f2f849d7b00f3/66aa4df6a5b405433135eaa7_icon_linkedin.svg"
                        className="align-middle inline-block w-4 h-4 max-w-full"
                      />
                    </div>
                  </a>
                  <a
                    href="https://www.youtube.com/@BowValleyCollege"
                    className="items-start flex-col-reverse text-center underline inline-block w-7 h-7 max-w-full rounded"
                  >
                    <div className="text-indigo-900 items-center cursor-pointer justify-center flex w-full h-full">
                      <img
                        src="https://cdn.prod.website-files.com/66a28fdfe76f2f849d7b00f3/67ca26ce6ac4c272d2c8fce6_youtube.svg"
                        className="align-middle inline-block w-4 h-4 max-w-full"
                      />
                    </div>
                  </a>
                </div>
              </div>
              <div className="items-start flex-col justify-start flex">
                <p className="mb-4">
                  <strong className="font-bold">Calgary Downtown</strong>
                  <br />
                  345 - 6 Avenue SE, Calgary, AB T2G 4V1
                </p>
              </div>
              <div className="items-start flex-col justify-start flex text-(--color-blue-100)">
                <a
                  href="mailto:info@bowvalleycollege.ca"
                  className="underline"
                >
                  info@bowvalleycollege.ca
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MainMenu;
