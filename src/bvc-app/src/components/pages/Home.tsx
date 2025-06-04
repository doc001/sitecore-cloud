// components/pages/Home.tsx

'use client';

import React from 'react';
import HeroHomeSection from '@/components/banners/HeroHomeSection';
import GradientHeroSection from '@/components/banners/GradientHeroSection';
import PathSelectionSection from '@/components/sections/PathSelectionSection';
import { ProgramLink } from '@/types';

const interestLinks: ProgramLink[] = [
  { title: 'Business', href: '/program-areas/business' },
  { title: 'Entertainment Arts', href: '/program-areas/entertainment-arts' },
  { title: 'Technology', href: '/program-areas/technology' },
  { title: 'Health & Wellness', href: '/program-areas/health-wellness' },
  { title: 'Community Studies', href: '/program-areas/community-studies' },
  { title: 'Academic Upgrading', href: '/program-areas/academic-upgrading' },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      <HeroHomeSection 
        headlinePart1="Hit the ground"
        headlinePart2="working"
        subheadline="Graduate career-ready."
        buttonText="Get started now!"
        buttonHref="/program-list"
        youtubeId="" 
        animated={true}
      />

      <GradientHeroSection 
        textBefore="Our programs"
        emphasizedText="empower you for your career journey"
        textAfter="and a lifetime of continuous learning and growth."
        animated={true}
      />

      <PathSelectionSection interestLinks={interestLinks} />
    </main>
  );
}
