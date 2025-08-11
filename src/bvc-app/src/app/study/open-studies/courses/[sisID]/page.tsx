// src/app/study/open-studies/courses/[sisID]/page.tsx
import { notFound } from "next/navigation";
import { readFileSync } from "fs";
import { join } from "path";

// Import the valid courses JSON - make sure this path is correct
const osValidCourses: string[] = require("@/data/osValidCourses.json");

// Ensure static generation
export const dynamic = 'force-static';
export const dynamicParams = false;

/**
 * CRITICAL: generateStaticParams must be exported and return all valid params
 * This function runs at BUILD TIME to determine which pages to pre-generate
 */
export async function generateStaticParams() {
  console.log('🚀 generateStaticParams called');
  console.log('📋 Valid courses:', osValidCourses);
  
  // Validate the imported data
  if (!Array.isArray(osValidCourses)) {
    console.error('❌ osValidCourses is not an array:', typeof osValidCourses);
    return [];
  }

  if (osValidCourses.length === 0) {
    console.warn('⚠️ No valid courses found');
    return [];
  }

  // Generate the static params
  const params = osValidCourses.map((sisID) => {
    if (!sisID || typeof sisID !== 'string') {
      console.warn('⚠️ Invalid sisID:', sisID);
      return null;
    }
    return { sisID: String(sisID) };
  }).filter((param): param is { sisID: string } => param !== null);

  console.log(`✅ Generated ${params.length} static params:`, params.slice(0, 5));
  return params;
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
 * Load course data - enhanced with better error handling
 */
function loadCourseData(sisID: string): CourseData | null {
  try {
    console.log(`🔍 Loading course data for sisID: ${sisID}`);
    
    const filePath = join(process.cwd(), 'src', 'data', 'oScourses', `course-${sisID}.json`);
    console.log(`📁 Looking for file: ${filePath}`);
    
    const fileContent = readFileSync(filePath, 'utf8');
    
    if (!fileContent.trim()) {
      console.error(`❌ Empty file for course ${sisID}`);
      return null;
    }

    const parsedData = JSON.parse(fileContent) as CourseData;
    
    if (!parsedData?.course?.sisID) {
      console.error(`❌ Invalid course data structure for ${sisID}`);
      return null;
    }

    if (parsedData.course.sisID !== sisID) {
      console.warn(`⚠️ SIS ID mismatch for ${sisID}. Expected: ${sisID}, Found: ${parsedData.course.sisID}`);
    }
    
    console.log(`✅ Successfully loaded course data for ${sisID}`);
    return parsedData;
  } catch (error) {
    console.error(`❌ Failed to load course data for ${sisID}:`, error);
    return null;
  }
}

/**
 * Main page component
 */
export default function CoursePage({ params }: { params: { sisID: string } }) {
  console.log('🔄 CoursePage render started');
  
  const { sisID } = params;
  console.log(`🎯 Rendering course page for sisID: ${sisID}`);

  // Validate sisID is in our allowed list
  if (!osValidCourses.includes(sisID)) {
    console.warn(`⚠️ sisID ${sisID} not in valid courses list`);
    return notFound();
  }

  // Load course data
  const courseData = loadCourseData(sisID);

  if (!courseData?.course?.children?.length) {
    console.warn(`⚠️ No course data or children found for ${sisID}`);
    return notFound();
  }

  const { course } = courseData;
  console.log(`✅ Rendering course: ${course.name} with ${course.children.length} offerings`);

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