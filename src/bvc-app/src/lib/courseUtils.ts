// src/lib/courseUtils.ts
import { readFileSync, existsSync } from "fs";
import { join } from "path";

/**
 * Raw course JSON structure (produced by generateExtendedEducation.mjs)
 */
interface RawCourseFile {
  id: string;
  sisId: string;
  name: string;
  description: string;
  credits: number;
  sections: RawSection[];
}

interface RawSection {
  id: string;
  name: string;
  sisId: string;
  deliveryType: string;
  campus: string;
  hours: number;
  credits: number;
  registrationStart: string;
  registrationEnd: string;
  startDate: string;
  endDate: string;
  seatsAvailable: boolean;
  fees: {
    domestic: { amount: number; tax: number; feeType: string };
    international: { amount: number; tax: number; feeType: string };
  };
  timeBlocks: {
    sisId: string;
    frequency: string;
    startTime: string;
    endTime: string;
    schedule: string;
  }[];
}

/**
 * Summary type used by the listing page
 */
export interface CourseSummary {
  sisID: string;
  name: string;
  totalSections: number;
  sectionsWithFees: number;
  hasValidData: boolean;
}

/**
 * Load the valid courses allow-list.
 * Tries coursesToBuild.json first (new script), falls back to validCourses.json.
 */
function loadValidCoursesList(): string[] {
  const primary = join(process.cwd(), 'src', 'data', 'coursesToBuild.json');
  const fallback = join(process.cwd(), 'src', 'data', 'validCourses.json');
  const filePath = existsSync(primary) ? primary : fallback;
  if (!existsSync(filePath)) return [];
  const parsed: unknown = JSON.parse(readFileSync(filePath, 'utf8'));
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((c): c is string => typeof c === 'string' && c.trim().length > 0);
}

/**
 * Load a single course JSON file
 */
function loadRawCourse(sisID: string): RawCourseFile | null {
  const filePath = join(process.cwd(), 'src', 'data', 'courses', `course-${sisID}.json`);
  if (!existsSync(filePath)) return null;
  try {
    const data = JSON.parse(readFileSync(filePath, 'utf8')) as RawCourseFile;
    if (!data?.sisId || !Array.isArray(data.sections)) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Get all valid course SIS IDs that have corresponding JSON files
 */
export function getAvailableCourseSISIds(): string[] {
  const validCourses = loadValidCoursesList();
  return validCourses.filter((sisID) => {
    const filePath = join(process.cwd(), 'src', 'data', 'courses', `course-${sisID}.json`);
    return existsSync(filePath);
  });
}

/**
 * Load course summaries for the listing page
 */
export function loadAllCourseSummaries(): CourseSummary[] {
  const validCourses = loadValidCoursesList();
  return validCourses.map((sisID) => {
    const course = loadRawCourse(sisID);
    if (course) {
      const sectionsWithFees = course.sections.filter(
        (s) => (s.fees?.domestic?.amount ?? 0) > 0 || (s.fees?.international?.amount ?? 0) > 0
      ).length;
      return {
        sisID: course.sisId,
        name: course.name,
        totalSections: course.sections.length,
        sectionsWithFees,
        hasValidData: true,
      };
    }
    return {
      sisID,
      name: `Course ${sisID}`,
      totalSections: 0,
      sectionsWithFees: 0,
      hasValidData: false,
    };
  }).sort((a, b) => a.sisID.localeCompare(b.sisID));
}

/**
 * Get statistics about all available courses (used by the listing page)
 */
export function getCourseStatistics() {
  const courses = loadAllCourseSummaries();
  const available = courses.filter((c) => c.hasValidData);
  return {
    totalCourses: courses.length,
    availableCourses: available.length,
    unavailableCourses: courses.length - available.length,
    totalSections: available.reduce((t, c) => t + c.totalSections, 0),
    sectionsWithFees: available.reduce((t, c) => t + c.sectionsWithFees, 0),
    courses,
  };
}
