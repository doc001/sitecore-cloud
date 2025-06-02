import HeroExtendedEducation from "@/components/banners/HeroExtendedEducation";
import CourseGrid from "@/components/sections/CourseGrid";
import { gql, GraphQLClient } from "graphql-request";

const GET_COURSE_SIS_IDS = gql`
  query GetCourseSisIds($after: String) {
    courseRoot: item(
      path: "/sitecore/content/BVC/BVC/Data/SisData/Courses"
      language: "en"
    ) {
      children(first: 20, after: $after) {
        results {
          sisID: field(name: "sisID") { value }
          courseName: field(name: "Name") { value }
          children(first: 1) {
            results { id }
          }
        }
        pageInfo {
          hasNext
          endCursor
        }
      }
    }
  }
`;

export const revalidate = 60;

export default async function ExtendedEducationPage() {
  const client = new GraphQLClient(process.env.SITECORE_GRAPHQL_ENDPOINT!, {
    headers: {
      sc_apikey: process.env.SITECORE_API_KEY!,
    },
  });

  let courses: Array<{ area: string; href: string; name: string; description: string }> = [];
  let after: string | null = null;
  let hasNext = true;

  while (hasNext && courses.length < 20) {
    const data: any = await client.request(GET_COURSE_SIS_IDS, { after });

    const { results, pageInfo } = data.courseRoot.children;
    after = pageInfo.endCursor;
    hasNext = pageInfo.hasNext;

    const filtered = results.filter((item: any) => item.children?.results.length > 0);

    const mapped = filtered.map((item: any) => ({
      area: "",
      href: `/study/extended-education/courses/${item.sisID.value}`, // <-- Updated route
      name: item.courseName.value,
      description: "",
    }));

    courses.push(...mapped);
  }

  return (
    <>
      <HeroExtendedEducation
        title="Extended Education"
        backgroundImage="https://example.com/your-image.webp"
      />
      <main className="container-layout">
        <CourseGrid courses={courses} />
      </main>
    </>
  );
}
