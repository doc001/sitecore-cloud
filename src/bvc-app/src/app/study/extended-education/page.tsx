// src/app/study/extended-education/courses/page.tsx
import Link from "next/link";
import { getCourseStatistics, type CourseSummary } from "@/lib/courseUtils";


// Static generation for the courses landing page
export const dynamic = 'force-static';

/**
 * Generate metadata for the courses listing page
 */
export async function generateMetadata() {
  const stats = getCourseStatistics();

  return {
    title: 'Extended Education Courses - Course Catalog',
    description: `Browse ${stats.availableCourses} available extended education courses. Find course sections, schedules, and fees.`,
    openGraph: {
      title: 'Extended Education Courses',
      description: `${stats.availableCourses} courses available with detailed section information`,
    }
  };
}

/**
 * Main courses landing page component
 * Displays all available courses with links to detailed pages
 */
export default function CoursesLandingPage() {
  const stats = getCourseStatistics();
  const availableCourses = stats.courses.filter(c => c.hasValidData);
  const unavailableCourses = stats.courses.filter(c => !c.hasValidData);


  
  return (
    <div className="container-layout min-h-screen">
      {/* Header Section */}
      <header className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          Extended Education Courses
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Explore our comprehensive catalog of extended education courses. 
          Each course listing includes detailed section information, schedules, and fees.
        </p>
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {stats.availableCourses}
            </div>
            <div className="text-sm font-medium text-blue-800">Available Courses</div>
          </div>
          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {stats.totalSections}
            </div>
            <div className="text-sm font-medium text-green-800">Total Sections</div>
          </div>
          <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {stats.sectionsWithFees}
            </div>
            <div className="text-sm font-medium text-purple-800">Sections with Fees</div>
          </div>
        </div>
      </header>
      {/* Breadcrumb Navigation - Using the reusable component */}
      {/* <Breadcrumb 
        items={breadcrumbItems} 
        variant="program"
        showHomeIcon={true}
      /> */}
      {/* Available Courses Section */}
      <main>
        <section className="mb-12">
          <h2 className="text-3xl font-semibold mb-8 text-gray-900">Available Courses</h2>
          
          {availableCourses.length === 0 ? (
            <EmptyCoursesMessage />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableCourses.map((course) => (
                <CourseCard key={course.sisID} course={course} />
              ))}
            </div>
          )}
        </section>

        {/* Unavailable Courses Section */}
        {unavailableCourses.length > 0 && (
          <UnavailableCoursesSection courses={unavailableCourses} />
        )}
      </main>

      {/* Footer Information */}
      <HelpFooter />
    </div>
  );
}

/**
 * Course Card Component
 */
function CourseCard({ course }: { course: CourseSummary }) {
  return (
    <Link
      href={`/study/extended-education/courses/${course.sisID}`}
      className="group block bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-blue-300"
    >
      <article>
        {/* Course Header */}
        <div className="mb-4">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
              {course.name}
            </h3>
            <div className="ml-3 flex-shrink-0">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {course.sisID}
              </span>
            </div>
          </div>
        </div>

        {/* Course Statistics */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-lg font-bold text-gray-900">
              {course.totalSections}
            </div>
            <div className="text-xs text-gray-600">Sections</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-lg font-bold text-green-600">
              {course.sectionsWithFees}
            </div>
            <div className="text-xs text-green-700">With Fees</div>
          </div>
        </div>

        {/* Hover indicator */}
        <div className="mt-4 flex items-center text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-sm font-medium">View Details</span>
          <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </article>
    </Link>
  );
}

/**
 * Empty Courses Message Component
 */
function EmptyCoursesMessage() {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
      <div className="text-yellow-600 text-lg font-medium mb-2">No Courses Available</div>
      <div className="text-yellow-700">
        There are currently no courses available. Please check back later.
      </div>
    </div>
  );
}

/**
 * Unavailable Courses Section Component
 */
function UnavailableCoursesSection({ courses }: { courses: CourseSummary[] }) {
  return (
    <section>
      <h2 className="text-2xl font-semibold mb-6 text-gray-700">Courses Coming Soon</h2>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <p className="text-gray-600 mb-4">
          The following courses are being prepared and will be available soon:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {courses.map((course) => (
            <div
              key={course.sisID}
              className="bg-white border border-gray-200 rounded-lg p-3 text-center"
            >
              <div className="text-sm font-medium text-gray-900 mb-1">
                {course.sisID}
              </div>
              <div className="text-xs text-gray-500">Coming Soon</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Help Footer Component
 */
function HelpFooter() {
  return (
    <footer className="mt-16 pt-8 border-t border-gray-200">
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Need Help?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
          <div>
            <p className="mb-2">
              <strong>Registration Questions:</strong><br />
              Contact the Registrar's Office for assistance with course registration, 
              prerequisites, and academic planning.
            </p>
          </div>
          <div>
            <p className="mb-2">
              <strong>Technical Support:</strong><br />
              If you encounter issues with course information or need technical assistance, 
              please contact our IT support team.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}