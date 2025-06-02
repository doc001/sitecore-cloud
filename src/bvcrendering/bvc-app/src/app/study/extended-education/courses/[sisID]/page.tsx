// src/app/study/extended-education/courses/[sisID]/page.tsx
"use server"

import { notFound } from "next/navigation";
import validCourses from "@/data/validCourses.json";
import { GET_COURSE_HIERARCHY_BY_SISID } from "@/lib/queries/getCourseHierarchyBySisId";

export const revalidate = 60;

export async function generateStaticParams(): Promise<{ sisID: string }[]> {
  // validCourses.json should be an array of strings (e.g. ["ABC123", "DEF456", …])
  return (validCourses as string[]).map((sisID) => ({ sisID }));
}

// ——— Make sure this function is declared with `async` ———
export default async function Page({
  params,
}: {
  params: { sisID: string };
}) {
  // Because this is `async`, Next.js will await `params` properly.
  const { sisID } = params;

  const endpoint = process.env.SITECORE_GRAPHQL_ENDPOINT!;
  const apiKey = process.env.SITECORE_API_KEY!; // or SC_APIKEY

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      sc_apikey: apiKey,
    },
    body: JSON.stringify({
      query: GET_COURSE_HIERARCHY_BY_SISID,
      variables: { sisID, after: null },
    }),
  });

  if (!response.ok) {
    return notFound();
  }

  const json = await response.json();
  const courseRoot = json?.data?.search?.results?.[0];

  if (
    !courseRoot ||
    !Array.isArray(courseRoot.children?.results) ||
    courseRoot.children.results.length === 0
  ) {
    return notFound();
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">
        {courseRoot.name?.value ?? "Unnamed Course"}
      </h1>

      <ul className="mt-4 space-y-6">
        {courseRoot.children.results.map((child: any) => {
          const tuition = child?.feesContainer?.[0]?.tuition?.[0];
          return (
            <li key={child.id} className="border-b pb-4">
              <strong>{child.courseName?.value ?? "Untitled Offering"}</strong>{" "}
              (SIS ID: {child.sisID?.value ?? "?"})
              <br />
              Delivery: {child.deliveryType?.value ?? "N/A"} | Campus:{" "}
              {child.campus?.value ?? "N/A"} | Hours: {child.hours?.value ?? "?"}
              <br />
              Registration: {child.registrationStart?.value ?? "?"} →{" "}
              {child.registrationEnd?.value ?? "?"}
              <br />
              Dates: {child.startDate?.value ?? "?"} → {child.endDate?.value ?? "?"}
              <br />
              Seats Available: {child.seatsAvailable?.value ?? "?"}

              {tuition ? (
                <ul className="ml-4 mt-2 text-sm text-gray-600">
                  <li>Fee Type: {tuition.feeType?.value ?? "N/A"}</li>
                  <li>Amount: {tuition.amount?.value ?? "$0"}</li>
                  <li>Tax: {tuition.tax?.value ?? "0%"}</li>
                </ul>
              ) : (
                <p className="text-sm italic text-gray-400 mt-2">
                  No tuition data found.
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
