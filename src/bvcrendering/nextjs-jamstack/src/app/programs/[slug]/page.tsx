import { courses } from '@/lib/courses/coursesData'
// import ProgramPage from '@/components/fullPages/programPage'

// List Parameters that we need for the page to render
export function generateStaticParams() {
 return courses.map( course => {
    return { slug: course.slug }
 })
}
export function generateMetadata({ params }: any) {
    const course = courses.filter( course => {
        return course.slug === params.slug
    })[0]

    return {
        title: course.programName,
        description: course.shortDescription
    }
}


// Return the page content for this specific course
export default function Page( { params }:any ) {
    const course = courses.filter( course => {
        return course.slug === params.slug
    })[0]

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
            { course.programName }
          </h1>
          <p
            style={{
              fontSize: "18px",
              marginBottom: "48px",
            }}>
            { course.shortDescription }
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
  <div
  style={{
    backgroundColor: "rgb(0, 163, 255)",
    color: "rgb(255, 255, 255)",
    display: "grid",
    fontSize: "14px",
    fontWeight: "300",
    gridAutoColumns: "1fr",
    gridTemplateColumns: "1fr 1fr",
    gridTemplateRows: "auto auto auto auto",
    justifyContent: "center",
    maxWidth: "350px",
    padding: "24px",
  }}>
  <div
    style={{
      alignItems: "flex-start",
      display: "flex",
      flexDirection: "column",
      fontWeight: "500",
      justifyContent: "flex-start",
    }}>
    <p
      style={{
        marginBottom: "10px",
      }}>
      Credential:
    </p>
  </div>
  <div
    style={{
      alignItems: "flex-start",
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-start",
    }}>
    <p
      style={{
        marginBottom: "10px",
      }}>
      {course.programType}
    </p>
  </div>
  <div
    style={{
      alignItems: "flex-start",
      display: "flex",
      flexDirection: "column",
      fontWeight: "500",
      justifyContent: "flex-start",
    }}>
    <p
      style={{
        marginBottom: "10px",
      }}>
      Program length
    </p>
  </div>
  <div
    style={{
      alignItems: "flex-start",
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-start",
    }}>
    <p
      style={{
        marginBottom: "10px",
      }}>
      {course.duration}
    </p>
  </div>
  <div
    style={{
      alignItems: "flex-start",
      display: "flex",
      flexDirection: "column",
      fontWeight: "500",
      justifyContent: "flex-start",
    }}>
    <p
      style={{
        marginBottom: "10px",
      }}>
      Location:
    </p>
  </div>
  <div
    style={{
      alignItems: "flex-start",
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-start",
    }}>
    <p
      style={{
        marginBottom: "10px",
      }}>
        Calgary Campus
    </p>
  </div>
  <div
    style={{
      alignItems: "flex-start",
      display: "flex",
      flexDirection: "column",
      fontWeight: "500",
      justifyContent: "flex-start",
    }}>
    <p
      style={{
        marginBottom: "10px",
      }}>
      Availability:
    </p>
  </div>
  <div
    style={{
      alignItems: "flex-start",
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-start",
    }}>
    <p
      style={{
        marginBottom: "10px",
      }}>
      Domestic<br/>International
    </p>
  </div>
</div>


    </>
    )
    // return <ProgramPage />
}