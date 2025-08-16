// src/utils/courseUtils.ts
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import validCourses from "@/data/validCourses.json";

/**
 * Type definitions for course data structures
 */
export interface CourseData {
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

export interface CourseOffering {
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
  } | null;
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

export interface Fee {
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

export interface CourseSummary {
  sisID: string;
  name: string;
  totalSections: number;
  sectionsWithFees: number;
  hasValidData: boolean;
  metadata?: {
    generatedAt: string;
    version: string;
  };
}

/**
 * Get all valid course SIS IDs that have corresponding JSON files
 * This is useful for generateStaticParams functions
 */
export function getAvailableCourseSISIds(): string[] {
  const availableCourses: string[] = [];
  
  for (const sisID of validCourses as string[]) {
    try {
      const filePath = join(process.cwd(), 'src', 'data', 'courses', `course-${sisID}.json`);
      
      if (existsSync(filePath)) {
        // Additional validation to ensure the file has valid structure
        const fileContent = readFileSync(filePath, 'utf8');
        const courseData = JSON.parse(fileContent) as CourseData;
        
        if (courseData?.course?.sisID === sisID) {
          availableCourses.push(sisID);
        }
      }
    } catch (error) {
      // Skip courses with file access or parsing issues
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Skipping course ${sisID} due to error:`, error);
      }
    }
  }

  return availableCourses;
}

/**
 * Load course data from static JSON file with enhanced error handling
 * Returns null if file doesn't exist or is invalid
 */
export function loadCourseData(sisID: string): CourseData | null {
  try {
    const filePath = join(process.cwd(), 'src', 'data', 'courses', `course-${sisID}.json`);
    
    // Check if file exists before attempting to read
    if (!existsSync(filePath)) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Course file not found: ${filePath}`);
      }
      return null;
    }

    const fileContent = readFileSync(filePath, 'utf8');
    const parsedData = JSON.parse(fileContent) as CourseData;
    
    // Validate essential data structure
    if (!parsedData?.course?.sisID || parsedData.course.sisID !== sisID) {
      console.warn(`SIS ID mismatch in file for ${sisID}`);
      return null;
    }
    
    // Ensure children array exists
    if (!parsedData.course.children) {
      parsedData.course.children = [];
    }
    
    // Validate summary data exists
    if (!parsedData.course.summary) {
      parsedData.course.summary = {
        totalSections: parsedData.course.children.length,
        totalFees: 0,
        totalTimeBlocks: 0,
        sectionsWithFees: 0
      };
    }
    
    return parsedData;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`Failed to load course data for ${sisID}:`, error);
    }
    return null;
  }
}

/**
 * Load course summaries for all courses listed in validCourses.json
 * Returns both available and unavailable courses for comprehensive listing
 */
export function loadAllCourseSummaries(): CourseSummary[] {
  const courseSummaries: CourseSummary[] = [];

  for (const sisID of validCourses as string[]) {
    try {
      const courseData = loadCourseData(sisID);
      
      if (courseData) {
        courseSummaries.push({
          sisID: courseData.course.sisID,
          name: courseData.course.name,
          totalSections: courseData.course.summary.totalSections,
          sectionsWithFees: courseData.course.summary.sectionsWithFees,
          hasValidData: true,
          metadata: courseData.metadata
        });
      } else {
        // Course is in validCourses.json but file doesn't exist or is invalid
        courseSummaries.push({
          sisID: sisID,
          name: `Course ${sisID}`,
          totalSections: 0,
          sectionsWithFees: 0,
          hasValidData: false
        });
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Error processing course ${sisID}:`, error);
      }
      
      courseSummaries.push({
        sisID: sisID,
        name: `Course ${sisID}`,
        totalSections: 0,
        sectionsWithFees: 0,
        hasValidData: false
      });
    }
  }

  // Sort courses by SIS ID for consistent display
  return courseSummaries.sort((a, b) => a.sisID.localeCompare(b.sisID));
}

/**
 * Validate that a course exists and has valid data
 * Useful for checking before rendering pages
 */
export function validateCourseExists(sisID: string): boolean {
  const courseData = loadCourseData(sisID);
  return courseData !== null && courseData.course.children.length >= 0;
}

/**
 * Get statistics about all available courses
 * Useful for landing page displays
 */
export function getCourseStatistics() {
  const courses = loadAllCourseSummaries();
  const availableCourses = courses.filter(c => c.hasValidData);
  
  return {
    totalCourses: courses.length,
    availableCourses: availableCourses.length,
    unavailableCourses: courses.length - availableCourses.length,
    totalSections: availableCourses.reduce((total, course) => total + course.totalSections, 0),
    sectionsWithFees: availableCourses.reduce((total, course) => total + course.sectionsWithFees, 0),
    courses: courses
  };
}

/**
 * Format date utility function
 * Handles Sitecore date format: 20250813T000000
 */
export function formatDate(dateString: string): string {
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

/**
 * Convert day number to day name
 */
export function convertDayNumberToName(dayNumber: string | number): string {
  const dayMap: { [key: string]: string } = {
    '0': 'Sunday',
    '1': 'Monday',
    '2': 'Tuesday', 
    '3': 'Wednesday',
    '4': 'Thursday',
    '5': 'Friday',
    '6': 'Saturday'
  };
  
  return dayMap[dayNumber.toString()] || `Day ${dayNumber}`;
}

/**
 * Convert Sitecore time format to readable time with MST
 * Example: 20240101T090000 -> 9:00 AM MST
 */
export function formatTimeBlock(timeString: string): string {
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

/**
 * Find tuition fee from the fees array
 */
export function findTuitionFee(fees: Fee[]): Fee | null {
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

/**
 * Find time block information from TimeBlock containers
 */
export function findTimeBlockInfo(fees: Fee[]): { day: string; startTime: string; endTime: string } | null {
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

/**
 * Calculate total fees for a course offering
 */
export function calculateTotalFees(fees: Fee[]): number {
  return fees
    .filter(fee => fee.containerName === 'Fees')
    .reduce((total, fee) => {
      const amount = parseFloat(fee.amount) || 0;
      return total + amount;
    }, 0);
}

/**
 * Check if a fee amount is valid
 */
export function isValidFeeAmount(amount: string): boolean {
  const numAmount = parseFloat(amount);
  return !isNaN(numAmount) && numAmount > 0;
}