// app/course-list/page.tsx
import { gql, GraphQLClient } from "graphql-request";
import { getSitecoreClient } from '@/lib/config/sitecore_client';

const client = new GraphQLClient(process.env.SITECORE_GRAPHQL_ENDPOINT!);

export const revalidate = 60; // optional ISR

export default async function CourseListPage() {
    const client = getSitecoreClient();
  // 1️⃣ Fetch SIS IDs (paginated if needed)
  const { courseRoot } = await client.request<{
    courseRoot: { children: { results: { sisID: { value: string } }[] } };
  }>(gql`
    query GetCourseSisIds($first: Int! = 20, $after: String) {
      courseRoot: item(
        path: "/sitecore/content/BVC/BVC/Data/SisData/Courses"
        language: "en"
      ) {
        children(first: $first, after: $after) {
          results { sisID: field(name: "sisID") { value } }
          pageInfo { hasNext endCursor }
        }
      }
    }
  `);

  const sisIds = courseRoot.children.results.map((c) => c.sisID.value);

  // 2️⃣ Fetch each course’s children
  const detailPromises = sisIds.map((sisId) =>
    client.request<{
      course: {
        sisID: { value: string };
        courseName: { value: string };
        children: { results: { id: string; name: string; displayName?: string }[] };
      };
    }>(
      gql`
        query GetCourseChildren($path: String!) {
          course: item(path: $path, language: "en") {
            sisID: field(name: "sisID") { value }
            courseName: field(name: "Name") { value }
            children(first: 20) {
              results {
                id
                name
                displayName
              }
            }
          }
        }
      `,
      { path: `/sitecore/content/BVC/BVC/Data/SisData/Courses/${sisId}` }
    )
  );

  let courses = await Promise.all(detailPromises);

  // ✂️ Only keep those with at least one child
  courses = courses.filter(({ course }) => course.children.results.length > 0);

  return (
    <div className="space-y-8">
      {courses.map(({ course }) => (
        <section key={course.sisID.value}>
          <h2 className="text-2xl font-semibold">
            {course.courseName.value} ({course.sisID.value})
          </h2>
          <ul className="list-disc list-inside">
            {course.children.results.map((child) => (
              <li key={child.id}>
                {child.displayName ?? child.name}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
