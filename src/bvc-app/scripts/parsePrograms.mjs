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

  const programs = items
    .filter(item => !item.isArchived && !item.isDraft)
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

  await fs.writeFile(outputPath, JSON.stringify(programs, null, 2));
  console.log(`Wrote ${programs.length} programs to ${outputPath}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

export default main;
