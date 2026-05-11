// src/app/study/open-studies/courses/[sisID]/page.tsx
import { notFound } from "next/navigation";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

export const dynamic = 'force-static';
export const dynamicParams = false;

// ---------------------------------------------------------------------------
// Types — every CMS-sourced reference field is explicitly nullable
// ---------------------------------------------------------------------------

interface DeliveryType {
  id: string;
  name: string;
  displayName: string;
  slug: string;
}

interface Campus {
  id: string;
  name: string;
  displayName: string;
  slug: string;
}

interface FeeType {
  id: string;
  name: string;
  displayName: string;
  slug: string;
}

interface TimeBlock {
  id: string;
  name: string;
  displayName: string;
  startTime: string;
  endTime: string;
  sisId: string;
}

interface Fee {
  containerName: string;
  feeItemName: string;
  feeTypeId: string;
  feeType: FeeType | null;      // null when CMS reference unresolved
  amount: string;
  timeBlock: TimeBlock | null;  // null when CMS reference unresolved
  day: string;
}

interface CourseOffering {
  id: string;
  name: string;
  sisID: string;
  courseName: string;
  deliveryTypeId: string;
  campusId: string;
  deliveryType: DeliveryType | null;  // null when CMS reference unresolved
  campus: Campus | null;              // null when CMS reference unresolved
  hours: string;
  registrationStart: string;
  registrationEnd: string;
  startDate: string;
  endDate: string;
  seatsAvailable: string;
  fees: Fee[];
  feesSummary: {
    totalFees: number;
    containers: string[];
    feeTypes: string[];
    timeBlockCount: number;
  };
}

interface CourseData {
  metadata: {
    generatedAt: string;
    version: string;
    source: string;
    sisID: string;
    courseName: string;
  };
  course: {
    id: string;
    sisID: string;
    name: string;
    children: CourseOffering[];
    summary: {
      totalSections: number;
      totalFees: number;
      totalTimeBlocks: number;
      sectionsWithFees: number;
    };
  };
}

// ---------------------------------------------------------------------------
// Sanitisation layer
// Normalises every nullable CMS field to a safe default ONCE at load time.
// All downstream rendering code is therefore guaranteed null-free.
// ---------------------------------------------------------------------------

function sanitiseFeeType(raw: FeeType | null | undefined): FeeType | null {
  if (!raw || typeof raw !== 'object') return null;
  return {
    id: raw.id ?? '',
    name: raw.name ?? '',
    displayName: raw.displayName ?? raw.name ?? '',
    slug: raw.slug ?? '',
  };
}

function sanitiseTimeBlock(raw: TimeBlock | null | undefined): TimeBlock | null {
  if (!raw || typeof raw !== 'object') return null;
  return {
    id: raw.id ?? '',
    name: raw.name ?? '',
    displayName: raw.displayName ?? raw.name ?? '',
    startTime: raw.startTime ?? '',
    endTime: raw.endTime ?? '',
    sisId: raw.sisId ?? '',
  };
}

function sanitiseFee(raw: Fee): Fee {
  return {
    containerName: raw.containerName ?? '',
    feeItemName: raw.feeItemName ?? '',
    feeTypeId: raw.feeTypeId ?? '',
    feeType: sanitiseFeeType(raw.feeType),
    amount: raw.amount ?? '0',
    timeBlock: sanitiseTimeBlock(raw.timeBlock),
    day: raw.day ?? '',
  };
}

function sanitiseDeliveryType(raw: DeliveryType | null | undefined): DeliveryType | null {
  if (!raw || typeof raw !== 'object') return null;
  return {
    id: raw.id ?? '',
    name: raw.name ?? '',
    displayName: raw.displayName ?? raw.name ?? '',
    slug: raw.slug ?? '',
  };
}

function sanitiseCampus(raw: Campus | null | undefined): Campus | null {
  if (!raw || typeof raw !== 'object') return null;
  return {
    id: raw.id ?? '',
    name: raw.name ?? '',
    displayName: raw.displayName ?? raw.name ?? '',
    slug: raw.slug ?? '',
  };
}

