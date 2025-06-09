import { notFound } from 'next/navigation';
import Link from 'next/link';
import Breadcrumb from '@/components/common/Breadcrumb';
import { getBreadcrumbData } from '@/lib/navigationBreadcrumbUtils';

// Types (as you had)
interface ProgramData {
  Name: string;
  Slug: string;
  Code: string;
  "Short description": string;
  "Program Description": string;
  "Program type": string;
  Duration: string;
  "Availabe intakes": string;
  PGWP: string;
  School: string;
  "Program area": string;
  "Course delivery": string;
  "Courses HTML": string;
  "Tuition fees": string;
  "Additional fees": string;
  Requirements: string;
  "Admin req": string;
  Category: string;
  "Apply Button is English Learing Skill": string;
}

interface CourseTableData {
  code: string;
  course: string;
  credit: string;
  pdfUrl: string;
  hasZeroTextbook?: boolean;
  hasPLAR?: boolean;
}

interface TermData {
  termNumber: number;
  courses: CourseTableData[];
  additionalText?: string;
}

interface TuitionData {
  term: string;
  tuition: string;
  additional: string;
  total: string;
}

interface IntakeData {
  period: string;
  domestic: {
    status: 'Open' | 'Waitlist' | 'Not Offered' | 'Closed';
    color: 'text-lime-600' | 'text-orange-400' | 'text-zinc-400' | 'text-red-500';
  };
  international: {
    status: 'Open' | 'Waitlist' | 'Not Offered' | 'Closed';
    color: 'text-lime-600' | 'text-orange-400' | 'text-zinc-400' | 'text-red-500';
  };
}

// Replace these with your real data fetch / parsing functions:
const parseCoursesData = (coursesHTML: string): TermData[] => {
  // Mock data here or real parsing logic
  return [
    // ... your mock course terms ...
  ];
};

const parseTuitionData = (tuitionFees: string): TuitionData[] => [
  { term: 'Term 1', tuition: '$2,217', additional: '$356', total: '$2,573' },
  { term: 'Term 2', tuition: '$2,817', additional: '$356', total: '$3,173' },
  { term: 'Term 3', tuition: '$2,655', additional: '$356', total: '$2,961' },
  { term: 'Term 4', tuition: '$2,712', additional: '$356', total: '$3,068' },
];

const parseIntakeData = (availableIntakes: string): IntakeData[] => [
  {
    period: 'September 2025',
    domestic: { status: 'Open', color: 'text-lime-600' },
    international: { status: 'Waitlist', color: 'text-orange-400' },
  },
  {
    period: 'January 2026',
    domestic: { status: 'Not Offered', color: 'text-zinc-400' },
    international: { status: 'Not Offered', color: 'text-zinc-400' },
  },
];

// Replace with your real CMS fetch
async function getProgramData(slug: string): Promise<ProgramData | null> {
  if (slug === 'addiction-studies-diploma') {
    return {
      Name: 'Addiction Studies',
      Slug: 'addiction-studies-diploma',
      Code: 'AASD',
      "Short description":
        'Do you want to become an addiction practitioner? You will enjoy both classroom and practicum learning opportunities in this program. Let us help you reach your goal.',
      "Program Description":
        '<p>The two-year Addiction Studies Diploma program will provide students with comprehensive knowledge...</p>',
      "Program type": 'diploma',
      Duration: '4-terms',
      "Availabe intakes": 'aasd-fall-2025; aasd-winter-2026',
      PGWP: 'true',
      School: 'school-of-community-studies',
      "Program area": 'community-studies',
      "Course delivery": '',
      "Courses HTML": '',
      "Tuition fees": 'aasd-term1; aasd-term2; aasd-term3; aasd-term4',
      "Additional fees": '',
      Requirements: '',
      "Admin req":
        '<h5><strong>Academic requirements</strong></h5><ul><li>Credit in English 30-1 or 65% in English 30-2 or equivalent</li></ul>',
      Category: '',
      "Apply Button is English Learing Skill": 'false',
    };
  }
  return null;
}

const CourseIcons = ({ hasPLAR, hasZeroTextbook }: { hasPLAR?: boolean; hasZeroTextbook?: boolean }) => (
  <>
    {hasPLAR && <p className="text-indigo-600 text-2xl pl-2">move_down</p>}
    {hasZeroTextbook && <p className="text-indigo-600 text-2xl pl-2">hide_source</p>}
  </>
);

const StatusIndicator = ({ status, color }: { status: string; color: string }) => (
  <div className="items-center flex">
    <div className={`${color} pr-1`}>●</div>
    {status}
  </div>
);

