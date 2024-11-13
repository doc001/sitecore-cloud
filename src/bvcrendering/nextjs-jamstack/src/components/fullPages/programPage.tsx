'use client'
import React, { useState } from 'react'
import { courses } from '@/lib/courses/coursesData'

// export function generateStaticParams() {
//   return courses.map((course) => ({ slug: course.slug }))
// }

export default function programPage() {

  const [courseInfo] = useState(courses);

  return (
    <>
    <style
    dangerouslySetInnerHTML={{
      __html: "@media (max-width: 767px) {\n#banner {\npadding-top: 60px !important; padding-right: 15px !important; padding-bottom: 60px !important; padding-left: 15px !important;\n}\n}\n@media (max-width: 991px) {\n#bannerSize {\nmax-width: 728px !important;\n}\n}\n@media (max-width: 479px) {\n#bannerSize {\nmax-width: none !important;\n}\n}\n",
    }}
  />

  <section
    id="banner"
    style={{
      backgroundColor: "rgb(242, 242, 242)",
      borderBottomColor: "rgb(228, 235, 243)",
      borderBottomWidth: "2px",
      borderStyle: "solid",
      color: "rgb(51, 51, 51)",
      fontSize: "14px",
      paddingBottom: "80px",
      paddingLeft: "0",
      paddingRight: "0",
      paddingTop: "80px",
    }}>
    <div
      id="bannerSize"
      style={{
        margin: "auto",
        width: "80%",
      }}>
      <div
        style={{
          display: "grid",
          gap: "20px",
          gridAutoColumns: "1fr",
          gridTemplateColumns: "1fr .5fr",
          gridTemplateRows: "auto",
          justifyContent: "center",
        }}>
        <div
          style={{
            alignItems: "flex-start",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
          }}>
          <h1
            style={{
              alignSelf: "flex-start",
              fontSize: "48px",
              fontWeight: "500",
              margin: ".67em 0",
              marginBottom: "10px",
            }}>
            { courseInfo.map((item) => (item.programName)) }
          </h1>
          <p
            style={{
              fontSize: "18px",
              marginBottom: "48px",
            }}>
            { courseInfo.map((item) => (item.shortDescription)) }
          </p>
        </div>
        <div
          style={{
            alignItems: "flex-start",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
          }}
        />
      </div>
    </div>
  </section>
    </>
  );
}