function sanitiseOffering(raw: CourseOffering): CourseOffering {
  return {
    id: raw.id ?? '',
    name: raw.name ?? '',
    sisID: raw.sisID ?? '',
    courseName: raw.courseName ?? '',
    deliveryTypeId: raw.deliveryTypeId ?? '',
    campusId: raw.campusId ?? '',
    deliveryType: sanitiseDeliveryType(raw.deliveryType),
    campus: sanitiseCampus(raw.campus),
    hours: raw.hours ?? '',
    registrationStart: raw.registrationStart ?? '',
    registrationEnd: raw.registrationEnd ?? '',
    startDate: raw.startDate ?? '',
    endDate: raw.endDate ?? '',
    seatsAvailable: raw.seatsAvailable ?? '0',
    fees: Array.isArray(raw.fees) ? raw.fees.map(sanitiseFee) : [],
    feesSummary: raw.feesSummary ?? {
      totalFees: 0,
      containers: [],
      feeTypes: [],
      timeBlockCount: 0,
    },
  };
}

function sanitiseCourseData(raw: CourseData): CourseData {
  return {
    metadata: {
      generatedAt: raw.metadata?.generatedAt ?? new Date().toISOString(),
      version: raw.metadata?.version ?? '?',
      source: raw.metadata?.source ?? '?',
      sisID: raw.metadata?.sisID ?? '',
      courseName: raw.metadata?.courseName ?? '',
    },
    course: {
      id: raw.course?.id ?? '',
      sisID: raw.course?.sisID ?? '',
      name: raw.course?.name ?? '',
      children: Array.isArray(raw.course?.children)
        ? raw.course.children.map(sanitiseOffering)
        : [],
      summary: raw.course?.summary ?? {
        totalSections: 0,
        totalFees: 0,
        totalTimeBlocks: 0,
        sectionsWithFees: 0,
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Data loading
// ---------------------------------------------------------------------------

function loadValidCoursesWithFallback(): { courses: string[]; hasFallback: boolean } {
  try {
    const filePath = join(process.cwd(), 'src', 'data', 'osValidCourses.json');
    if (!existsSync(filePath)) {
      console.warn('⚠️ osValidCourses.json not found, using fallback');
      return { courses: ['no-courses-available'], hasFallback: true };
    }
    const fileContent = readFileSync(filePath, 'utf8');
    if (!fileContent.trim()) {
      console.warn('⚠️ osValidCourses.json is empty, using fallback');
      return { courses: ['no-courses-available'], hasFallback: true };
    }
    const validCourses = JSON.parse(fileContent);
    if (!Array.isArray(validCourses)) {
      console.error('❌ osValidCourses.json is not an array, using fallback');
      return { courses: ['no-courses-available'], hasFallback: true };
    }
    const filtered = validCourses.filter(
      (c) => c && typeof c === 'string' && c.trim().length > 0
    );
    if (filtered.length === 0) {
      console.warn('⚠️ No valid courses in osValidCourses.json, using fallback');
      return { courses: ['no-courses-available'], hasFallback: true };
    }
    console.log(`✅ Loaded ${filtered.length} valid courses for SSG`);
    return { courses: filtered, hasFallback: false };
  } catch (error) {
    console.error('❌ Error loading osValidCourses.json:', error);
    return { courses: ['no-courses-available'], hasFallback: true };
  }
}

export async function generateStaticParams(): Promise<{ sisID: string }[]> {
  console.log('🚀 generateStaticParams called for course pages');
  const { courses, hasFallback } = loadValidCoursesWithFallback();
  if (hasFallback) console.log('📦 Using fallback page for empty course data');
  const params = courses.map((sisID) => ({ sisID: sisID.trim() }));
  console.log(`📦 Generated ${params.length} static params`);
  return params;
}

function loadCourseData(sisID: string): CourseData | null {
  if (sisID === 'no-courses-available') {
    return sanitiseCourseData({
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '1.0.0',
        source: 'fallback',
        sisID: 'no-courses-available',
        courseName: 'No Courses Available',
      },
      course: {
        id: 'fallback',
        sisID: 'no-courses-available',
        name: 'Course Information Currently Unavailable',
        children: [],
        summary: { totalSections: 0, totalFees: 0, totalTimeBlocks: 0, sectionsWithFees: 0 },
      },
    });
  }
  try {
    const filePath = join(
      process.cwd(),
      'src',
      'data',
      'oScourses',
      `course-${sisID}.json`
    );
    if (!existsSync(filePath)) {
      console.error(`❌ Not found: course-${sisID}.json`);
      return null;
    }
    const fileContent = readFileSync(filePath, 'utf8');
    if (!fileContent.trim()) {
      console.error(`❌ Empty file: course-${sisID}.json`);
      return null;
    }
    // sanitiseCourseData normalises every nullable CMS field before any render code runs
    return sanitiseCourseData(JSON.parse(fileContent) as CourseData);
  } catch (error) {
    console.error(`❌ Failed to load course-${sisID}.json:`, error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Display helpers
// Safe because sanitiseCourseData already ran — no null checks needed here.
// ---------------------------------------------------------------------------

function formatDate(dateString: string): string {
  if (!dateString) return 'N/A';
  try {
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    return new Date(`${year}-${month}-${day}`).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

function convertDayNumberToName(dayNumber: string | number): string {
  const map: Record<string, string> = {
    '1': 'Monday', '2': 'Tuesday', '3': 'Wednesday',
    '4': 'Thursday', '5': 'Friday', '6': 'Saturday',
  };
  return map[dayNumber.toString()] ?? `Day ${dayNumber}`;
}

function formatTimeBlock(timeString: string): string {
  if (!timeString || !timeString.includes('T')) return timeString;
  try {
    const tp = timeString.split('T')[1];
    if (!tp || tp.length < 4) return timeString;
    const hours = parseInt(tp.substring(0, 2));
    const minutes = parseInt(tp.substring(2, 4));
    const period = hours >= 12 ? 'PM' : 'AM';
    const h = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const m = minutes > 0 ? `:${minutes.toString().padStart(2, '0')}` : '';
    return `${h}${m} ${period} MST`;
  } catch {
    return timeString;
  }
}

function getDeliveryTypeName(offering: CourseOffering): string {
  return offering.deliveryType?.displayName || offering.deliveryType?.name || '';
}

function getCampusName(offering: CourseOffering): string {
  return offering.campus?.displayName || offering.campus?.name || '';
}

function getFeeLabel(fee: Fee): string {
  return fee.feeType?.displayName || fee.feeType?.name || fee.feeItemName || 'Course Fee';
}

function getFeeSubLabel(fee: Fee): string | null {
  const display = fee.feeType?.displayName;
  const item = fee.feeItemName;
  if (display && item && display !== item) return item;
  return null;
}

function isValidFeeAmount(amount: string): boolean {
  const n = parseFloat(amount);
  return !isNaN(n) && n > 0;
}

function findTuitionFee(fees: Fee[]): Fee | null {
  const valid = fees.filter(
    (f) => f.containerName === 'Fees' && isValidFeeAmount(f.amount)
  );
  if (valid.length === 0) return null;
  return (
    valid.find(
      (f) =>
        f.feeType?.slug?.toLowerCase().includes('tuition') ||
        f.feeType?.name?.toLowerCase().includes('tuition') ||
        f.feeItemName?.toLowerCase().includes('tuition')
    ) ?? valid[0]
  );
}

function findTimeBlockInfo(
  fees: Fee[]
): { day: string; startTime: string; endTime: string } | null {
  const entry = fees.find(
    (f) =>
      f.containerName === 'TimeBlock' &&
      f.timeBlock?.startTime &&
      f.timeBlock?.endTime
  );
  if (!entry?.timeBlock) return null;
  return {
    day: entry.day,
    startTime: formatTimeBlock(entry.timeBlock.startTime),
    endTime: formatTimeBlock(entry.timeBlock.endTime),
  };
}

function calculateTotalFees(fees: Fee[]): number {
  return fees
    .filter((f) => f.containerName === 'Fees')
    .reduce((total, f) => total + (parseFloat(f.amount) || 0), 0);
}

// ---------------------------------------------------------------------------
// UI components
// ---------------------------------------------------------------------------

function MissingDataBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5 text-xs font-medium">
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        />
      </svg>
      {label}
    </span>
  );
}

function TimeBlockDetails({
  info,
}: {
  info: { day: string; startTime: string; endTime: string };
}) {
  return (
    <div className="mt-2 space-y-1 text-sm">
      {info.day && (
        <div className="text-gray-600">
          <span className="font-medium">Day:</span> {convertDayNumberToName(info.day)}
        </div>
      )}
      <div className="text-gray-600">
        <span className="font-medium">Time:</span> {info.startTime} – {info.endTime}
      </div>
    </div>
  );
}

function NoCoursesAvailablePage() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="text-center py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">No Courses Available</h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Course information is currently being updated. Please check back later for available
          course offerings.
        </p>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            {
              title: 'Coming Soon',
              body: 'New courses are being added regularly. Check back for updates.',
            },
            {
              title: 'Stay Informed',
              body: 'Sign up for notifications about new course offerings and registration dates.',
            },
            {
              title: 'Need Help?',
              body: 'Contact our academic advisors for guidance on course planning.',
            },
          ].map(({ title, body }) => (
            <div key={title} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-gray-600 text-sm">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function CoursePage({
  params,
}: {
  params: Promise<{ sisID: string }>;
}) {
  const { sisID } = await params;

  if (sisID === 'no-courses-available') {
    return <NoCoursesAvailablePage />;
  }

  const { courses } = loadValidCoursesWithFallback();
  if (!courses.includes(sisID)) {
    console.warn(`⚠️ sisID ${sisID} not in valid courses list`);
    return notFound();
  }

  const courseData = loadCourseData(sisID);

  if (!courseData?.course?.children?.length) {
    console.warn(`⚠️ No offerings for ${sisID}`);
    return notFound();
  }

  const { course } = courseData;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.name}</h1>
        <div className="text-lg text-gray-600">
          SIS ID: <span className="font-semibold">{course.sisID}</span>
        </div>
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Course Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Total Sections:</span> {course.summary.totalSections}
            </div>
            <div>
              <span className="font-medium">Sections with Fees:</span>{' '}
              {course.summary.sectionsWithFees}
            </div>
            <div>
              <span className="font-medium">Total Fee Items:</span> {course.summary.totalFees}
            </div>
            <div>
              <span className="font-medium">Time Blocks:</span> {course.summary.totalTimeBlocks}
            </div>
          </div>
        </div>
      </div>

      {/* Offerings */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">Available Course Sections</h2>
        <div className="space-y-6">
          {course.children.map((offering) => {
            const tuitionFee = findTuitionFee(offering.fees);
            const timeBlockInfo = findTimeBlockInfo(offering.fees);
            const totalFees = calculateTotalFees(offering.fees);
            const additionalFees = offering.fees.filter(
              (f) =>
                f.containerName === 'Fees' && f !== tuitionFee && isValidFeeAmount(f.amount)
            );
            const deliveryTypeName = getDeliveryTypeName(offering);
            const campusName = getCampusName(offering);

            return (
              <div
                key={offering.id}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                {/* Section header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{offering.name}</h3>
                    <p className="text-gray-600">Section SIS ID: {offering.sisID}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Seats Available</div>
                    <div className="text-lg font-semibold text-green-600">
                      {offering.seatsAvailable}
                    </div>
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div>
                    <span className="font-medium text-gray-700">Delivery Type:</span>
                    <br />
                    {deliveryTypeName ? (
                      <span className="text-gray-600">{deliveryTypeName}</span>
                    ) : (
                      <MissingDataBadge label="Not resolved" />
                    )}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Campus:</span>
                    <br />
                    {campusName ? (
                      <span className="text-gray-600">{campusName}</span>
                    ) : (
                      <MissingDataBadge label="Not resolved" />
                    )}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Hours:</span>
                    <br />
                    <span className="text-gray-600">{offering.hours || 'N/A'}</span>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="font-medium text-gray-700">Registration Period:</span>
                    <br />
                    {offering.registrationStart || offering.registrationEnd ? (
                      <span className="text-gray-600">
                        {formatDate(offering.registrationStart)} →{' '}
                        {formatDate(offering.registrationEnd)}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic text-sm">
                        Registration dates not set
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Course Dates:</span>
                    <br />
                    <span className="text-gray-600">
                      {formatDate(offering.startDate)} → {formatDate(offering.endDate)}
                    </span>
                  </div>
                </div>

                {/* Primary fee */}
                {tuitionFee ? (
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Primary Fee</h4>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <span className="text-gray-700 text-base block">
                          {getFeeLabel(tuitionFee)}
                        </span>
                        {getFeeSubLabel(tuitionFee) && (
                          <span className="text-sm text-gray-500">
                            ({getFeeSubLabel(tuitionFee)})
                          </span>
                        )}
                        {timeBlockInfo && <TimeBlockDetails info={timeBlockInfo} />}
                      </div>
                      <span className="text-xl font-bold text-blue-600 ml-4">
                        ${parseFloat(tuitionFee.amount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ) : offering.fees.some((f) => f.containerName === 'Fees') ? (
                  <div className="bg-amber-50 p-4 rounded-lg mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Fee Information</h4>
                    <p className="text-amber-700 text-sm mb-3">
                      No standard tuition fee found. Showing all available fees:
                    </p>
                    <div className="space-y-3">
                      {offering.fees
                        .filter((f) => f.containerName === 'Fees')
                        .map((fee, idx) => (
                          <div key={idx} className="flex justify-between items-start">
                            <div className="flex-1">
                              <span className="text-gray-700 text-sm block">
                                {getFeeLabel(fee)}
                              </span>
                              {timeBlockInfo && (
                                <div className="mt-1 space-y-1 text-xs text-gray-600">
                                  {timeBlockInfo.day && (
                                    <div>
                                      <span className="font-medium">Day:</span>{' '}
                                      {convertDayNumberToName(timeBlockInfo.day)}
                                    </div>
                                  )}
                                  <div>
                                    <span className="font-medium">Time:</span>{' '}
                                    {timeBlockInfo.startTime} – {timeBlockInfo.endTime}
                                  </div>
                                </div>
                              )}
                            </div>
                            <span className="font-medium text-sm ml-4">
                              {isValidFeeAmount(fee.amount)
                                ? `$${parseFloat(fee.amount).toFixed(2)}`
                                : 'Amount TBD'}
                            </span>
                          </div>
                        ))}
                    </div>
                    {totalFees > 0 && (
                      <div className="mt-3 pt-3 border-t border-amber-200 flex justify-between font-semibold">
                        <span>Total:</span>
                        <span>${totalFees.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Fee Information</h4>
                    <p className="text-gray-500 italic">
                      No fee information available for this section. Please contact the registrar
                      for pricing details.
                    </p>
                  </div>
                )}

                {/* Additional fees */}
                {additionalFees.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Additional Fees</h4>
                    <div className="space-y-3">
                      {additionalFees.map((fee, idx) => (
                        <div key={idx} className="flex justify-between items-start">
                          <div className="flex-1">
                            <span className="text-gray-600 text-sm block">
                              {getFeeLabel(fee)}
                            </span>
                            {timeBlockInfo && (
                              <div className="mt-1 space-y-1 text-xs text-gray-500">
                                {timeBlockInfo.day && (
                                  <div>
                                    <span className="font-medium">Day:</span>{' '}
                                    {convertDayNumberToName(timeBlockInfo.day)}
                                  </div>
                                )}
                                <div>
                                  <span className="font-medium">Time:</span>{' '}
                                  {timeBlockInfo.startTime} – {timeBlockInfo.endTime}
                                </div>
                              </div>
                            )}
                          </div>
                          <span className="font-medium text-sm ml-4">
                            ${parseFloat(fee.amount).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                    {tuitionFee && (
                      <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between font-semibold text-sm">
                        <span>Total Cost:</span>
                        <span>
                          $
                          {(
                            parseFloat(tuitionFee.amount) +
                            additionalFees.reduce((s, f) => s + parseFloat(f.amount), 0)
                          ).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-gray-200 text-sm text-gray-500">
        <p>
          Data generated: {new Date(courseData.metadata.generatedAt).toLocaleString()} |{' '}
          Version: {courseData.metadata.version} | Source: {courseData.metadata.source}
        </p>
      </div>
    </div>
  );
}