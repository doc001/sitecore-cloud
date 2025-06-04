// src/lib/queries/getCoursesWorking.js

/**
 * Working GraphQL queries for Sitecore XMC
 * Uses direct path-based item lookup which works reliably
 */

export const GET_COURSE_BY_PATH = /* GraphQL */ `
  query GetCourseBySisID($coursePath: String!) {
    item(path: $coursePath, language: "en") {
      id
      name: field(name: "Name") { value }
      children {
        results {
          id
          name
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
  }
`;

export const GET_COURSE_FEES_BY_PATH = /* GraphQL */ `
  query GetCourseFeesBySisID($coursePath: String!) {
    item(path: $coursePath, language: "en") {
      children {
        results {
          name
          children {
              results {
              FeeType:field(name: "Fee Type") {
                value
              }  
              Amount: field(name: "amount") {
                value
              }
              TimeBlock: field(name: "TimeBlock") {
                value
              }
              Day: field(name: "Day") {
                value
              }
              }
            }
        }
      }
    }
  }
`;