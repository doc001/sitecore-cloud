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

export default async function ProgramPage({ params }: { params: { slug: string } }) {
   // Get breadcrumb data for the current page using navigation structure
  const breadcrumbItems = await getBreadcrumbData('/program-list');

  const programData = await getProgramData(params.slug);

  if (!programData) notFound();

  const coursesData = parseCoursesData(programData["Courses HTML"]);
  const tuitionData = parseTuitionData(programData["Tuition fees"]);
  const intakeData = parseIntakeData(programData["Availabe intakes"]);

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header Section */}
<section className="mx-auto bg-program-gradient pt-32 pb-24">
    <div className="md:flex md:items-center md:gap-x-10 md:px-[10%]">
        <div className="mx-auto md:max-w-4/6 md:mx-0 md:flex-auto">
            <h1 className="text-pretty text-6xl font-semibold text-white">{stripHtml(programData["Name"])}</h1>
            <p className="mt-20 text-pretty text-lg font-light text-white sm:text-xl/8">{stripHtml(programData["Short description"])}</p>
        </div>
        <div className="mt-20 md:max-w-[380px] md:mt-0 md:shrink-0 md:grow grid grid-flow-col justify-items-end">
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
      
      <Breadcrumb 
        items={breadcrumbItems} 
        variant="program"
        showHomeIcon={true}
      />

    <div className="text-zinc-800 gap-x-11 auto-cols-fr grid-cols-[938.1px_234.525px] grid-rows-[161.88rem] justify-center pb-5 gap-y-5 grid">
      <main className="items-start flex-col justify-start flex">
        {/* About */}
        <section id="About" className="items-start border-b-slate-400 border-b-2 flex-col justify-start pb-8 border-dashed">
          <h3 className="text-blue-950 text-4xl font-semibold">About</h3>
          <p>{stripHtml(programData["Program Description"])}</p>
        </section>

        {/* Admission Requirements */}
        <section id="Admission-and-requirements" className="items-start border-b-slate-400 border-b-2 flex-col justify-start pb-8 border-dashed">
          <h3 className="text-blue-950 text-4xl font-semibold">Admission requirements</h3>
          {/* Admission content (same as your original) */}
          {/* For brevity, insert your full JSX here */}
        </section>

        {/* Available Intakes */}
        <section id="Available-intakes" className="items-start flex-col justify-start mb-8">
          <h3 className="text-blue-950 text-4xl font-semibold">Available intakes</h3>
          {/* Intake data table */}
          {/* Insert your JSX here */}
        </section>

        {/* Tuition and Fees */}
        <section id="Tuition-and-Fees" className="items-start flex-col justify-start mb-8">
          <h3 className="text-blue-950 text-4xl font-semibold">Tuition and fees</h3>
          {/* Tuition data table */}
          {/* Insert your JSX here */}
        </section>

        {/* Courses */}
        <section id="Courses">
          <h3 className="text-blue-950 text-4xl font-semibold">Courses</h3>
          <div className="items-stretch auto-cols-fr grid-cols-[469.05px_469.05px] grid-rows-[1.75rem] justify-center pb-3 grid">
            <div className="items-stretch float-left justify-center justify-self-start flex">
              <p className="text-indigo-600 text-2xl pl-2">hide_source</p> Zero Textbook Cost
            </div>
            <div className="items-stretch justify-center justify-self-end flex">
              <p className="text-indigo-600 text-2xl pl-2">move_down</p> Course is eligible for PLAR
            </div>
          </div>
          <div>
            {coursesData.map((termData) => (
              <div key={termData.termNumber} className="mb-3">
                <button className="text-white bg-sky-500 bg-[linear-gradient(101deg,_rgba(3,_26,_98,_0.4),_rgba(255,_255,_255,_0.2))] cursor-pointer py-1 pl-4 pr-1.5 inline-block w-full h-10">
                  Term {termData.termNumber}
                </button>
                <CourseTable courses={termData.courses} additionalText={termData.additionalText} />
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Sidebar */}
      <aside className="items-start flex-col justify-start flex">
        <nav className="bg-zinc-100 items-stretch flex-col float-right pb-6 px-4 pt-4 sticky z-[200] top-4">
          <div className="text-blue-950 font-medium">{programData.Name}</div>
          <a className="text-indigo-900 flex-col text-sm py-1 pl-2 pr-1 flex" href="#About">About</a>
          <a className="text-indigo-900 flex-col text-sm py-1 pl-2 pr-1 flex" href="#Admission-and-requirements">Admissions</a>
          <a className="text-indigo-900 flex-col text-sm py-1 pl-2 pr-1 flex" href="#Available-intakes">Available intakes</a>
          <a className="text-indigo-900 flex-col text-sm py-1 pl-2 pr-1 flex" href="#Tuition-and-Fees">Tuition and fees</a>
          <a className="text-indigo-900 flex-col text-sm py-1 pl-2 pr-1 flex" href="#Courses">Courses</a>
          <Link
            href="/apply/ready-to-apply"
            className="text-white bg-blue-500 bg-[linear-gradient(90deg,_rgb(106,_76,_215),_rgb(0,_163,_255))] font-medium py-3 px-5 rounded-lg mt-4"
          >
            I am ready to apply
          </Link>
        </nav>
      </aside>
    </div>
    </div>
  );
}

// Static paths generation for SSG:
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  // TODO: Replace with your real slug fetch from CMS/API
  return [{ slug: 'addiction-studies-diploma' }];
}

// Metadata for SEO
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const programData = await getProgramData(params.slug);

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