const CourseTable = ({ courses, additionalText }: { courses: CourseTableData[]; additionalText?: string }) => (
  <div className="bg-zinc-100 px-4 overflow-hidden">
    <table className="border-collapse table w-full my-4 mx-auto">
      <thead className="table-header-group text-white font-bold">
        <tr className="table-row">
          <th className="bg-sky-600 align-middle table-cell border-2 border-stone-300 border-solid p-3">Code</th>
          <th className="bg-sky-600 align-middle table-cell border-2 border-stone-300 border-solid p-3">Course</th>
          <th className="bg-sky-600 text-center align-middle table-cell border-2 border-stone-300 border-solid p-3">Credit</th>
          <th className="bg-sky-600 text-center align-middle table-cell border-2 border-stone-300 border-solid p-3">PDF</th>
        </tr>
      </thead>
      <tbody className="table-row-group">
        {courses.map((course, index) => (
          <tr key={course.code} className={index % 2 === 1 ? 'bg-stone-50 table-row' : 'table-row'}>
            <td className="align-middle table-cell border-2 border-stone-300 border-solid p-3">{course.code}</td>
            <td className="align-middle table-cell border-2 border-stone-300 border-solid p-3">
              {course.course}
              <CourseIcons hasPLAR={course.hasPLAR} hasZeroTextbook={course.hasZeroTextbook} />
            </td>
            <td className="text-center align-middle table-cell border-2 border-stone-300 border-solid p-3">{course.credit}</td>
            <td className="text-center align-middle table-cell border-2 border-stone-300 border-solid p-3 text-2xl text-sky-500">
              <a href={course.pdfUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open PDF for ${course.code}`}>
                <p className="text-indigo-600 cursor-pointer pl-2">picture_as_pdf</p>
              </a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    {additionalText && <p className="mb-4">{additionalText}</p>}
  </div>
);

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim();

export default async function ProgramPage({ params }: { params: Promise<{ slug: string }> }) {
  // Await params before using them (Next.js 15+ requirement)
  const { slug } = await params;
  
  // Get program data first
  const programData = await getProgramData(slug);
  
  if (!programData) notFound();
  
  // Get breadcrumb data for the current program page
  const breadcrumbItems = await getBreadcrumbData(`/programs/${slug}`);

  const coursesData = parseCoursesData(programData["Courses HTML"]);
  const tuitionData = parseTuitionData(programData["Tuition fees"]);
  const intakeData = parseIntakeData(programData["Availabe intakes"]);

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header Section */}
      <section className="mx-auto bg-program-gradient pt-32 pb-24">
        <div className="md:flex md:items-center md:px-[10%]">
          <div className="px-6 mx-auto md:px-0 md:mx-0 md:flex-auto">
            <h1 className="text-pretty text-6xl font-semibold text-white">{stripHtml(programData["Name"])}</h1>
            <p className="mt-20 text-pretty text-lg font-light text-white sm:text-xl/8">{stripHtml(programData["Short description"])}</p>
          </div>
          <div className="px-6 mt-20 md:px-0 md:max-w-[380px] md:mt-0 md:shrink-0 md:grow justify-end-safe">
            <div className="bg-[var(--color-purple-100)] text-md text-white">
              <div className="grid grid-cols-2 gap-6 p-6">
                <div className="font-semibold">
                  <p>Credential:</p>
                </div>
                <div className="text-white">
                  <p>{stripHtml(programData["Program type"])}</p>
                </div>
                <div className="font-semibold">
                  <p>Program length:</p>
                </div>
                <div className="text-white">
                  <p>{stripHtml(programData["Duration"])}</p>
                </div>
                <div className="font-semibold">
                  <p>Area:</p>
                </div>
                <div className="text-white">
                  <p>{stripHtml(programData["Program area"])}</p>
                </div>
                <div className="font-semibold">
                  <p>School:</p>
                </div>
                <div className="text-white">
                  <p>{stripHtml(programData["School"])}</p>
                </div>
                <div className="font-semibold">
                  <p>Post-Graduation Work Permit:</p>
                </div>
                <p>{stripHtml(programData["PGWP"])}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Breadcrumb Navigation - Using the reusable component */}
      <Breadcrumb 
        items={breadcrumbItems} 
        variant="program"
        showHomeIcon={true}
      />
    </div>
  );
}

// Static paths generation for SSG:
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  // TODO: Replace with your real slug fetch from CMS/API
  return [{ slug: 'addiction-studies-diploma' }];
}

// Metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const programData = await getProgramData(slug);

  if (!programData) {
    return {
      title: 'Program Not Found',
    };
  }

  return {
    title: `${programData.Name} - ${programData["Program type"]} | Bow Valley College`,
    description: programData["Short description"],
    openGraph: {
      title: `${programData.Name} - ${programData["Program type"]}`,
      description: programData["Short description"],
      type: 'website',
    },
  };
}