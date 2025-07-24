// src/app/study/extended-education/courses/[sisID]/page.tsx
import { notFound } from "next/navigation";
import {
  getAvailableCourseSISIds,
  loadCourseData,
  formatDate,
  convertDayNumberToName,
  findTuitionFee,
  findTimeBlockInfo,
  calculateTotalFees,
  isValidFeeAmount,
  type CourseData,
  type CourseOffering,
  type Fee
} from "@/lib/courseUtils";

// Static generation - no revalidation needed for static files
export const dynamic = 'force-static';

/**
 * Generate static params for all valid course SIS IDs that have corresponding JSON files
 * This ensures only courses with actual data get pre-built at build time
 */
export async function generateStaticParams(): Promise<{ sisID: string }[]> {
  // Use utility function to get only courses with valid data files
  const availableCourses = getAvailableCourseSISIds();
  
  return availableCourses.map((sisID) => ({ sisID }));
}

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ sisID: string }>;
}) {
  const { sisID } = await params;
  const courseData = loadCourseData(sisID);

  if (!courseData) {
    return {
      title: `Course ${sisID} - Not Found`,
      description: `Course ${sisID} information is not available.`
    };
  }

  return {
    title: `${courseData.course.name} (${sisID}) - Extended Education`,
    description: `View course sections, schedules, and fees for ${courseData.course.name}. ${courseData.course.summary.totalSections} sections available.`,
    openGraph: {
      title: `${courseData.course.name} (${sisID})`,
      description: `${courseData.course.summary.totalSections} sections available for ${courseData.course.name}`,
    }
  };
}

/**
 * Main page component - Course detail page
 * Optimized for SSG builds with proper error handling
 */
