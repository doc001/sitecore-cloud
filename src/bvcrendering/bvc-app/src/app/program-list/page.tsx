import { Metadata } from 'next';
import ProgramList from '@/components/pages/ProgramList';
import programsData from '@/data/cms/Programs.json' with { type: 'json' };

// TypeScript interface for Program data structure
export interface Program {
  Name: string;
  Slug: string;
  'Collection ID': string;
  'Locale ID': string;
  'Item ID': string;
  Archived: string;
  Draft: string;
  'Created On': string;
  'Updated On': string;
  'Published On': string;
  Code: string;
  'Short description': string;
  'Program Description': string;
  'Program type': string;
  Duration: string;
  'Availabe intakes': string;
  PGWP: string;
  School: string;
  'Program area': string;
  'Course delivery': string;
  'Courses HTML': string;
  'Tuition fees': string;
  'Additional fees': string;
  Requirements: string;
  'Admin req': string;
  Category: string;
  'Apply Button is English Learing Skill': string;
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
export default function ProgramListPage(): React.JSX.Element {
  // Filter out archived and draft programs to show only published content
  const publishedPrograms: Program[] = programsData.filter((program: Program) => {
    return program.Archived === 'false' && program.Draft === 'false';
  });

  // Transform programs data to include only the fields we need for initial display
  const programsForDisplay = publishedPrograms.map((program: Program) => ({
    name: program.Name,
    programType: program['Program type'],
    availableIntakes: program['Availabe intakes'],
    slug: program.Slug,
    shortDescription: program['Short description'],
    duration: program.Duration,
    code: program.Code,
    school: program.School,
    programArea: program['Program area'],
    pgwp: program.PGWP === 'true'
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header Section */}
      <section className="bg-program-gradient text-white py-16">
        <div className="container-layout">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Our Programs
            </h1>
            <p className="text-xl md:text-2xl font-light opacity-90">
              Discover your path to success with our diverse range of programs designed to prepare you for today's dynamic workforce.
            </p>
          </div>
        </div>
      </section>

      {/* Breadcrumb Navigation */}
      <section className="bg-neutral-5 py-4">
        <div className="container-layout">
          <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-sm">
            <a 
              href="/" 
              className="text-neutral-60 hover:text-blue-100 transition-colors duration-200"
            >
              Home
            </a>
            <span className="text-neutral-40">/</span>
            <span className="text-neutral-80 font-medium">Programs</span>
          </nav>
        </div>
      </section>

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
                {programsForDisplay.length}
              </div>
              <div className="text-neutral-60">Total Programs</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-10">
              <div className="text-3xl font-bold text-purple-100 mb-2">
                {new Set(programsForDisplay.map(p => p.school)).size}
              </div>
              <div className="text-neutral-60">Schools</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-10">
              <div className="text-3xl font-bold text-orange-100 mb-2">
                {new Set(programsForDisplay.map(p => p.programType)).size}
              </div>
              <div className="text-neutral-60">Program Types</div>
            </div>
          </div>

          {/* Program List Component */}
          <ProgramList programs={programsForDisplay} />
        </div>
      </main>
    </div>
  );
}