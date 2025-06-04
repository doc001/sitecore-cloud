
import React from 'react';
import ApplyPathSection from '@/components/sections/ApplyPathSection';  
import GenericHero from '@/components/banners/GenericHero';
import Breadcrumb from '@/components/common/Breadcrumb';
import { getBreadcrumbData } from '@/lib/breadcrumbData';

export default async function ReadyToApplyPage() {

  const breadcrumbData = await getBreadcrumbData('apply/ready-to-apply');

  return (
    <main>
      <GenericHero />
      <Breadcrumb 
        items={breadcrumbData} 
        variant="general"
      />
      <ApplyPathSection />
    </main>
  );
}