export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ sisID: string }>;
}) {
  const { sisID } = await params;

  // Load course data using utility function
  const courseData = loadCourseData(sisID);

  // Return 404 if no valid course data found
  if (!courseData?.course) {
    return notFound();
  }

  const { course } = courseData;

  return (
    <div className="container-layout min-h-screen">
      {/* Course Header */}
      <header className="mb-12">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {course.name}
          </h1>
          <div className="text-xl text-gray-600 mb-4">
            SIS ID: <span className="font-semibold text-blue-600">{course.sisID}</span>
          </div>
        </div>
        
        {/* Course Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {course.summary.totalSections}
            </div>
            <div className="text-sm font-medium text-blue-800">Total Sections</div>
          </div>
          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {course.summary.sectionsWithFees}
            </div>
            <div className="text-sm font-medium text-green-800">Sections with Fees</div>
          </div>
          <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {course.summary.totalFees}
            </div>
            <div className="text-sm font-medium text-purple-800">Total Fee Items</div>
          </div>
          <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {course.summary.totalTimeBlocks}
            </div>
            <div className="text-sm font-medium text-orange-800">Time Blocks</div>
          </div>
        </div>
      </header>

      {/* Course Offerings */}
      <main>
        <h2 className="text-3xl font-semibold mb-8 text-gray-900">Available Course Sections</h2>
        
        {course.children.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
            <div className="text-yellow-600 text-lg font-medium mb-2">No Sections Available</div>
            <div className="text-yellow-700">
              There are currently no sections available for this course. Please check back later or contact the registrar's office.
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {course.children.map((offering) => (
              <CourseOfferingCard 
                key={offering.id} 
                offering={offering} 
              />
            ))}
          </div>
        )}
      </main>

      {/* Metadata Footer */}
      <footer className="mt-16 pt-8 border-t border-gray-200">
        <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="font-medium">Data Generated:</span><br />
              {new Date(courseData.metadata.generatedAt).toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Version:</span><br />
              {courseData.metadata.version}
            </div>
            <div>
              <span className="font-medium">Source:</span><br />
              {courseData.metadata.source}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/**
 * Course Offering Card Component
 * Displays individual course section information
 */
function CourseOfferingCard({ offering }: { offering: CourseOffering }) {
  // Get fee and time block information using utility functions
  const tuitionFee = findTuitionFee(offering.fees);
  const timeBlockInfo = findTimeBlockInfo(offering.fees);
  const totalFees = calculateTotalFees(offering.fees);
  const additionalFees = offering.fees.filter(fee => 
    fee.containerName === 'Fees' && 
    fee !== tuitionFee && 
    isValidFeeAmount(fee.amount)
  );

  return (
    <article className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm hover:shadow-md transition-all duration-300">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6 pb-6 border-b border-gray-100">
        <div className="mb-4 md:mb-0">
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">
            {offering.name}
          </h3>
          <p className="text-gray-600 text-lg">
            Section SIS ID: <span className="font-medium">{offering.sisID}</span>
          </p>
        </div>
        <div className="bg-green-50 px-6 py-4 rounded-lg border border-green-200">
          <div className="text-sm text-green-700 font-medium mb-1">Seats Available</div>
          <div className="text-2xl font-bold text-green-600">
            {offering.seatsAvailable}
          </div>
        </div>
      </div>

      {/* Course Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <span className="font-semibold text-gray-700 block mb-2">Delivery Type</span>
          <span className="text-gray-900">
            {offering.deliveryType?.displayName || 'Not specified'}
          </span>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <span className="font-semibold text-gray-700 block mb-2">Campus</span>
          <span className="text-gray-900">{offering.campus.displayName}</span>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <span className="font-semibold text-gray-700 block mb-2">Hours</span>
          <span className="text-gray-900">{offering.hours}</span>
        </div>
      </div>

      {/* Date Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <span className="font-semibold text-blue-800 block mb-2">Registration Period</span>
          <span className="text-blue-900">
            {formatDate(offering.registrationStart)} → {formatDate(offering.registrationEnd)}
          </span>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <span className="font-semibold text-purple-800 block mb-2">Course Dates</span>
          <span className="text-purple-900">
            {formatDate(offering.startDate)} → {formatDate(offering.endDate)}
          </span>
        </div>
      </div>

      {/* Primary Fee Information */}
      <FeeInformationSection 
        tuitionFee={tuitionFee}
        timeBlockInfo={timeBlockInfo}
        offering={offering}
        totalFees={totalFees}
      />

      {/* Additional Fees Section */}
      {additionalFees.length > 0 && (
        <AdditionalFeesSection 
          additionalFees={additionalFees}
          tuitionFee={tuitionFee}
          timeBlockInfo={timeBlockInfo}
        />
      )}

      {/* Debug Information (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <DebugSection 
          tuitionFee={tuitionFee}
          timeBlockInfo={timeBlockInfo}
          offering={offering}
        />
      )}
    </article>
  );
}

/**
 * Fee Information Section Component
 */
function FeeInformationSection({ 
  tuitionFee, 
  timeBlockInfo, 
  offering, 
  totalFees 
}: {
  tuitionFee: Fee | null;
  timeBlockInfo: { day: string; startTime: string; endTime: string } | null;
  offering: CourseOffering;
  totalFees: number;
}) {
  if (tuitionFee) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg mb-6 border border-blue-200">
        <h4 className="text-xl font-semibold text-gray-900 mb-4">Primary Fee</h4>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <span className="text-gray-800 text-lg font-medium block">
              {tuitionFee.feeType?.displayName || tuitionFee.feeItemName || 'Course Fee'}
            </span>
            {tuitionFee.feeType?.displayName && tuitionFee.feeItemName && 
             tuitionFee.feeType.displayName !== tuitionFee.feeItemName && (
              <span className="text-sm text-gray-600 block mt-1">({tuitionFee.feeItemName})</span>
            )}
            
            {/* Time Block and Day Information */}
            {timeBlockInfo && (
              <TimeBlockDisplay timeBlockInfo={timeBlockInfo} />
            )}
          </div>
          <div className="ml-6 text-right">
            <div className="text-3xl font-bold text-blue-600">
              ${parseFloat(tuitionFee.amount).toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    );
  } 
  
  if (offering.fees.filter(f => f.containerName === 'Fees').length > 0) {
    return (
      <div className="bg-amber-50 p-6 rounded-lg mb-6 border border-amber-200">
        <h4 className="text-xl font-semibold text-gray-900 mb-3">Fee Information</h4>
        <p className="text-amber-800 text-sm mb-4">
          No standard tuition fee found. Showing all available fees:
        </p>
        <div className="space-y-4">
          {offering.fees
            .filter(fee => fee.containerName === 'Fees')
            .map((fee, index) => (
              <FeeDisplayRow 
                key={index}
                fee={fee}
                timeBlockInfo={timeBlockInfo}
              />
            ))}
        </div>
        {totalFees > 0 && (
          <div className="mt-4 pt-4 border-t border-amber-200">
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>${totalFees.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50 p-6 rounded-lg mb-6 border border-gray-200">
      <h4 className="text-xl font-semibold text-gray-900 mb-3">Fee Information</h4>
      <p className="text-gray-600 italic">
        No fee information available for this section. Please contact the registrar for pricing details.
      </p>
    </div>
  );
}

/**
 * Additional Fees Section Component
 */
function AdditionalFeesSection({
  additionalFees,
  tuitionFee,
  timeBlockInfo
}: {
  additionalFees: Fee[];
  tuitionFee: Fee | null;
  timeBlockInfo: { day: string; startTime: string; endTime: string } | null;
}) {
  return (
    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
      <h4 className="text-xl font-semibold text-gray-900 mb-4">Additional Fees</h4>
      <div className="space-y-4">
        {additionalFees.map((fee, index) => (
          <div key={index} className="flex justify-between items-start bg-white p-4 rounded border border-gray-100">
            <div className="flex-1">
              <span className="text-gray-800 font-medium block">
                {fee.feeType?.displayName || fee.feeItemName || 'Additional Fee'}
              </span>
              {timeBlockInfo && (
                <TimeBlockDisplay timeBlockInfo={timeBlockInfo} isSmall />
              )}
            </div>
            <span className="font-semibold text-lg ml-4">
              ${parseFloat(fee.amount).toFixed(2)}
            </span>
          </div>
        ))}
      </div>
      {tuitionFee && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between font-bold text-lg">
            <span>Total Cost:</span>
            <span>${(parseFloat(tuitionFee.amount) + additionalFees.reduce((sum, fee) => sum + parseFloat(fee.amount), 0)).toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Time Block Display Component
 */
function TimeBlockDisplay({ 
  timeBlockInfo, 
  isSmall = false 
}: { 
  timeBlockInfo: { day: string; startTime: string; endTime: string };
  isSmall?: boolean;
}) {
  const baseClasses = isSmall ? "mt-1 space-y-1 text-xs text-gray-500" : "mt-4 space-y-2 text-sm bg-white bg-opacity-70 p-3 rounded";
  const labelClasses = isSmall ? "font-medium" : "font-semibold";
  const textClasses = isSmall ? "text-gray-500" : "text-gray-700";

  return (
    <div className={baseClasses}>
      {timeBlockInfo.day && (
        <div className={textClasses}>
          <span className={labelClasses}>Day:</span> {convertDayNumberToName(timeBlockInfo.day)}
        </div>
      )}
      <div className={textClasses}>
        <span className={labelClasses}>Time:</span> {timeBlockInfo.startTime} - {timeBlockInfo.endTime}
      </div>
    </div>
  );
}

/**
 * Fee Display Row Component
 */
function FeeDisplayRow({
  fee,
  timeBlockInfo
}: {
  fee: Fee;
  timeBlockInfo: { day: string; startTime: string; endTime: string } | null;
}) {
  return (
    <div className="flex justify-between items-start bg-white bg-opacity-70 p-3 rounded">
      <div className="flex-1">
        <span className="text-gray-800 font-medium block">
          {fee.feeType?.displayName || fee.feeItemName || 'Unnamed Fee'}
        </span>
        {timeBlockInfo && (
          <TimeBlockDisplay timeBlockInfo={timeBlockInfo} isSmall />
        )}
      </div>
      <span className="font-semibold text-lg ml-4">
        {isValidFeeAmount(fee.amount) 
          ? `${parseFloat(fee.amount).toFixed(2)}`
          : 'Amount TBD'
        }
      </span>
    </div>
  );
}

/**
 * Debug Section Component (Development Only)
 */
function DebugSection({
  tuitionFee,
  timeBlockInfo,
  offering
}: {
  tuitionFee: Fee | null;
  timeBlockInfo: { day: string; startTime: string; endTime: string } | null;
  offering: CourseOffering;
}) {
  return (
    <details className="mt-6 text-xs text-gray-400">
      <summary className="cursor-pointer hover:text-gray-600 transition-colors">
        Debug: Fee & TimeBlock Structure
      </summary>
      <div className="mt-3 space-y-3">
        <div>
          <strong>Tuition Fee:</strong>
          <pre className="p-3 bg-gray-100 rounded text-xs overflow-auto mt-1">
            {JSON.stringify(tuitionFee, null, 2)}
          </pre>
        </div>
        <div>
          <strong>Time Block Info:</strong>
          <pre className="p-3 bg-gray-100 rounded text-xs overflow-auto mt-1">
            {JSON.stringify(timeBlockInfo, null, 2)}
          </pre>
        </div>
        <div>
          <strong>All Fees:</strong>
          <pre className="p-3 bg-gray-100 rounded text-xs overflow-auto mt-1">
            {JSON.stringify(offering.fees, null, 2)}
          </pre>
        </div>
      </div>
    </details>
  );
}