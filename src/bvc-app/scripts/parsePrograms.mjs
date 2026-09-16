import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the absolute project root regardless of where script is run
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..'); // parent of /scripts

function stripHtml(html = '') {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

async function main() {
  const inputPath = path.resolve(projectRoot, 'src/data/cms/programs.json');
  const outputPath = path.resolve(projectRoot, 'src/data/cms/programs.parsed.json');

  const json = JSON.parse(await fs.readFile(inputPath, 'utf-8'));
  const { items } = json;
  if (!Array.isArray(items)) {
    throw new Error(`${path.relative(projectRoot, inputPath)} has no "items" array — run "npm run getWebflowData" first.`);
  }

  // "Published at least once, not archived" — NOT !isDraft.
  //
  // The Webflow API returns the STAGED list, where isDraft is set on any item
  // carrying unpublished edits, not just on items that have never gone live. 32
  // program records are flagged isDraft while holding a lastPublished date, and
  // they include Practical Nurse, Administrative Professional, Human Resources
  // and Software Development — all live on bowvalleycollege.ca today. Filtering
  // on !isDraft dropped 39 of 62 routes, live ones included.
  const programs = items
    .filter(item => !item.isArchived && !!item.lastPublished)
    .map(item => {
      const f = item.fieldData;
      return {
        name: stripHtml(f['name']),
        slug: f['slug'],
        code: f['code'],
        shortDescription: stripHtml(f['short-description'] || ''),
        descriptionHtml: f['program-description'] || '',
        requirementsHtml: f['admin-req'] || '',
        programType: f['program-type'] || '',
        duration: f['duration'] || '',
        area: f['program-area'] || '',
        school: f['school'] || '',
        coursesHtml: f['courses-code'] || '',
        tuitionFees: f['tuition-fees'] || [],
        additionalFees: f['additional-fees-2'] || '',
        category: f['category'] || '',
        pgwp: !!f['pgwp'],
        applyButtonIsEnglish: !!f['apply-button-is-english-learing-skill'],
        intakes: f['availabe-intakes-2'] || [],
        isZeroTextbook: !!f['has-zero-textbook-cost'],
        isFirstYear: !!f['apply-button-is-first-year-student'],
      };
    });

  // Every /programs/[slug] route is generated from this file, so an empty result
  // would silently remove all of them from the build. A CMS snapshot with no
  // published programs is a failed fetch, not a college with no programs.
  if (programs.length === 0) {
    throw new Error(
      `${path.relative(projectRoot, inputPath)} has ${items.length} item(s) but none published. ` +
        `Refusing to write ${path.relative(projectRoot, outputPath)} — every /programs/[slug] route would disappear.`
    );
  }

  await fs.writeFile(outputPath, JSON.stringify(programs, null, 2));
  console.log(`Wrote ${programs.length} programs to ${outputPath}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(`❌ parsePrograms failed: ${err.message}`);
    process.exit(1);
  });
}

export default main;
