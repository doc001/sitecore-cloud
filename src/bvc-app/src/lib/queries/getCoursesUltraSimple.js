// src/lib/queries/getCoursesUltraSimple.js

/**
 * Ultra-simplified GraphQL queries for Sitecore XMC
 * Minimal field complexity to avoid "Query too complex" errors
 */

/**
 * Step 1: Find course items by SIS ID - minimal fields only
 */
export const GET_COURSE_IDS_BY_SISID = /* GraphQL */ `
  query GetCourseIdsBySisID($sisID: String!) {
    search(
      where: {
        AND: [
          { name: "_path", value: "/sitecore/content/BVC/BVC/Data/SisData/Courses", operator: CONTAINS }
          { name: "sisID", value: $sisID }
        ]
      }
      first: 20
    ) {
      results {
        id
      }
    }
  }
`;

/**
 * Step 2: Get basic course info by ID
 */
export const GET_COURSE_BASIC_INFO = /* GraphQL */ `
  query GetCourseBasicInfo($courseId: String!) {
    item(path: "", id: $courseId) {
      id
      name: field(name: "Name") { value }
      sisID: field(name: "sisID") { value }
    }
  }
`;

/**
 * Step 3: Get course details (split into smaller chunks)
 */
export const GET_COURSE_DETAILS_PART1 = /* GraphQL */ `
  query GetCourseDetailsPart1($courseId: String!) {
    item(path: "", id: $courseId) {
      id
      deliveryType: field(name: "Delivery Type") { value }
      campus: field(name: "Campus") { value }
      hours: field(name: "Hours") { value }
    }
  }
`;

export const GET_COURSE_DETAILS_PART2 = /* GraphQL */ `
  query GetCourseDetailsPart2($courseId: String!) {
    item(path: "", id: $courseId) {
      id
      registrationStart: field(name: "Registration Start") { value }
      registrationEnd: field(name: "Registration End") { value }
      startDate: field(name: "Start Date") { value }
      endDate: field(name: "End Date") { value }
    }
  }
`;

export const GET_COURSE_DETAILS_PART3 = /* GraphQL */ `
  query GetCourseDetailsPart3($courseId: String!) {
    item(path: "", id: $courseId) {
      id
      seatsAvailable: field(name: "Seats Are Available") { value }
    }
  }
`;

/**
 * Alternative: Get all course fields in one query but for one item only
 */
export const GET_SINGLE_COURSE_ALL_FIELDS = /* GraphQL */ `
  query GetSingleCourseAllFields($courseId: String!) {
    item(path: "", id: $courseId) {
      id
      name: field(name: "Name") { value }
      sisID: field(name: "sisID") { value }
      deliveryType: field(name: "Delivery Type") { value }
      campus: field(name: "Campus") { value }
      hours: field(name: "Hours") { value }
      registrationStart: field(name: "Registration Start") { value }
      registrationEnd: field(name: "Registration End") { value }
      startDate: field(name: "Start Date") { value }
      endDate: field(name: "End Date") { value }
      seatsAvailable: field(name: "Seats Are Available") { value }
    }
  }
`;

/**
 * Minimal search to find course items by SIS ID without field complexity
 */
export const FIND_COURSES_BY_SISID = /* GraphQL */ `
  query FindCoursesBySisID($sisID: String!) {
    search(
      where: {
        name: "sisID"
        value: $sisID
      }
      first: 50
    ) {
      results {
        id
        path
      }
    }
  }
`;

/**
 * Get course name only
 */
export const GET_COURSE_NAME = /* GraphQL */ `
  query GetCourseName($courseId: String!) {
    item(path: "", id: $courseId) {
      id
      name: field(name: "Name") { value }
    }
  }
`;