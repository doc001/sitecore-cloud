'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import HeaderLogo from '@/components/base/HeaderLogo'
import MainMenu from '@/components/base/MainMenu'
import Link from 'next/link'
import { Main } from 'next/document'


function HeaderTop() {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isSearchOpen, setIsSearchOpen] = useState(false)

    return (
        <>
            <section className='w-full fixed z-40 h-20'>
                <nav className='container-layout h-20 flex flex-row justify-between'>
                    <HeaderLogo />
                    <div className='self-end w-auto flex flex-row items-center h-full py-0 pb-0'>
                        <button
                            className='bg-(--color-orange-100) w-20 h-20 flex flex-col items-center cursor-pointer'
                            type='button'
                            onClick={() => {
                                setIsSearchOpen(!isSearchOpen)
                                setIsMenuOpen(false) // Close menu if open
                            }}
                        >
                            <Image
                                className='w-9 pt-3'
                                width={37}
                                height={37}
                                src='https://cdn.prod.website-files.com/66a28fdfe76f2f849d7b00f3/66a40d260fe8fcd59bba7fe8_search_24dp.svg'
                                alt='Search'
                            />
                            <p className='text-white text-xs text-center uppercase pt-0.5'>
                                Search
                            </p>
                        </button>

                        <button
                            className='bg-(--color-purple-100) w-20 h-20 flex flex-col items-center cursor-pointer'
                            type='button'
                            onClick={() => {
                                setIsMenuOpen(!isMenuOpen)
                                setIsSearchOpen(false) // Close search if open
                            }}
                        >
                            <Image
                                className='w-9 pt-5 pb-1'
                                width={37}
                                height={37}
                                src='https://cdn.prod.website-files.com/66a28fdfe76f2f849d7b00f3/66a40d260ce0cce1669e692c_menu_icon.svg'
                                alt='Menu'
                            />
                            <p className='text-white text-xs text-center uppercase pt-1'>
                                Menu
                            </p>
                        </button>
                    </div>
                </nav>
            </section>

            {/* Menu Drawer */}
            <div 
                className={`fixed inset-0 bg-white transform transition-transform duration-300 ease-in-out ${
                    isMenuOpen ? 'translate-y-0' : '-translate-y-full'
                } z-30`}
            >
                <div className="h-full pt-32 px-6 pb-6">
                    <MainMenu />
                </div>
            </div>

            {/* Search Drawer */}
            <div 
                className={`fixed inset-0 bg-white transform transition-transform duration-300 ease-in-out ${
                    isSearchOpen ? 'translate-y-0' : '-translate-y-full'
                } z-30`}
            >
                <div className="h-full pt-32 px-6 pb-6">
                    <div className="max-w-2xl mx-auto">
                        <div className="flex flex-col space-y-6">
                            <h2 className="text-2xl font-bold text-gray-800">Search</h2>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                />
                                <button
                                    className="absolute right-4 top-4 text-gray-400 hover:text-orange-500"
                                >
                                    <img
                                        className='w-6 h-6'
                                        src='/api/placeholder/24/24'
                                        alt='Search'
                                    />
                                </button>
                            </div>
                            <div className="mt-8">
                                <h3 className="text-lg font-semibold text-gray-700 mb-4">Popular Searches</h3>
                                <div className="flex flex-wrap gap-2">
                                    <button className="px-4 py-2 bg-gray-100 hover:bg-orange-100 rounded-full text-gray-700 text-sm">
                                        Programs
                                    </button>
                                    <button className="px-4 py-2 bg-gray-100 hover:bg-orange-100 rounded-full text-gray-700 text-sm">
                                        Admissions
                                    </button>
                                    <button className="px-4 py-2 bg-gray-100 hover:bg-orange-100 rounded-full text-gray-700 text-sm">
                                        Campus Life
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default HeaderTop