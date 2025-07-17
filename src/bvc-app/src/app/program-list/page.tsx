import { Metadata } from 'next';
import ProgramList from '@/components/pages/ProgramList';
import Breadcrumb from '@/components/common/Breadcrumb';
import { getBreadcrumbData } from '@/lib/navigationBreadcrumbUtils';
import programsData from '@/data/cms/Programs.json' with { type: 'json' };

// TypeScript interface for the new Webflow CMS data structure
export interface WebflowProgram {
  id: string;
  cmsLocaleId: string;
  lastPublished: string;
  lastUpdated: string;
  createdOn: string;
  isArchived: boolean;
  isDraft: boolean;
  fieldData: {
    name: string;
    slug?: string;
    code?: string;
    'short-description'?: string;
    'program-description'?: string;
    'program-type'?: string;
    duration?: string;
    'availabe-intakes-2'?: string[];
    pgwp?: boolean;
    school?: string;
    'program-area'?: string;
    'course-delivery'?: string;
    'courses-code'?: string;
    'tuition-fees'?: string;
    'additional-fees'?: string;
    requirements?: string;
    'admin-req'?: string;
    category?: string;
    'apply-button-is-english-learing-skill'?: boolean;
    'has-intl-offerings'?: boolean;
    'has-zero-textbook-cost'?: boolean;
    'apply-button-is-first-year-student'?: boolean;
  };
}

// Interface for the root JSON structure
export interface ProgramsDataStructure {
  items: WebflowProgram[];
}

// Transformed program interface for display (matching ProgramList component expectations)
export interface TransformedProgram {
  name: string;
  programType: string;
  availableIntakes: string; // Changed from string[] to string to match ProgramList component
  slug: string;
  shortDescription: string;
  duration: string;
  code: string;
  school: string;
  programArea: string;
  pgwp: boolean;
}

// Metadata for SEO and page information
export const metadata: Metadata = {
  title: 'Programs | Bow Valley College',
  description: 'Explore our comprehensive list of programs including diplomas, certificates, and upgrading courses at Bow Valley College.',
  keywords: 'programs, diploma, certificate, upgrading, bow valley college, education',
  openGraph: {
    title: 'Programs | Bow Valley College',
    description: 'Explore our comprehensive list of programs including diplomas, certificates, and upgrading courses at Bow Valley College.',
    type: 'website',
  },
};

/**
 * Program List Page Component
 * 
 * This page displays a comprehensive list of all available programs at Bow Valley College.
 * It fetches program data from the CMS JSON file and renders them using the ProgramList component.
 * The page includes filtering and display functionality for program types and intake availability.
 * 
 * @returns {React.JSX.Element} The program list page
 */
export default async function ProgramListPage(): Promise<React.JSX.Element> {
  // Get breadcrumb data for the current page using navigation structure
  const breadcrumbItems = await getBreadcrumbData('/program-list');
  
  // Cast the imported data to the correct type
  const typedProgramsData = programsData as ProgramsDataStructure;
  
  // Filter out archived and draft programs to show only published content
  const publishedPrograms: WebflowProgram[] = typedProgramsData.items.filter((program: WebflowProgram) => {
    return !program.isArchived && !program.isDraft;
  });

  // Transform programs data to include only the fields we need for initial display
  const programsForDisplay: TransformedProgram[] = publishedPrograms.map((program: WebflowProgram) => ({
    name: program.fieldData.name || 'Untitled Program',
    programType: program.fieldData['program-type'] || 'Not specified',
    availableIntakes: Array.isArray(program.fieldData['availabe-intakes-2']) 
      ? program.fieldData['availabe-intakes-2'].join(', ') 
      : 'No intakes specified', // Convert array to comma-separated string
    slug: program.fieldData.slug || program.id,
    shortDescription: program.fieldData['short-description'] || 'No description available',
    duration: program.fieldData.duration || 'Duration not specified',
    code: program.fieldData.code || 'No code',
    school: program.fieldData.school || 'School not specified',
    programArea: program.fieldData['program-area'] || 'Area not specified',
    pgwp: program.fieldData.pgwp || false
  }));

  // Filter out programs with essential missing data (optional safety check)
  const validPrograms = programsForDisplay.filter(program => 
    program.name && program.name !== 'Untitled Program'
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header Section */}
      <section className="bg-program-gradient text-white py-32">
        <div className="container-layout">
          <div className="mx-auto">
            <h4 className="text-6xl font-semibold mb-6">
              Find a Program
            </h4>
          </div>
        </div>
      </section>

      {/* Breadcrumb Navigation - Using the reusable component */}
      <Breadcrumb 
        items={breadcrumbItems} 
        variant="program"
        showHomeIcon={true}
      />

      {/* Main Content Section */}
      <main className="container-layout">
        <div className="py-8">
          {/* Page Introduction */}
          <div className="max-w-3xl mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold text-neutral-80 mb-4">
              Find Your Perfect Program
            </h2>
            <p className="text-lg text-neutral-60 leading-relaxed">
              Whether you're looking to start a new career, advance in your current field, or upgrade your skills, 
              we have a program that's right for you. Browse through our offerings and take the first step toward your future.
            </p>
          </div>

          {/* Program Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-10">
              <div className="text-3xl font-bold text-blue-100 mb-2">
                {validPrograms.length}
              </div>
              <div className="text-neutral-60">Total Programs</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-10">
              <div className="text-3xl font-bold text-purple-100 mb-2">
                {new Set(validPrograms.map(p => p.school).filter(school => school && school !== 'School not specified')).size}
              </div>
              <div className="text-neutral-60">Schools</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-10">
              <div className="text-3xl font-bold text-orange-100 mb-2">
                {new Set(validPrograms.map(p => p.programType).filter(type => type && type !== 'Not specified')).size}
              </div>
              <div className="text-neutral-60">Program Types</div>
            </div>
          </div>

          {/* Program List Component */}
          <ProgramList programs={validPrograms} />
        </div>
      </main>
    </div>
  );
}