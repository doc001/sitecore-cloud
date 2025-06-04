// MainMenu.tsx

import React, { useState } from "react"
import { ChevronRight } from "lucide-react"
import { SiteConfig } from "@/lib/config/SiteConfig"

type SubMenuItem = {
  title: string
  href: string
}

type MenuItem = {
  title: string
  href: string
  items?: SubMenuItem[]
}

type MenuNav = {
  title: string
  active: boolean
  subNav: {
    title: string
    items: {
      title: string
      links: MenuItem[]
      title2: string
      links2: MenuItem[]
    }
  }
}

const MainMenu = () => {
  const [initialMenuNav, setInitialMenuNav] = useState(SiteConfig.menuNav)
  const [activeMenuNav, setActiveMenuNav] = useState(SiteConfig.menuNav[0])
  const [selectedSubmenu, setSelectedSubmenu] = useState<MenuItem | null>(null)

  const handleMainNavClick = (item: any) => {
    const newMenuNav = initialMenuNav.map((navItem) => ({
      ...navItem,
      active: navItem.title === item.title,
    }))
    setInitialMenuNav(newMenuNav)
    setActiveMenuNav(item)
    setSelectedSubmenu(null)
  }

  const handleSubNavClick = (link: MenuItem, e: React.MouseEvent) => {
    e.preventDefault()
    if (link.items) {
      setSelectedSubmenu(link)
    } else {
      setSelectedSubmenu(null)
      window.location.href = link.href
    }
  }

  return (
    <>
      <nav className="font-poppins container max-w-screen-xl pt-8">
        <div className="flex flex-row items-center gap-6 border-b border-gray-200 pb-4">
          {initialMenuNav.map((item) => (
            <button
              key={item.title}
              onClick={() => handleMainNavClick(item)}
              className={`group relative px-2 py-1 transition-colors duration-200
              ${
                item.active
                  ? "text-blue-500"
                  : "text-gray-600 hover:text-blue-500"
              }`}
            >
              <span className="text-lg font-medium">{item.title}</span>
              <span
                className={`absolute bottom-0 left-0 h-0.5 w-full transform bg-blue-500 transition-transform duration-200
              ${
                item.active
                  ? "scale-x-100"
                  : "scale-x-0 group-hover:scale-x-100"
              }`}
              />
            </button>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-12 gap-8">
          <div className="col-span-4 border-r pr-8">
            <h1 className="mb-6 text-3xl font-bold">{activeMenuNav.title}</h1>

            {activeMenuNav?.subNav?.title && (
              <a
                href="#"
                className="mb-8 inline-block text-blue-500 hover:underline"
                onClick={(e) => e.preventDefault()}
              >
                {activeMenuNav.subNav.title}
              </a>
            )}

            {activeMenuNav?.subNav?.items?.links && (
              <div className="mb-8">
                <h2 className="mb-4 text-xl font-semibold">
                  {activeMenuNav.subNav.items.title}
                </h2>
                <div className="flex flex-col space-y-3">
                  {activeMenuNav.subNav.items.links.map((link) => (
                    <a
                      key={link.title}
                      href={link.href}
                      onClick={(e) => handleSubNavClick(link, e)}
                      className={`group flex items-center justify-between text-gray-600 hover:text-blue-500
                      ${
                        selectedSubmenu?.title === link.title
                          ? "text-blue-500"
                          : ""
                      }`}
                    >
                      <span>{link.title}</span>
                      {link.items && (
                        <ChevronRight
                          className={`h-4 w-4 transform transition-all duration-200
                        ${
                          selectedSubmenu?.title === link.title
                            ? "rotate-90 opacity-100"
                            : "opacity-0 group-hover:opacity-100"
                        }`}
                        />
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {activeMenuNav?.subNav?.items?.links2 && (
              <div>
                <h2 className="mb-4 text-xl font-semibold">
                  {activeMenuNav.subNav.items.title2}
                </h2>
                <div className="flex flex-col space-y-3">
                  {activeMenuNav.subNav.items.links2.map((link) => (
                    <a
                      key={link.title}
                      href={link.href}
                      className="group flex items-center justify-between text-gray-600 hover:text-blue-500"
                    >
                      <span>{link.title}</span>
                      <ChevronRight className="h-4 w-4 transform opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Side Drawer */}
          <div className="col-span-8">
            {selectedSubmenu && selectedSubmenu.items && (
              <div className="pl-8 animate-fade-in">
                <h2 className="mb-6 text-2xl font-semibold">
                  {selectedSubmenu.title}
                </h2>
                <div className="grid grid-cols-2 gap-6">
                  {selectedSubmenu.items.map((item) => (
                    <a
                      key={item.title}
                      href={item.href}
                      className="group flex items-center space-x-2 text-gray-600 hover:text-blue-500"
                    >
                      <span>{item.title}</span>
                      <ChevronRight className="h-4 w-4 transform transition-transform group-hover:translate-x-1" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  )
}

export default MainMenu
