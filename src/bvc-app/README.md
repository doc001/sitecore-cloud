# bvc-app

Next.js 15 / React 19 application for Bow Valley College. Statically generated at build time (`output: "export"`), deployed to Vercel.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build Pipeline

The build fetches data from external sources, generates static JSON, then runs `next build`:

```bash
npm run build    # Full pipeline: data scripts → breadcrumbs → next build
```

Individual data scripts:

| Script | Purpose | Output |
|---|---|---|
| `getWebflowData` | Fetch Webflow CMS collections | `src/data/cms/*.json` |
| `generateCourses` | Export valid Extended Ed course list | `src/data/validCourses.json` |
| `generateOpenStudies` | Export valid Open Studies course list | `src/data/osValidCourses.json` |
| `generateMap` | Generate SIS data mapping | `src/data/sis-data*.json` |
| `generateCourseData` | Fetch Extended Ed courses from Sitecore XMC | `src/data/courses/*.json` |
| `generateOpenStudiesData` | Fetch Open Studies courses from Sitecore XMC | `src/data/oScourses/*.json` |
| `generateOpenStudiesJson` | Generate OS public index + per-course files | `public/data/open-studies/` |
| `breadcrumbs:all` | Regenerate navigation breadcrumbs | `src/data/static/` |
| `bvcapp-scripts` | Run full pipeline (all above + copy) | — |

## Data Sources

- **Webflow API** (`WEBFLOW_API_KEY`) — CMS content (programs, events, news)
- **Sitecore XM Cloud GraphQL** (`SITECORE_GRAPHQL_ENDPOINT` + `SITECORE_GRAPHQL_API_KEY`) — SIS course data (sections, fees, schedules)

## Key Routes

| Route | Data source |
|---|---|
| `/` | Static |
| `/programs/[slug]` | `cms/programs.parsed.json` |
| `/program-list` | CMS JSON |
| `/study/extended-education/courses/[sisID]` | `courses/course-{sisID}.json` |
| `/study/open-studies/courses/[sisID]` | `oScourses/course-{sisID}.json` |
| `/apply/i-am-ready/[slug]` | CMS JSON |

## Webflow Embeds

Standalone HTML snippets in `src/webflow/` are pasted into Webflow "Embed" blocks. They fetch JSON from the Vercel deployment at runtime.

| File | Purpose |
|---|---|
| `open-studies-listing.html` | OS program page — accordion table by category |
| `open-studies-course.html` | OS course detail — description, offerings, add-to-cart |
| `extended-education-listing.html` | EE program page — searchable flat table |
| `extended-education-course.html` | EE course detail — same layout as OS |

Course detail embeds render into the existing `#courseComponent` div and output `.addtocartbutton` elements compatible with the separate CartManager ecommerce script.

Key behaviours:
- **Two-level grouping**: sections are grouped by Delivery Type → Campus, each with its own heading
- **Accordion fields**: Credits, Fee, Dates, Days, Time (seats hidden; location in campus heading)
- **Dates**: derived from `timeBlock.startTime/endTime` (actual class dates), falling back to `section.startDate/endDate`
- **PDF outlines** (OS only): path is `/data/course-outlines-pdf/{pdfFilename}` from the course index
- **GUID resolution**: delivery types and campuses resolved via hardcoded lookup + `/data/sis-data-lookup.json`

## Environment Variables

Create `.env.local`:

```
WEBFLOW_API_KEY=...
SITECORE_GRAPHQL_ENDPOINT=...
SITECORE_GRAPHQL_API_KEY=...
```

## Notes

- TypeScript errors are suppressed at build (`ignoreBuildErrors: true`)
- Static export — no SSR, no middleware, no API routes
- Images are unoptimized (`next/image` disabled)
- Console logs stripped in production builds
