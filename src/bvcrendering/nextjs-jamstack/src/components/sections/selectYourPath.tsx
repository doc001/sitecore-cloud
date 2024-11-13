'use client'

import React from 'react'
import Link from 'next/link'
import { Icons } from '@/assets/svg/icons'
import { Button } from 'flowbite-react'

function selectYourPath() {
  return (
    <section className='className="flex min-h-screen flex-col p-0'>
      <div className="container flex flex-wrap py-10 gap-10 justify-center">
        <div className="flex flex-col max-w-[380px] lg:px-10 px-4 lg:space-y-10 space-y-5">
          <h1 className="lg:text-[48px] text-[32px]">Select your path</h1>

          <p>
            Lorem ipsum dolor sit amet, consectetu adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna. do eiusmod
            tempor incididunt ut labore et dolore magna. Lorem ipsum dolor sit
            amet, consectetu adipiscing elit, sed.
          </p>

          <Link
            className="lg:flex gap-2 text-navy-700 self-center hidden"
            href="#"
          >
            Explore <Icons.arrowRight color="#354881" />
          </Link>
        </div>
        <div className="flex flex-col rounded-lg border-[1px] border-navy-400 py-8 lg:px-12 px-10 max-w-[400px]">
          <h2 className="font-bold text-2xl py-2">By interest</h2>
          <p className="max-w-[233px]">
            Tailor your education to your passions
          </p>

          <div className="px-6 py-8 space-y-2">
            <p>Business</p>
            <p>Centre for Entertainment Arts</p>
            <p>Community Studies</p>
            <p>Health & Wellness</p>
            <p>Open Studies</p>
            <p>Technology</p>
            <p>University Transfer</p>
          </div>
        </div>

        <div className="flex flex-col rounded-lg border-[1px] border-navy-400 py-8 lg:px-12 px-10 max-w-[400px]">
          <h2 className="font-bold text-2xl py-2">By interest</h2>
          <p className="max-w-[233px]">
            Tailor your education to your passions
          </p>

          <div className="px-6 py-8 space-y-2">
            <p>Business</p>
            <p>Centre for Entertainment Arts</p>
            <p>Community Studies</p>
            <p>Health & Wellness</p>
            <p>Open Studies</p>
            <p>Technology</p>
            <p>University Transfer</p>
          </div>
        </div>

        <div className="flex flex-col rounded-lg border-[1px] border-navy-400 py-8 lg:px-12 px-10 max-w-[400px]">
          <h2 className="font-bold text-2xl py-2">By interest</h2>
          <p className="max-w-[233px]">
            Tailor your education to your passions
          </p>

          <div className="px-6 py-8 space-y-2">
            <p>Business</p>
            <p>Centre for Entertainment Arts</p>
            <p>Community Studies</p>
            <p>Health & Wellness</p>
            <p>Open Studies</p>
            <p>Technology</p>
            <p>University Transfer</p>
          </div>
        </div>

        <div className="flex flex-col rounded-lg border-[1px] border-navy-400 py-8 lg:px-12 px-10 max-w-[400px]">
          <h2 className="font-bold text-2xl py-2">By interest</h2>
          <p className="max-w-[233px]">
            Tailor your education to your passions
          </p>

          <div className="px-6 py-8 space-y-2">
            <p>Business</p>
            <p>Centre for Entertainment Arts</p>
            <p>Community Studies</p>
            <p>Health & Wellness</p>
            <p>Open Studies</p>
            <p>Technology</p>
            <p>University Transfer</p>
          </div>
        </div>

        <div className="flex flex-col py-8 px-12 lg:max-w-[400px] max-w-[362px]  justify-around lg:space-y-0 space-y-8">
          <div className="space-y-4">
            <p className="text-[32px] font-bold max-w-[307px]">
              Don&apos;t know where to start?
            </p>
            <p className="text-2xl text-blue-900 font-bold">We can help you.</p>
          </div>
          <div className="flex flex-col self-start">
            <Button className="lg:w-[180px] p-[13.5px] lg:text-sm bg-blue-900">
              Book and appointment
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default selectYourPath