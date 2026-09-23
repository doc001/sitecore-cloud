/**
 * Minimal, dependency-free .xlsx reader — cell VALUES only.
 *
 * An .xlsx is a ZIP of XML parts. Everything needed to read cached cell values
 * is in three of them: xl/workbook.xml (sheet names), its .rels (sheet name →
 * part path) and xl/sharedStrings.xml (the string table cells index into).
 * Node's built-in zlib inflates the parts, so no package is needed.
 *
 * Deliberately out of scope: styles, number formats, dates-as-serials,
 * formulas (the cached <v> result is returned, which is what Excel last
 * displayed), ZIP64, and encrypted workbooks. Anything outside that throws
 * rather than returning partial data.
 */

import fs from 'fs';
import zlib from 'zlib';

const SIG_EOCD = 0x06054b50;
const SIG_CENTRAL = 0x02014b50;
const SIG_LOCAL = 0x04034b50;

function readZipEntries(buf) {
  let eocd = -1;
  // The EOCD record is 22 bytes plus a comment of at most 65535 bytes.
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 0xffff); i--) {
    if (buf.readUInt32LE(i) === SIG_EOCD) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('Not a ZIP file (no end-of-central-directory record) — is this really an .xlsx?');

  const count = buf.readUInt16LE(eocd + 10);
  let offset = buf.readUInt32LE(eocd + 16);
  if (offset === 0xffffffff) throw new Error('ZIP64 workbooks are not supported.');

  const entries = new Map();
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(offset) !== SIG_CENTRAL) throw new Error('Corrupt ZIP central directory.');
    const method = buf.readUInt16LE(offset + 10);
    const compSize = buf.readUInt32LE(offset + 20);
    const nameLen = buf.readUInt16LE(offset + 28);
    const extraLen = buf.readUInt16LE(offset + 30);
    const commentLen = buf.readUInt16LE(offset + 32);
    const localOffset = buf.readUInt32LE(offset + 42);
    const name = buf.toString('utf8', offset + 46, offset + 46 + nameLen);
    entries.set(name, { method, compSize, localOffset });
    offset += 46 + nameLen + extraLen + commentLen;
  }

  return function read(name) {
    const entry = entries.get(name);
    if (!entry) return null;
    const at = entry.localOffset;
    if (buf.readUInt32LE(at) !== SIG_LOCAL) throw new Error(`Corrupt ZIP local header for ${name}.`);
    const start = at + 30 + buf.readUInt16LE(at + 26) + buf.readUInt16LE(at + 28);
    const data = buf.subarray(start, start + entry.compSize);
    if (entry.method === 0) return data.toString('utf8');
    if (entry.method === 8) return zlib.inflateRawSync(data).toString('utf8');
    throw new Error(`Unsupported ZIP compression method ${entry.method} for ${name}.`);
  };
}

function decodeXml(text) {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function attrs(source) {
  const out = {};
  for (const m of source.matchAll(/([\w:]+)\s*=\s*"([^"]*)"/g)) out[m[1]] = decodeXml(m[2]);
  return out;
}

/** All <t> runs of a string item, ignoring phonetic (<rPh>) annotations. */
function textRuns(xml) {
  return [...xml.replace(/<rPh\b[\s\S]*?<\/rPh>/g, '').matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)]
    .map((m) => decodeXml(m[1]))
    .join('');
}

function parseSheet(xml, sharedStrings) {
  const cells = {};
  for (const m of xml.matchAll(/<c\b([^>]*?)(\/>|>([\s\S]*?)<\/c>)/g)) {
    const a = attrs(m[1]);
    const body = m[3] || '';
    if (!a.r) continue;

    let value = null;
    const v = body.match(/<v>([\s\S]*?)<\/v>/);
    switch (a.t) {
      case 's': value = v ? sharedStrings[Number(v[1])] ?? null : null; break;
      case 'inlineStr': value = textRuns(body); break;
      case 'str': value = v ? decodeXml(v[1]) : null; break;
      case 'b': value = v ? v[1] === '1' : null; break;
      case 'e': value = null; break; // #REF!, #DIV/0! … — no usable value
      default: value = v ? Number(v[1]) : null;
    }
    if (value !== null && value !== '') cells[a.r] = value;
  }
  return cells;
}

/**
 * @param {string} file  path to an .xlsx
 * @returns {{ name: string, cells: Record<string, string|number|boolean> }[]}
 *          sheets in workbook order, cells keyed by A1 reference
 */
export function readXlsx(file) {
  const read = readZipEntries(fs.readFileSync(file));

  const workbook = read('xl/workbook.xml');
  if (!workbook) throw new Error(`${file} has no xl/workbook.xml — not an .xlsx workbook.`);

  const rels = {};
  for (const m of (read('xl/_rels/workbook.xml.rels') || '').matchAll(/<Relationship\b([^>]*)\/?>/g)) {
    const a = attrs(m[1]);
    rels[a.Id] = a.Target.startsWith('/') ? a.Target.slice(1) : `xl/${a.Target}`;
  }

  const sharedXml = read('xl/sharedStrings.xml') || '';
  const sharedStrings = [...sharedXml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map((m) => textRuns(m[1]));

  return [...workbook.matchAll(/<sheet\b([^>]*)\/?>/g)].map((m) => {
    const a = attrs(m[1]);
    const part = rels[a['r:id']];
    const xml = part && read(part);
    if (!xml) throw new Error(`Sheet "${a.name}" points at a missing part (${part}).`);
    return { name: a.name, state: a.state || 'visible', cells: parseSheet(xml, sharedStrings) };
  });
}
