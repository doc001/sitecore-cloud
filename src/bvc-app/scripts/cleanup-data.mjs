import { rmSync, existsSync, readdirSync, statSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "src", "data");

const foldersToEmpty = ["courses", "oScourses"];

const filesToDelete = [
  "coursesData.json",
  "extractionStats.json",
  "osValidCourses.json",
  "validCourses.json",
  "summary-stats.json",
  "sis-data.json",
  "sis-data-lookup.json",
];

let deleted = 0;

for (const folder of foldersToEmpty) {
  const folderPath = join(dataDir, folder);
  if (!existsSync(folderPath)) continue;
  for (const entry of readdirSync(folderPath)) {
    const entryPath = join(folderPath, entry);
    rmSync(entryPath, { recursive: true, force: true });
    deleted++;
  }
  console.log(`Cleared: src/data/${folder}/ (${deleted} files removed)`);
  deleted = 0;
}

for (const file of filesToDelete) {
  const filePath = join(dataDir, file);
  if (!existsSync(filePath)) continue;
  rmSync(filePath, { force: true });
  console.log(`Deleted: src/data/${file}`);
}

console.log("Post-deploy data cleanup complete.");
