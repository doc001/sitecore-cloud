// src/lib/queries/getCourseQueries.js

/**
 * Simplified GraphQL queries for Sitecore XMC
 * Breaking down complex nested queries into manageable chunks
 */

/**
 * Step 1: Find the course root by SIS ID
 */
export const GET_COURSE_ROOT_BY_SISID = /* GraphQL */ `
  query GetCourseRootBySisID($sisID: String!) {
    search(
      where: {
        AND: [
          { name: "_path", value: "/sitecore/content/BVC/BVC/Data/SisData/Courses", operator: CONTAINS }
          { name: "sisID", value: $sisID }
        ]
      }
      first: 1
    ) {
      results {
        id
        name: field(name: "Name") { value }
        sisID: field(name: "sisID") { value }
      }
    }
  }
`;

/**
 * Step 2: Get direct children of a course (course sections/offerings)
 */
export const GET_COURSE_CHILDREN = /* GraphQL */ `
  query GetCourseChildren($parentId: String!, $first: Int, $after: String) {
    item(path: "", id: $parentId) {
      id
      children(first: $first, after: $after) {
        results {
          id
          sisID: field(name: "sisID") { value }
          courseName: field(name: "Name") { value }
          deliveryType: field(name: "Delivery Type") { value }
          campus: field(name: "Campus") { value }
          hours: field(name: "Hours") { value }
          registrationStart: field(name: "Registration Start") { value }
          registrationEnd: field(name: "Registration End") { value }
          startDate: field(name: "Start Date") { value }
          endDate: field(name: "End Date") { value }
          seatsAvailable: field(name: "Seats Are Available") { value }
        }
        pageInfo {
          hasNext
          endCursor
        }
      }
    }
  }
`;

/**
 * Step 3: Get fees container for a specific course item
 */
export const GET_COURSE_FEES_CONTAINER = /* GraphQL */ `
  query GetCourseFeesContainer($courseId: String!) {
    item(path: "", id: $courseId) {
      id
      children(search: "name:\\"Fees\\"", first: 1) {
        results {
          id
          name: field(name: "Name") { value }
        }
      }
    }
  }
`;

/**
 * Step 4: Get tuition fees from fees container
 */
export const GET_TUITION_FEES = /* GraphQL */ `
  query GetTuitionFees($feesContainerId: String!) {
    item(path: "", id: $feesContainerId) {
      id
      children(search: "name:\\"Tuition\\"", first: 10) {
        results {
          id
          feeType: field(name: "Fee Type") { value }
          amount: field(name: "Amount") { value }
          tax: field(name: "Tax") { value }
        }
      }
    }
  }
`;

/**
 * Alternative: Simple search for course sections by SIS ID
 * This might work better if the course structure is flatter
 */
export const GET_COURSE_SECTIONS_BY_SISID = /* GraphQL */ `
  query GetCourseSectionsBySisID($sisID: String!) {
    search(
      where: {
        AND: [
          { name: "_path", value: "/sitecore/content/BVC/BVC/Data/SisData/Courses", operator: CONTAINS }
          { name: "sisID", value: $sisID }
        ]
      }
      first: 50
    ) {
      results {
        id
        sisID: field(name: "sisID") { value }
        courseName: field(name: "Name") { value }
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
  }
`;

/**
 * Step for getting fees by course item ID
 */
export const GET_FEES_BY_COURSE_ID = /* GraphQL */ `
  query GetFeesByCourseId($courseId: String!) {
    search(
      where: {
        AND: [
          { name: "_path", value: $courseId, operator: CONTAINS }
          { name: "_name", value: "Fees" }
        ]
      }
      first: 1
    ) {
      results {
        id
        children {
          results {
            id
            feeType: field(name: "Fee Type") { value }
            amount: field(name: "Amount") { value }
            tax: field(name: "Tax") { value }
          }
        }
      }
    }
  }
`;