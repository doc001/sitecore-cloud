import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import Link from 'next/link';

export const dynamic = 'force-static';

export async function generateMetadata() {
  return {
    title: 'Open Studies Courses – Bow Valley College',
    description:
      'Browse Open Studies courses at Bow Valley College. View descriptions, credits, course outlines, and available offerings.',
  };
}

// ─── Category mapping ────────────────────────────────────────────────────────

const CATEGORY_ORDER = [
  'Arts and Sciences',
  'Business',
  'Community Studies',
  'Extended Education',
  'Technology',
] as const;

type Category = (typeof CATEGORY_ORDER)[number];

const CATEGORY_BY_SISCODE: Record<string, Category> = {
  // Arts and Sciences
  ANAT: 'Arts and Sciences',
  BIOL: 'Arts and Sciences',
  CHEM: 'Arts and Sciences',
  CNST: 'Arts and Sciences',
  COMM: 'Arts and Sciences',
  ENGL: 'Arts and Sciences',
  FIPR: 'Arts and Sciences',
  INDG: 'Arts and Sciences',
  MATH: 'Arts and Sciences',
  PHIL: 'Arts and Sciences',
  PHYS: 'Arts and Sciences',
  POSC: 'Arts and Sciences',
  PSYC: 'Arts and Sciences',
  SOCI: 'Arts and Sciences',
  WGST: 'Arts and Sciences',
  // Business
  ACCT: 'Business',
  ADMN: 'Business',
  DESN: 'Business',
  ESPR: 'Business',
  FNSR: 'Business',
  HRES: 'Business',
  HUCL: 'Business',
  LEGL: 'Business',
  MGMT: 'Business',
  MKTG: 'Business',
  SCMT: 'Business',
  // Community Studies
  ADDC: 'Community Studies',
  DAST: 'Community Studies',
  EDAS: 'Community Studies',
  ELCC: 'Community Studies',
  FASD: 'Community Studies',
  HMSV: 'Community Studies',
  JUST: 'Community Studies',
  VOAS: 'Community Studies',
  // Technology
  DATA: 'Technology',
  SODV: 'Technology',
  TECH: 'Technology',
};

// PSYC1202 is specifically placed in Extended Education per the UAT site
const EXTENDED_EDUCATION_OVERRIDES = new Set(['PSYC1202']);

function getCategory(sisId: string): Category {
  if (EXTENDED_EDUCATION_OVERRIDES.has(sisId)) return 'Extended Education';
  const prefix = sisId.replace(/\d.*$/, '');
  return CATEGORY_BY_SISCODE[prefix] ?? 'Extended Education';
}

// ─── Data types ───────────────────────────────────────────────────────────────

interface RawCourse {
  sisId: string;
  name: string;
  description: string;
  credits: number;
}

interface CourseRow {
  sisId: string;
  name: string;
  description: string;
  credits: number;
  pdfUrl: string | null;
  category: Category;
}

// ─── PDF lookup ───────────────────────────────────────────────────────────────

const TERM_RANK: Record<string, number> = {
  Winter: 0,
  Spring: 1,
  Summer: 2,
  Fall: 3,
};

function parseTerm(filename: string): number {
  // filename format: SISID_Name_Term YYYY_Current.pdf
  const match = filename.match(/_([A-Za-z]+)\s+(\d{4})_Current\.pdf$/);
  if (!match) return 0;
  const [, season, year] = match;
  return parseInt(year) * 10 + (TERM_RANK[season] ?? 0);
}

function findCurrentPdf(sisId: string, allPdfs: string[]): string | null {
  const candidates = allPdfs.filter(
    (f) => f.startsWith(`${sisId}_`) && f.endsWith('_Current.pdf')
  );
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => parseTerm(b) - parseTerm(a));
  return `/data/course-outlines-pdf/${encodeURIComponent(candidates[0])}`;
}

// ─── Data loading ─────────────────────────────────────────────────────────────

