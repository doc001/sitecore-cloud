import React from 'react';
import type { Metadata } from 'next';
import GenericHero from '@/components/banners/GenericHero';
import Breadcrumb from '@/components/common/Breadcrumb';
import CareerAdvisorSection from '@/components/sections/CareerAdvisor/CareerAdvisorSection';
import { getBreadcrumbData } from '@/lib/breadcrumbData';

export const metadata: Metadata = {
  title: 'Career Advisor | Bow Valley College',
  description:
    'Answer eight quick questions and get matched with Alberta careers and the Bow Valley College programs that lead there.',
  openGraph: {
    title: 'Career Advisor | Bow Valley College',
    description: 'Find Alberta careers that fit how you think, and the BVC programs that get you there.',
    type: 'website',
  },
};

export default async function CareerAdvisorPage() {
  const breadcrumbData = await getBreadcrumbData('career-advisor');

  return (
    <main>
      <GenericHero
        title="Find your"
        subtitle="career fit."
        description="Tell us what drives you. We'll match you with Alberta careers and the programs that get you there."
      />
      <Breadcrumb items={breadcrumbData} variant="general" />
      <section className="bg-[color:var(--color-neutral-5)] py-16">
        <div className="container-layout">
          <CareerAdvisorSection />
        </div>
      </section>
    </main>
  );
}
