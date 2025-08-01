// /app/programs/[slug]/page.tsx

import programs from '@/data/cms/programs.parsed.json'; // Output from parsePrograms.mjs
import Breadcrumb from '@/components/common/Breadcrumb';
import { getBreadcrumbData } from '@/lib/navigationBreadcrumbUtils';

// Utility to find the program by slug
function getProgramBySlug(slug: string) {
  return programs.find((prog) => prog.slug === slug) || null;
}

// (Reuse your stripHtml, or import if you have one globally)
const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim();

export default async function ProgramPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const programData = getProgramBySlug(slug);

  if (!programData) {
    // Not Found - Next.js App Router
    return <div className="p-10 text-center text-red-500 text-xl">Program not found</div>;
  }

  // (Breadcrumb logic remains)
  const breadcrumbItems = await getBreadcrumbData(`/programs/${slug}`);

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header Section */}
      <section className="mx-auto bg-program-gradient pt-32 pb-24">
        <div className="md:flex md:items-center md:px-[10%]">
          <div className="px-6 mx-auto md:px-0 md:mx-0 md:flex-auto">
            <h1 className="text-pretty text-6xl font-semibold text-white">{programData.name}</h1>
            <p className="mt-20 text-pretty text-lg font-light text-white sm:text-xl/8">{programData.shortDescription}</p>
          </div>
          {/* ... more program info ... */}
        </div>
      </section>
      {/* Breadcrumb Navigation */}
      <Breadcrumb items={breadcrumbItems} variant="program" showHomeIcon={true} />

      {/* Program Description (HTML) */}
      <section className="max-w-4xl mx-auto my-10 px-6 prose prose-lg" dangerouslySetInnerHTML={{ __html: programData.descriptionHtml }} />

      {/* ...rest of your sections (courses, requirements, etc.) */}
    </div>
  );
}

// SSG: All slugs generated from parsed JSON
export async function generateStaticParams() {
  return programs.map((prog) => ({ slug: prog.slug }));
}

// SEO Metadata
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const program = getProgramBySlug(params.slug);
  if (!program) {
    return { title: 'Program Not Found' };
  }
  return {
    title: `${program.name} | Bow Valley College`,
    description: program.shortDescription,
    openGraph: {
      title: `${program.name}`,
      description: program.shortDescription,
      type: 'website',
    },
  };
}
