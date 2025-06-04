import dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });

import { GraphQLClient, gql } from 'graphql-request';
import { writeFileSync } from 'fs';


const client = new GraphQLClient(process.env.SITECORE_GRAPHQL_ENDPOINT, {
  headers: {
    sc_apikey: process.env.SC_APIKEY,
  },
});

const GET_ALL_COURSE_ROOTS = gql`
  query GetCourseSisIds($after: String) {
    courseRoot: item(
      path: "/sitecore/content/BVC/BVC/Data/SisData/Credit Courses"
      language: "en"
    ) {
      children(first: 20, after: $after) {
        results {
          sisID: field(name: "sisID") { value }
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

async function run() {
  let after = null;
  let hasNext = true;
  const validCourses = [];

  while (hasNext) {
    const data = await client.request(GET_ALL_COURSE_ROOTS, { after });
    const children = data?.courseRoot?.children;

    if (!children?.results) break;

    for (const item of children.results) {
      const hasChildren = item?.children?.results?.length > 0;
      const sisID = item?.sisID?.value;
      if (sisID && hasChildren) {
        validCourses.push(sisID);
      }
    }

    after = children.pageInfo?.endCursor ?? null;
    hasNext = children.pageInfo?.hasNext ?? false;
  }

  writeFileSync('src/data/osValidCourses.json', JSON.stringify(validCourses, null, 2));
  console.log(`✅ Exported ${validCourses.length} valid courses to public/osValidCourses.json`);
}

run().catch((err) => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});
