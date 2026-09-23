# Program Tuition — Refreshing the Data

How to republish program tuition after Finance updates the annual tuition
workbook. This is the **only** way those figures change: the workbook lives on
OneDrive, so no build can reach it and the hourly pipeline ships the committed
JSON untouched.

Run it when Finance sends a new workbook, or when a program page shows a price
that no longer matches it.

## What feeds what

```
Annual Tuition (Submitted)v2.xlsx      ← Finance, on OneDrive
  │   npm run generateProgramTuition
  ▼
public/data/static/program-tuition.json  ← tracked in git, COMMIT IT
  │   deploy
  ▼
https://bvc-app.vercel.app/data/static/program-tuition.json
  │   fetched by program-tuition.js on every program page
  ▼
#Tuition-and-Fees on the Webflow program template
```

## Steps

Run from `src/bvc-app/`. No `.env.local` keys are needed — it reads the workbook
and the Webflow CMS snapshot already in the repo, and calls no API.

| # | Command | What happens |
|---|---|---|
| 1 | `npm run generateProgramTuition:check` | Reads the workbook and prints the report. **Writes nothing.** |
| 2 | `npm run generateProgramTuition` | Same, and writes `public/data/static/program-tuition.json` |
| 3 | `git diff --stat public/data/static/program-tuition.json` | Confirm the change is the one you expect |
| 4 | `git add … && git commit` | The JSON is tracked; an uncommitted one never ships |
| 5 | `npm run deploy:bvcapp` (from the repo root) | Full build + deploy, ~5 min |

From the repo root, add `-w bvc-app` to steps 1–2:

```bash
npm run generateProgramTuition:check -w bvc-app
npm run generateProgramTuition -w bvc-app
```

Step 5 is the normal full pipeline (`node pipeline.mjs`). Waiting for the next
hourly run also works — it ships whatever is committed — but only after a deploy
has picked the new file up.

### A workbook somewhere else

The path is baked in as a default:

```
C:\Users\jcueto\OneDrive - Bow Valley College\General\Matrix\Tuition & Fees_Matrix\Annual Tuition (Submitted)v2.xlsx
```

Point it at another copy — a new year's workbook, or one saved from email —
without editing anything:

```bash
node scripts/generateProgramTuition.mjs --check --file "C:\path\to\Another.xlsx"
npm run generateProgramTuition -- --file "C:\path\to\Another.xlsx"
PROGRAM_TUITION_XLSX="C:\path\to\Another.xlsx" npm run generateProgramTuition
```

The file can stay open in Excel while this runs. It is only ever read.

## Reading the report

Both commands print the same thing. Check it before committing:

```
   academic year 2026-27
   63 programs · 63 domestic (11 ETI) · 57 international
   56 Webflow program pages resolve by slug
```

- **`academic year`** — from the workbook's own "… Tuition Total" header. If this
  is not the year you expect, you have the wrong workbook.
- **Webflow programs with NO tuition in the workbook** — those pages keep the
  tuition Webflow renders today. Today: the three General Arts & Sciences
  programs, English for Academic Purposes, Indigenous Foundational Learning.
- **Workbook programs with no Webflow program page** — priced but with nowhere to
  show; harmless, and worth a glance in case a page was expected.
- **Warnings** — none of these stop the write. Worth reading every time:
  a program with no total, terms that do not add up to the total column, a gap
  between priced terms, an ETI row with no Non-ETI row.

It **refuses to write** on: a missing workbook, a missing or unrecognisable
sheet, a non-numeric price cell, the same program twice in one sheet, sheets
disagreeing about the academic year, or a parse that found no programs at all.
Nothing is written when it exits non-zero, so the last good JSON survives.

## After deploying

The pages update themselves — the script fetches the JSON on every page load, so
there is nothing to republish in Webflow. To confirm a specific figure:

```bash
curl -s https://bvc-app.vercel.app/data/static/program-tuition.json \
  | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.stringify(JSON.parse(s).programs.OA,null,2)))"
```

Then load a program page and check the table. If it still shows the old figures,
check in this order: the JSON above (deploy did not happen), then the browser
console for `[ProgramTuition]` (the script names the program it could not find).

## When a program is missing or wrong

- **Page shows Webflow's old table** — the program is not in the dataset. The
  console says which code or slug it looked for. Either the workbook has no row
  for it, or its Webflow `code` differs from the workbook's; the mapping lives in
  `CODE_ALIASES` in `scripts/generateProgramTuition.mjs`.
- **Wrong program's prices** — check `EXCLUDED_CODES` in that script. `ELL` is
  excluded deliberately (the workbook's ELL is "English Language Learning", not
  the English for Academic Purposes page, which is the workbook's `EAP`), and
  `ITP` vs `UPGR-IFL` is unmapped for the same reason. Both need a person who
  owns the data to confirm the pairing — do not guess.
- **A price looks wrong, not missing** — it came out of the workbook as-is. Check
  the cell; nothing in this repo edits prices.

Background and design notes: CLAUDE.md → *bvc-app — Program tuition*. Webflow
setup: `src/bvc-app/src/webflow/program-tuition.html`.
