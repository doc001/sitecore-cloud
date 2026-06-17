import { notFound } from "next/navigation";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

export const dynamic = 'force-static';
export const dynamicParams = false;

// ─── Raw JSON interfaces ──────────────────────────────────────────────────────

interface RawFeeDetail {
  amount: number;
  tax: number;
  feeType: string;
}

interface RawTimeBlock {
  sisId: string;
  frequency: string;
  startTime: string;
  endTime: string;
  schedule: string;
}

interface RawSection {
  id: string;
  name: string;
  sisId: string;
  deliveryType: string;
  startDate: string;
  endDate: string;
  seatsAvailable: boolean;
  campus: string;
  credits: number;
  hours: number;
  registrationStart: string;
  registrationEnd: string;
  fees: {
    domestic: RawFeeDetail;
    international: RawFeeDetail;
  };
  timeBlocks: RawTimeBlock[];
}

interface RawCourseFile {
  id: string;
  sisId: string;
  name: string;
  description: string;
  credits: number;
  sections: RawSection[];
}

interface LookupEntry {
  id: string;
  name: string;
  displayName: string;
  slug: string;
}

interface SisLookup {
  lookups: {
    deliveryTypes: { byId: Record<string, LookupEntry> };
    campuses: { byId: Record<string, LookupEntry> };
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeGuid(raw: string): string {
  return raw.replace(/[{}\-]/g, '').toUpperCase();
}

function formatDate(dateString: string): string {
  if (!dateString) return '—';
  try {
    const y = dateString.substring(0, 4);
    const m = dateString.substring(4, 6);
    const d = dateString.substring(6, 8);
    return new Date(`${y}-${m}-${d}`).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
  }).format(amount);
}

// ─── Data loading ─────────────────────────────────────────────────────────────

function loadValidCourses(): string[] {
  const filePath = join(process.cwd(), 'src', 'data', 'osValidCourses.json');
  if (!existsSync(filePath)) return ['no-courses-available'];
  const parsed: unknown = JSON.parse(readFileSync(filePath, 'utf8'));
  if (!Array.isArray(parsed) || parsed.length === 0) return ['no-courses-available'];
  return parsed.filter((c): c is string => typeof c === 'string' && c.trim().length > 0);
}

function loadLookup(): SisLookup | null {
  const filePath = join(process.cwd(), 'src', 'data', 'sis-data-lookup.json');
  if (!existsSync(filePath)) return null;
  return JSON.parse(readFileSync(filePath, 'utf8')) as SisLookup;
}

function loadCourse(sisID: string): RawCourseFile | null {
  if (sisID === 'no-courses-available') return null;
  const filePath = join(process.cwd(), 'src', 'data', 'oScourses', `course-${sisID}.json`);
  if (!existsSync(filePath)) return null;
  const data = JSON.parse(readFileSync(filePath, 'utf8')) as RawCourseFile;
  if (!data?.sisId || !Array.isArray(data.sections)) return null;
  return data;
}

// ─── Static params ────────────────────────────────────────────────────────────

export async function generateStaticParams(): Promise<{ sisID: string }[]> {
  const courses = loadValidCourses();
  return courses.map((sisID) => ({ sisID: sisID.trim() }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sisID: string }>;
}) {
  const { sisID } = await params;
  const course = loadCourse(sisID);
  if (!course) return { title: 'Course Not Found' };
  return {
    title: `${course.name} (${course.sisId}) – Open Studies`,
    description: course.description?.slice(0, 160),
  };
}

// ─── Components ───────────────────────────────────────────────────────────────

function Badge({ children, color = 'blue' }: { children: React.ReactNode; color?: 'blue' | 'green' | 'gray' | 'red' }) {
  const styles: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    gray: 'bg-gray-100 text-gray-700',
    red: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[color]}`}>
      {children}
    </span>
  );
}

function SectionCard({
  section,
  deliveryName,
  campusName,
}: {
  section: RawSection;
  deliveryName: string;
  campusName: string;
}) {
  const hasSchedule = section.timeBlocks.length > 0;
  const domesticFee = section.fees?.domestic?.amount ?? 0;
  const intlFee = section.fees?.international?.amount ?? 0;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      {/* Section header */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{section.name}</h3>
          <p className="text-sm text-gray-500">SIS ID: {section.sisId}</p>
        </div>
        <Badge color={section.seatsAvailable ? 'green' : 'red'}>
          {section.seatsAvailable ? 'Seats Available' : 'Full'}
        </Badge>
      </div>

      {/* Details grid */}
      <dl className="mb-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="font-medium text-gray-500">Delivery</dt>
          <dd className="mt-0.5 text-gray-900">{deliveryName}</dd>
        </div>
        <div>
          <dt className="font-medium text-gray-500">Campus</dt>
          <dd className="mt-0.5 text-gray-900">{campusName}</dd>
        </div>
        <div>
          <dt className="font-medium text-gray-500">Hours</dt>
          <dd className="mt-0.5 text-gray-900">{section.hours > 0 ? `${section.hours} hrs` : '—'}</dd>
        </div>
        <div>
          <dt className="font-medium text-gray-500">Start Date</dt>
          <dd className="mt-0.5 text-gray-900">{formatDate(section.startDate)}</dd>
        </div>
        <div>
          <dt className="font-medium text-gray-500">End Date</dt>
          <dd className="mt-0.5 text-gray-900">{formatDate(section.endDate)}</dd>
        </div>
        {section.registrationStart && (
          <div>
            <dt className="font-medium text-gray-500">Registration Opens</dt>
            <dd className="mt-0.5 text-gray-900">{formatDate(section.registrationStart)}</dd>
          </div>
        )}
      </dl>

      {/* Schedule */}
      {hasSchedule && (
        <div className="mb-4">
          <p className="mb-1 text-sm font-medium text-gray-500">Schedule</p>
          <ul className="space-y-0.5">
            {section.timeBlocks.map((tb) => (
              <li key={tb.sisId} className="text-sm text-gray-800">
                {tb.schedule}
                <span className="ml-2 text-xs text-gray-400">{tb.frequency}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Fees */}
      <div className="flex flex-wrap gap-3 border-t border-gray-100 pt-4">
        {domesticFee > 0 && (
          <div className="rounded-md bg-blue-50 px-4 py-2 text-center">
            <div className="text-xs font-medium text-blue-600">Domestic</div>
            <div className="text-lg font-bold text-blue-800">{formatCurrency(domesticFee)}</div>
          </div>
        )}
        {intlFee > 0 && (
          <div className="rounded-md bg-purple-50 px-4 py-2 text-center">
            <div className="text-xs font-medium text-purple-600">International</div>
            <div className="text-lg font-bold text-purple-800">{formatCurrency(intlFee)}</div>
          </div>
        )}
        {domesticFee === 0 && intlFee === 0 && (
          <p className="text-sm text-gray-400 italic">Fee information not available</p>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CoursePage({
  params,
}: {
  params: Promise<{ sisID: string }>;
}) {
  const { sisID } = await params;

  if (sisID === 'no-courses-available') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900">No Courses Available</h1>
        <p className="mt-3 text-gray-600">Course data is being updated. Please check back soon.</p>
      </div>
    );
  }

  const validCourses = loadValidCourses();
  if (!validCourses.includes(sisID)) return notFound();

  const course = loadCourse(sisID);
  if (!course) return notFound();

  const lookup = loadLookup();
  const deliveryById = lookup?.lookups?.deliveryTypes?.byId ?? {};
  const campusById = lookup?.lookups?.campuses?.byId ?? {};

  function resolveDelivery(raw: string): string {
    const key = normalizeGuid(raw);
    return deliveryById[key]?.displayName ?? 'On-campus';
  }

  function resolveCampus(raw: string): string {
    const key = normalizeGuid(raw);
    return campusById[key]?.displayName ?? 'BVC Campus';
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Course header */}
      <header className="mb-8 border-b border-gray-200 pb-6">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge color="blue">{course.sisId}</Badge>
          {course.credits > 0 && (
            <Badge color="gray">{course.credits} {course.credits === 1 ? 'credit' : 'credits'}</Badge>
          )}
        </div>
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">{course.name}</h1>
        {course.description && (
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-gray-600">
            {course.description}
          </p>
        )}
      </header>

      {/* Sections */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Available Sections
          <span className="ml-2 text-base font-normal text-gray-500">
            ({course.sections.length})
          </span>
        </h2>

        {course.sections.length === 0 ? (
          <p className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-gray-500 text-center">
            No sections are currently scheduled for this course.
          </p>
        ) : (
          <div className="space-y-4">
            {course.sections.map((section) => (
              <SectionCard
                key={section.id}
                section={section}
                deliveryName={resolveDelivery(section.deliveryType)}
                campusName={resolveCampus(section.campus)}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
