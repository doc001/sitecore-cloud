'use client'

import ImacStatic from '@/components/banners/imacStatic'
import OpenHouse from '@/components/banners/openHouse'
import SelectPath from '@/components/sections/selectYourPath'
import ReasonsToChoose from '@/components/sections/reasonsToChoose'


export default function Home() {
  return (
    <div className=''>
      <ImacStatic />
      <OpenHouse />
      <SelectPath />
      <ReasonsToChoose />
    </div>
    
  )
}
