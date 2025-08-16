// src/app/study/open-studies/courses/[sisID]/page.tsx
import { notFound } from "next/navigation";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

// Static generation configuration
export const dynamic = 'force-static';
export const dynamicParams = false;

/**
 * Safely load and validate the course list with fallback handling
 * Returns a fallback course ID if the main list is empty or invalid
 */
function loadValidCoursesWithFallback(): { courses: string[], hasFallback: boolean } {
  try {
    const filePath = join(process.cwd(), 'src', 'data', 'osValidCourses.json');
    
    // Check if file exists
    if (!existsSync(filePath)) {
      console.warn('⚠️ osValidCourses.json not found, using fallback');
      return { courses: ['no-courses-available'], hasFallback: true };
    }

    const fileContent = readFileSync(filePath, 'utf8');
    
    // Check if file is empty
    if (!fileContent.trim()) {
      console.warn('⚠️ osValidCourses.json is empty, using fallback');
      return { courses: ['no-courses-available'], hasFallback: true };
    }

    const validCourses = JSON.parse(fileContent);

    // Validate structure
    if (!Array.isArray(validCourses)) {
      console.error('❌ osValidCourses.json is not an array, using fallback');
      return { courses: ['no-courses-available'], hasFallback: true };
    }

    // Filter out invalid entries
    const filteredCourses = validCourses.filter(course => 
      course && typeof course === 'string' && course.trim().length > 0
    );

    if (filteredCourses.length === 0) {
      console.warn('⚠️ No valid courses found in osValidCourses.json, using fallback');
      return { courses: ['no-courses-available'], hasFallback: true };
    }

    console.log(`✅ Loaded ${filteredCourses.length} valid courses for SSG`);
    return { courses: filteredCourses, hasFallback: false };

  } catch (error) {
    console.error('❌ Error loading osValidCourses.json, using fallback:', error);
    return { courses: ['no-courses-available'], hasFallback: true };
  }
}

/**
 * Generate static params with fallback support
 * Always returns at least one param to allow build to succeed
 */
export async function generateStaticParams(): Promise<{ sisID: string }[]> {
  console.log('🚀 generateStaticParams called for course pages');
  
  const { courses, hasFallback } = loadValidCoursesWithFallback();

  if (hasFallback) {
    console.log('📦 Using fallback page for empty course data');
  }

  // Generate params - will always have at least one entry
  const params = courses.map((sisID) => ({ sisID: sisID.trim() }));

  console.log(`📦 Generated ${params.length} static params for course pages`);
  return params;
}

/**
 * Create fallback course data for when no courses are available
 */
function createFallbackCourseData(): CourseData {
  return {
    metadata: {
      generatedAt: new Date().toISOString(),
      version: "1.0.0",
      source: "fallback",
      sisID: "no-courses-available",
      courseName: "No Courses Available"
    },
    course: {
      id: "fallback-course",
      sisID: "no-courses-available",
      name: "Course Information Currently Unavailable",
      children: [],
      summary: {
        totalSections: 0,
        totalFees: 0,
        totalTimeBlocks: 0,
        sectionsWithFees: 0
      }
    }
  };
}

/**
 * Interface definitions
 */
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

