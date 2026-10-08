// lib/careerAdvisor/checklistPdf.ts
/**
 * PROTO: Renders an admission checklist as a printable, BVC-branded PDF.
 *
 * Imported lazily (only when someone clicks Download), so jsPDF never weighs
 * on the page load. The content comes from the Career Advisor's
 * create_admission_checklist tool; the program title, year and link come from
 * the catalog, not the model.
 *
 * Uses the built-in Helvetica: embedding Poppins would add ~150 KB of font per
 * file. Brand colours match the tokens in globals.css.
 */
import { jsPDF } from 'jspdf';
import type { AdmissionChecklist } from './agent';

type RGB = [number, number, number];
const NAVY: RGB = [3, 26, 98];
const PURPLE: RGB = [106, 76, 215];
const RED: RGB = [255, 0, 58];
const ORANGE: RGB = [255, 135, 0];
const BLUE: RGB = [0, 163, 255];
const TEXT: RGB = [51, 51, 51];
const MUTED: RGB = [102, 102, 102];

const PAGE_W = 612; // US Letter, points
const PAGE_H = 792;
const MARGIN = 54;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FOOTER_H = 54;
const BOX = 10;

/**
 * Helvetica in jsPDF covers Latin-1 only. Fold the typographic punctuation the
 * program pages use, and drop anything else rather than print garbage.
 */
const pdfText = (s: string) =>
  s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/[•·]/g, '-')
    .replace(/ /g, ' ')
    .replace(/[^\u0000-ÿ]/g, '');

export function renderChecklistPdf(checklist: AdmissionChecklist): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  let y = MARGIN;

  const color = (c: RGB) => doc.setTextColor(c[0], c[1], c[2]);
  const font = (style: 'normal' | 'bold', size: number) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
  };
  const lineHeight = (size: number) => size * 1.35;

  /** Start a new page if the next block would run into the footer. */
  const ensure = (height: number) => {
    if (y + height > PAGE_H - FOOTER_H) {
      doc.addPage();
      y = MARGIN;
    }
  };

  const paragraph = (text: string, x: number, width: number, size: number, style: 'normal' | 'bold', c: RGB) => {
    font(style, size);
    color(c);
    const lines: string[] = doc.splitTextToSize(pdfText(text), width);
    for (const line of lines) {
      ensure(lineHeight(size));
      doc.text(line, x, y + size);
      y += lineHeight(size);
    }
  };

  const checkbox = (x: number, top: number) => {
    doc.setDrawColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.setLineWidth(1);
    doc.roundedRect(x, top, BOX, BOX, 1.5, 1.5, 'S');
  };

  /** One checkable line: box on the left, wrapped text beside it. */
  const item = (text: string, indent: number, size = 10.5, style: 'normal' | 'bold' = 'normal') => {
    const x = MARGIN + indent;
    const textX = x + BOX + 8;
    font(style, size);
    const lines: string[] = doc.splitTextToSize(pdfText(text), CONTENT_W - indent - BOX - 8);
    ensure(lineHeight(size) * Math.min(lines.length, 2));
    checkbox(x, y + 2);
    color(TEXT);
    for (const line of lines) {
      ensure(lineHeight(size));
      doc.text(line, textX, y + size);
      y += lineHeight(size);
    }
    y += 4;
  };

  // ── Brand rule ────────────────────────────────────────────────────────────
  const stripe = [NAVY, PURPLE, RED, ORANGE, BLUE];
  stripe.forEach((c, i) => {
    doc.setFillColor(c[0], c[1], c[2]);
    doc.rect((PAGE_W / stripe.length) * i, 0, PAGE_W / stripe.length + 1, 6, 'F');
  });

  // ── Header ────────────────────────────────────────────────────────────────
  font('bold', 9);
  color(PURPLE);
  doc.text('BOW VALLEY COLLEGE  |  ADMISSION CHECKLIST', MARGIN, y + 9);
  y += 22;
  paragraph(checklist.programTitle, MARGIN, CONTENT_W, 20, 'bold', NAVY);
  const meta = [checklist.credential, checklist.academicYear && `${checklist.academicYear} admission requirements`]
    .filter(Boolean)
    .join('  |  ');
  if (meta) paragraph(meta, MARGIN, CONTENT_W, 10, 'normal', MUTED);
  y += 6;
  if (checklist.intro) {
    paragraph(checklist.intro, MARGIN, CONTENT_W, 10.5, 'normal', TEXT);
    y += 6;
  }

  // ── Sections ──────────────────────────────────────────────────────────────
  for (const section of checklist.sections) {
    y += 8;
    ensure(48);
    paragraph(section.heading, MARGIN, CONTENT_W, 13, 'bold', NAVY);
    doc.setDrawColor(PURPLE[0], PURPLE[1], PURPLE[2]);
    doc.setLineWidth(1.5);
    doc.line(MARGIN, y + 1, MARGIN + 36, y + 1);
    y += 8;
    if (section.note) {
      paragraph(section.note, MARGIN, CONTENT_W, 9.5, 'normal', MUTED);
      y += 4;
    }
    for (const it of section.items) {
      if (it.options.length) {
        // An "OR" requirement: a heading line, then one box per path
        item(it.text, 0, 10.5, 'bold');
        it.options.forEach((option, i) => {
          if (i > 0) {
            font('bold', 8.5);
            color(PURPLE);
            ensure(14);
            doc.text('OR', MARGIN + 22, y + 7);
            y += 12;
          }
          item(option, 22, 10);
        });
        y += 4;
      } else {
        item(it.text, 0);
      }
    }
  }

  // ── Next steps ────────────────────────────────────────────────────────────
  if (checklist.nextSteps.length) {
    y += 8;
    ensure(48);
    paragraph('Next steps', MARGIN, CONTENT_W, 13, 'bold', NAVY);
    doc.setDrawColor(PURPLE[0], PURPLE[1], PURPLE[2]);
    doc.setLineWidth(1.5);
    doc.line(MARGIN, y + 1, MARGIN + 36, y + 1);
    y += 8;
    for (const step of checklist.nextSteps) item(step, 0);
  }

  // ── Footer on every page ──────────────────────────────────────────────────
  const generated = new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setDrawColor(229, 229, 229);
    doc.setLineWidth(0.75);
    doc.line(MARGIN, PAGE_H - FOOTER_H + 8, PAGE_W - MARGIN, PAGE_H - FOOTER_H + 8);
    font('normal', 8);
    color(MUTED);
    doc.text(
      pdfText(
        `Requirements can change, and only BVC Admissions can confirm you meet them. Made ${generated} from BVC's program information.`
      ),
      MARGIN,
      PAGE_H - FOOTER_H + 22
    );
    if (checklist.programUrl) {
      color(PURPLE);
      doc.textWithLink(checklist.programUrl, MARGIN, PAGE_H - FOOTER_H + 34, { url: checklist.programUrl });
    }
    color(MUTED);
    doc.text(`Page ${p} of ${pages}`, PAGE_W - MARGIN, PAGE_H - FOOTER_H + 34, { align: 'right' });
  }

  return doc;
}

export function checklistFilename(checklist: AdmissionChecklist): string {
  const slug = checklist.programTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `BVC-${slug}-admission-checklist.pdf`;
}

/** Build the PDF and hand it to the browser as a download. */
export function downloadChecklist(checklist: AdmissionChecklist): void {
  renderChecklistPdf(checklist).save(checklistFilename(checklist));
}
