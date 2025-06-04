// app/apply/i-am-ready/[slug]/page.tsx
import React from 'react'
import { notFound } from 'next/navigation'
import ApplicantProfile from '@/components/sections/ApplicantProfile'
import HeroExtendedEducation from '@/components/banners/HeroBannerSection'
import { ApplicantProfileType, PROFILE_INFO_MAP } from '@/types'
import Breadcrumb from '@/components/common/Breadcrumb';
import { getBreadcrumbData } from '@/lib/breadcrumbData';

/** Our list of valid slugs, cast to the proper ApplicantProfileType[] */
const VALID_SLUGS = Object.keys(PROFILE_INFO_MAP) as ApplicantProfileType[]

/**
 * Server component for /apply/i-am-ready/[slug]
 */
export default async function ApplicantProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  if (!VALID_SLUGS.includes(slug as ApplicantProfileType)) {
    notFound()
  }

  const formattedTitle = slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())

  // Get the base breadcrumb data
  const breadcrumbData = await getBreadcrumbData('apply/ready-to-apply');
  
  // Get the profile title from your PROFILE_INFO_MAP
  const profileInfo = PROFILE_INFO_MAP[slug as ApplicantProfileType];
  const profileTitle = profileInfo ? profileInfo.title : formattedTitle;
  
  // Add the current page (slug) to the breadcrumb
  const fullBreadcrumbData = [
    ...breadcrumbData,
    {
      label: profileTitle,
      href: `/apply/i-am-ready/${slug}`,
      isCurrentPage: true
    }
  ];
  
  return (
    <main className="min-h-screen">
      <HeroExtendedEducation title={`Application: ${formattedTitle}`} />
      <Breadcrumb 
        items={fullBreadcrumbData} 
        variant="general"
      />

      <section className="py-12 px-4 max-w-7xl mx-auto">
        <ApplicantProfile profileType={slug as ApplicantProfileType} />
      </section>
    </main>
  )
}

/**
 * Dynamic metadata generator
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const formattedTitle = slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
  const profileInfo = PROFILE_INFO_MAP[slug as ApplicantProfileType]

  return {
    title: `Apply: ${formattedTitle} | University Name`,
    description: profileInfo
      ? `${profileInfo.subtitle} at University Name. Complete your application and begin your educational journey.`
      : `Application portal for ${formattedTitle.toLowerCase()} at University Name.`,
  }
}

/**
 * Build-time list of all slugs
 */
export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  return VALID_SLUGS.map((slug) => ({ slug }))
}