interface CourseOffering {
  id: string;
  name: string;
  sisID: string;
  courseName: string;
  deliveryTypeId: string;
  campusId: string;
  deliveryType: {
    id: string;
    name: string;
    displayName: string;
    slug: string;
  };
  campus: {
    id: string;
    name: string;
    displayName: string;
    slug: string;
  };
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

interface Fee {
  containerName: string;
  feeItemName: string;
  feeTypeId: string;
  feeType: {
    id: string;
    name: string;
    displayName: string;
    slug: string;
  } | null;
  amount: string;
  timeBlock: {
    id: string;
    name: string;
    displayName: string;
    endTime: string;
    startTime: string;
    sisId: string;
    created: string;
    updated: string;
    Created: string;
    Updated: string;
  } | null;
  day: string;
}

/**
 * Utility functions
 */
function formatDate(dateString: string): string {
  if (!dateString) return "N/A";
  
  try {
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    
    const date = new Date(`${year}-${month}-${day}`);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}

function convertDayNumberToName(dayNumber: string | number): string {
  const dayMap: { [key: string]: string } = {
    '1': 'Monday',
    '2': 'Tuesday', 
    '3': 'Wednesday',
    '4': 'Thursday',
    '5': 'Friday',
    '6': 'Saturday'
  };
  
  return dayMap[dayNumber.toString()] || `Day ${dayNumber}`;
}

function formatTimeBlock(timeString: string): string {
  if (!timeString || !timeString.includes('T')) return timeString;
  
  try {
    const timePortion = timeString.split('T')[1];
    if (!timePortion || timePortion.length < 6) return timeString;
    
    const hours = parseInt(timePortion.substring(0, 2));
    const minutes = parseInt(timePortion.substring(2, 4));
    
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const displayMinutes = minutes > 0 ? `:${minutes.toString().padStart(2, '0')}` : '';
    
    return `${displayHours}${displayMinutes} ${period} MST`;
  } catch {
    return timeString;
  }
}

function findTuitionFee(fees: Fee[]): Fee | null {
  if (!fees || fees.length === 0) return null;

  const actualFees = fees.filter(fee => 
    fee.containerName === 'Fees' && 
    fee.amount && 
    parseFloat(fee.amount) > 0
  );

  if (actualFees.length === 0) return null;

  const tuitionFee = actualFees.find(fee => 
    fee.feeType?.slug?.toLowerCase().includes('tuition') ||
    fee.feeType?.name?.toLowerCase().includes('tuition') ||
    fee.feeItemName?.toLowerCase().includes('tuition')
  );

  return tuitionFee || actualFees[0];
}

function findTimeBlockInfo(fees: Fee[]): { day: string; startTime: string; endTime: string } | null {
  const timeBlockEntry = fees.find(fee => 
    fee.containerName === 'TimeBlock' && 
    fee.timeBlock && 
    fee.timeBlock.startTime && 
    fee.timeBlock.endTime
  );

  if (!timeBlockEntry || !timeBlockEntry.timeBlock) return null;

  return {
    day: timeBlockEntry.day || '',
    startTime: formatTimeBlock(timeBlockEntry.timeBlock.startTime),
    endTime: formatTimeBlock(timeBlockEntry.timeBlock.endTime)
  };
}

function calculateTotalFees(fees: Fee[]): number {
  return fees
    .filter(fee => fee.containerName === 'Fees')
    .reduce((total, fee) => {
      const amount = parseFloat(fee.amount) || 0;
      return total + amount;
    }, 0);
}

function isValidFeeAmount(amount: string): boolean {
  const numAmount = parseFloat(amount);
  return !isNaN(numAmount) && numAmount > 0;
}

/**
 * Load course data with fallback support
 */
function loadCourseData(sisID: string): CourseData | null {
  // Handle fallback case
  if (sisID === 'no-courses-available') {
    return createFallbackCourseData();
  }

  try {
    const filePath = join(process.cwd(), 'src', 'data', 'oScourses', `course-${sisID}.json`);
    
    if (!existsSync(filePath)) {
      console.error(`❌ Course data file not found: course-${sisID}.json`);
      return null;
    }

    const fileContent = readFileSync(filePath, 'utf8');
    
    if (!fileContent.trim()) {
      console.error(`❌ Course data file is empty: course-${sisID}.json`);
      return null;
    }

    const parsedData = JSON.parse(fileContent) as CourseData;
    
    if (!parsedData?.course?.sisID) {
      console.error(`❌ Invalid course data structure for ${sisID}`);
      return null;
    }

    if (!parsedData.course.children || !Array.isArray(parsedData.course.children)) {
      console.error(`❌ No course offerings found for ${sisID}`);
      return null;
    }
    
    return parsedData;
  } catch (error) {
    console.error(`❌ Failed to load course data for ${sisID}:`, error);
    return null;
  }
}

/**
 * Fallback page component for when no courses are available
 */
function NoCoursesAvailablePage() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="text-center py-16">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            No Courses Available
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Course information is currently being updated. Please check back later for available course offerings.
          </p>
        </div>

        {/* Information Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="text-blue-600 mb-3">
              <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Coming Soon</h3>
            <p className="text-gray-600 text-sm">
              New courses are being added regularly. Check back for updates.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="text-green-600 mb-3">
              <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Stay Informed</h3>
            <p className="text-gray-600 text-sm">
              Sign up for notifications about new course offerings and registration dates.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="text-purple-600 mb-3">
              <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Help?</h3>
            <p className="text-gray-600 text-sm">
              Contact our academic advisors for guidance on course planning and registration.
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gray-50 rounded-lg p-8 max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            What You Can Do Now
          </h2>
          
          <div className="space-y-4 text-left">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">1</div>
              <div>
                <h3 className="font-medium text-gray-900">Browse Other Programs</h3>
                <p className="text-gray-600 text-sm">Explore our other academic programs and offerings while course data is being updated.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">2</div>
              <div>
                <h3 className="font-medium text-gray-900">Contact Academic Services</h3>
                <p className="text-gray-600 text-sm">Speak with an advisor about your academic goals and course planning.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">3</div>
              <div>
                <h3 className="font-medium text-gray-900">Check Back Later</h3>
                <p className="text-gray-600 text-sm">Course information is updated regularly. Please visit again soon.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-gray-200 text-sm text-gray-500 text-center">
        <p>
          Page generated: {new Date().toLocaleString()} | 
          Status: Course data updating | 
          Check back for updates
        </p>
      </div>
    </div>
  );
}

/**
 * Main page component with fallback support
 */
export default async function CoursePage({
  params,
}: {
  params: Promise<{ sisID: string }>;
}) {
  const { sisID } = await params;

  // Handle fallback case - show "no courses available" page
  if (sisID === 'no-courses-available') {
    return <NoCoursesAvailablePage />;
  }

  // Validate sisID is in our allowed list
  const { courses } = loadValidCoursesWithFallback();
  if (!courses.includes(sisID)) {
    console.warn(`⚠️ Requested sisID ${sisID} not in valid courses list`);
    return notFound();
  }

  // Load course data
  const courseData = loadCourseData(sisID);

  if (!courseData?.course?.children?.length) {
    console.warn(`⚠️ No valid course data found for ${sisID}`);
    return notFound();
  }

  const { course } = courseData;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Course Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {course.name}
        </h1>
        <div className="text-lg text-gray-600">
          SIS ID: <span className="font-semibold">{course.sisID}</span>
        </div>
        
        {/* Course Summary */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Course Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Total Sections:</span> {course.summary.totalSections}
            </div>
            <div>
              <span className="font-medium">Sections with Fees:</span> {course.summary.sectionsWithFees}
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

      {/* Course Offerings */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">Available Course Sections</h2>
        
        <div className="space-y-6">
          {course.children.map((offering) => {
            const tuitionFee = findTuitionFee(offering.fees);
            const timeBlockInfo = findTimeBlockInfo(offering.fees);
            const totalFees = calculateTotalFees(offering.fees);
            const additionalFees = offering.fees.filter(fee => 
              fee.containerName === 'Fees' && 
              fee !== tuitionFee && 
              isValidFeeAmount(fee.amount)
            );

            return (
              <div key={offering.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                {/* Section Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {offering.name}
                    </h3>
                    <p className="text-gray-600">
                      Section SIS ID: {offering.sisID}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Seats Available</div>
                    <div className="text-lg font-semibold text-green-600">
                      {offering.seatsAvailable}
                    </div>
                  </div>
                </div>

                {/* Course Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div>
                    <span className="font-medium text-gray-700">Delivery Type:</span>
                    <br />
                    <span className="text-gray-600">{offering.deliveryType.displayName}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Campus:</span>
                    <br />
                    <span className="text-gray-600">{offering.campus.displayName}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Hours:</span>
                    <br />
                    <span className="text-gray-600">{offering.hours}</span>
                  </div>
                </div>

                {/* Date Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="font-medium text-gray-700">Registration Period:</span>
                    <br />
                    <span className="text-gray-600">
                      {formatDate(offering.registrationStart)} → {formatDate(offering.registrationEnd)}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Course Dates:</span>
                    <br />
                    <span className="text-gray-600">
                      {formatDate(offering.startDate)} → {formatDate(offering.endDate)}
                    </span>
                  </div>
                </div>

                {/* Primary Fee Information */}
                {tuitionFee ? (
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Primary Fee</h4>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <span className="text-gray-700 text-base block">
                          {tuitionFee.feeType?.displayName || tuitionFee.feeItemName || 'Course Fee'}
                        </span>
                        {tuitionFee.feeType?.displayName && tuitionFee.feeItemName && 
                         tuitionFee.feeType.displayName !== tuitionFee.feeItemName && (
                          <span className="text-sm text-gray-500">({tuitionFee.feeItemName})</span>
                        )}
                        
                        {timeBlockInfo && (
                          <div className="mt-2 space-y-1 text-sm">
                            {timeBlockInfo.day && (
                              <div className="text-gray-600">
                                <span className="font-medium">Day:</span> {convertDayNumberToName(timeBlockInfo.day)}
                              </div>
                            )}
                            <div className="text-gray-600">
                              <span className="font-medium">Time:</span> {timeBlockInfo.startTime} - {timeBlockInfo.endTime}
                            </div>
                          </div>
                        )}
                      </div>
                      <span className="text-xl font-bold text-blue-600 ml-4">
                        ${parseFloat(tuitionFee.amount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ) : offering.fees.filter(f => f.containerName === 'Fees').length > 0 ? (
                  <div className="bg-amber-50 p-4 rounded-lg mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Fee Information</h4>
                    <p className="text-amber-700 text-sm mb-3">
                      No standard tuition fee found. Showing all available fees:
                    </p>
                    <div className="space-y-3">
                      {offering.fees
                        .filter(fee => fee.containerName === 'Fees')
                        .map((fee, index) => (
                          <div key={index} className="flex justify-between items-start">
                            <div className="flex-1">
                              <span className="text-gray-700 text-sm block">
                                {fee.feeType?.displayName || fee.feeItemName || 'Unnamed Fee'}
                              </span>
                              {timeBlockInfo && (
                                <div className="mt-1 space-y-1 text-xs">
                                  {timeBlockInfo.day && (
                                    <div className="text-gray-600">
                                      <span className="font-medium">Day:</span> {convertDayNumberToName(timeBlockInfo.day)}
                                    </div>
                                  )}
                                  <div className="text-gray-600">
                                    <span className="font-medium">Time:</span> {timeBlockInfo.startTime} - {timeBlockInfo.endTime}
                                  </div>
                                </div>
                              )}
                            </div>
                            <span className="font-medium text-sm ml-4">
                              {isValidFeeAmount(fee.amount) 
                                ? `$${parseFloat(fee.amount).toFixed(2)}`
                                : 'Amount TBD'
                              }
                            </span>
                          </div>
                        ))}
                    </div>
                    {totalFees > 0 && (
                      <div className="mt-3 pt-3 border-t border-amber-200">
                        <div className="flex justify-between font-semibold">
                          <span>Total:</span>
                          <span>${totalFees.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Fee Information</h4>
                    <p className="text-gray-500 italic">
                      No fee information available for this section. Please contact the registrar for pricing details.
                    </p>
                  </div>
                )}

                {/* Additional Fees Section */}
                {additionalFees.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Additional Fees</h4>
                    <div className="space-y-3">
                      {additionalFees.map((fee, index) => (
                        <div key={index} className="flex justify-between items-start">
                          <div className="flex-1">
                            <span className="text-gray-600 text-sm block">
                              {fee.feeType?.displayName || fee.feeItemName || 'Additional Fee'}
                            </span>
                            {timeBlockInfo && (
                              <div className="mt-1 space-y-1 text-xs">
                                {timeBlockInfo.day && (
                                  <div className="text-gray-500">
                                    <span className="font-medium">Day:</span> {convertDayNumberToName(timeBlockInfo.day)}
                                  </div>
                                )}
                                <div className="text-gray-500">
                                  <span className="font-medium">Time:</span> {timeBlockInfo.startTime} - {timeBlockInfo.endTime}
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
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex justify-between font-semibold text-sm">
                          <span>Total Cost:</span>
                          <span>${(parseFloat(tuitionFee.amount) + additionalFees.reduce((sum, fee) => sum + parseFloat(fee.amount), 0)).toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Metadata Footer */}
      <div className="mt-12 pt-6 border-t border-gray-200 text-sm text-gray-500">
        <p>
          Data generated: {new Date(courseData.metadata.generatedAt).toLocaleString()} | 
          Version: {courseData.metadata.version} | 
          Source: {courseData.metadata.source}
        </p>
      </div>
    </div>
  );
}