function loadCourses(): CourseRow[] {
  const validPath = join(process.cwd(), 'src', 'data', 'osValidCourses.json');
  const pdfDir = join(process.cwd(), 'public', 'data', 'course-outlines-pdf');

  const validCourses: string[] = JSON.parse(readFileSync(validPath, 'utf8'));

  const allPdfs = existsSync(pdfDir)
    ? readdirSync(pdfDir).filter((f) => f.endsWith('.pdf'))
    : [];

  return validCourses
    .map((sisId): CourseRow | null => {
      const filePath = join(
        process.cwd(),
        'src',
        'data',
        'oScourses',
        `course-${sisId}.json`
      );
      if (!existsSync(filePath)) return null;

      const raw: RawCourse = JSON.parse(readFileSync(filePath, 'utf8'));

      return {
        sisId: raw.sisId,
        name: raw.name,
        description: raw.description ?? '',
        credits: raw.credits ?? 0,
        pdfUrl: findCurrentPdf(sisId, allPdfs),
        category: getCategory(sisId),
      };
    })
    .filter((c): c is CourseRow => c !== null)
    .sort((a, b) => a.sisId.localeCompare(b.sisId));
}

// ─── Components ───────────────────────────────────────────────────────────────

function PdfIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5"
      aria-hidden="true"
    >
      <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625Z" />
      <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
    </svg>
  );
}

function CourseTable({ courses }: { courses: CourseRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <th className="py-3 pr-4 w-28">Code</th>
            <th className="py-3 pr-4">Course</th>
            <th className="py-3 pr-4 w-20 text-center">Credits</th>
            <th className="py-3 w-14 text-center">PDF</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((course, i) => (
            <tr
              key={course.sisId}
              className={`border-b border-gray-100 align-top ${
                i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
              }`}
            >
              {/* Code → links to dynamic course page */}
              <td className="py-3 pr-4 font-mono font-semibold">
                <Link
                  href={`/study/open-studies/courses/${course.sisId}`}
                  className="text-[#005596] hover:underline"
                >
                  {course.sisId}
                </Link>
              </td>

              {/* Course name + description */}
              <td className="py-3 pr-4">
                <Link
                  href={`/study/open-studies/courses/${course.sisId}`}
                  className="font-medium text-gray-900 hover:text-[#005596] hover:underline"
                >
                  {course.name}
                </Link>
                {course.description && (
                  <p className="mt-1 text-xs text-gray-500 leading-relaxed line-clamp-3">
                    {course.description}
                  </p>
                )}
              </td>

              {/* Credits */}
              <td className="py-3 pr-4 text-center text-gray-700">
                {course.credits > 0 ? course.credits.toFixed(1) : '—'}
              </td>

              {/* PDF */}
              <td className="py-3 text-center">
                {course.pdfUrl ? (
                  <a
                    href={course.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`${course.name} course outline PDF`}
                    className="inline-flex items-center justify-center text-red-600 hover:text-red-800"
                  >
                    <PdfIcon />
                  </a>
                ) : (
                  <span className="text-gray-300">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CategoryAccordion({
  category,
  courses,
  defaultOpen,
}: {
  category: string;
  courses: CourseRow[];
  defaultOpen: boolean;
}) {
  return (
    <details
      className="group border border-gray-200 rounded-lg overflow-hidden"
      open={defaultOpen || undefined}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between bg-gray-50 px-5 py-4 hover:bg-gray-100 transition-colors">
        <div className="flex items-center gap-3">
          <span className="text-base font-semibold text-gray-900">
            {category}
          </span>
          <span className="rounded-full bg-[#005596]/10 px-2.5 py-0.5 text-xs font-medium text-[#005596]">
            {courses.length} {courses.length === 1 ? 'course' : 'courses'}
          </span>
        </div>
        {/* Chevron icon rotates when open */}
        <svg
          className="w-5 h-5 text-gray-500 transition-transform group-open:rotate-180"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </summary>
      <div className="px-5 py-4">
        <CourseTable courses={courses} />
      </div>
    </details>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OpenStudiesPage() {
  const courses = loadCourses();

  const grouped = CATEGORY_ORDER.reduce<Record<Category, CourseRow[]>>(
    (acc, cat) => {
      acc[cat] = courses.filter((c) => c.category === cat);
      return acc;
    },
    {} as Record<Category, CourseRow[]>
  );

  const totalCourses = courses.length;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Page header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
          Open Studies
        </h1>
        <p className="mt-3 text-lg text-gray-600">
          Take individual courses without being enrolled in a full program.
          Browse {totalCourses} available courses below.
        </p>
      </header>

      {/* Accordion sections */}
      <div className="space-y-3">
        {CATEGORY_ORDER.map((cat, idx) => {
          const catCourses = grouped[cat];
          if (catCourses.length === 0) return null;
          return (
            <CategoryAccordion
              key={cat}
              category={cat}
              courses={catCourses}
              defaultOpen={idx === 0}
            />
          );
        })}
      </div>
    </main>
  );
}
