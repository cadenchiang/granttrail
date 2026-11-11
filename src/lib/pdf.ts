/**
 * Minimal text-only PDF writer for the report export (no dependencies).
 * Takes the plain-text report (see toPlainText), wraps long lines, paginates on
 * US Letter, and sets heading lines (all caps) in bold. Pure, so it is unit tested.
 */

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 54;
const SIZE = 10;
const LEADING = 14;
/** Characters per line; Helvetica at 10pt averages about 5pt per character across 504pt. */
export const WRAP_AT = 95;
const LINES_PER_PAGE = Math.floor((PAGE_H - 2 * MARGIN) / LEADING);

/** Characters outside WinAnsi that the report uses, mapped to safe ASCII. */
const REPLACE: Record<string, string> = {
  "→": "->", "←": "<-", "✓": "v", "—": "-", "–": "-",
  "‘": "'", "’": "'", "“": '"', "”": '"', "…": "...", "·": "-", " ": " ",
};

/**
 * Make text safe for a PDF string literal: known symbols to ASCII, other non-ASCII to "?",
 * and escape backslash and parentheses.
 * @param s raw text @returns escaped text
 */
export function pdfSafe(s: string): string {
  return s
    .replace(/[^\x20-\x7e]/g, (c) => REPLACE[c] ?? "?")
    .replace(/[\\()]/g, (c) => "\\" + c);
}

/**
 * Wrap one line at word boundaries. Words longer than the width are hard-split.
 * @param line text without newlines @param width max characters @returns wrapped lines ("" stays one blank line)
 */
export function wrapLine(line: string, width = WRAP_AT): string[] {
  if (line.length <= width) return [line];
  const out: string[] = [];
  let cur = "";
  for (const word of line.split(" ")) {
    let w = word;
    while (w.length > width) {
      if (cur) { out.push(cur); cur = ""; }
      out.push(w.slice(0, width));
      w = w.slice(width);
    }
    if (!cur) cur = w;
    else if (cur.length + 1 + w.length <= width) cur += " " + w;
    else { out.push(cur); cur = w; }
  }
  if (cur) out.push(cur);
  return out;
}

/** A heading is a non-empty line with letters and no lowercase (e.g. "REFERENCES"). */
export function isHeading(line: string): boolean {
  return /[A-Z]/.test(line) && line === line.toUpperCase() && !/^\[\d+\]/.test(line);
}

/**
 * Split text into pages of wrapped lines.
 * @param text plain text @returns pages, each a list of lines (at least one page)
 */
export function paginate(text: string): string[][] {
  const lines = text.replace(/\r/g, "").split("\n").flatMap((l) => wrapLine(l));
  while (lines.length && lines[lines.length - 1] === "") lines.pop();
  const pages: string[][] = [];
  for (let i = 0; i < lines.length; i += LINES_PER_PAGE) pages.push(lines.slice(i, i + LINES_PER_PAGE));
  return pages.length ? pages : [[""]];
}

/** Content stream for one page: each line positioned absolutely, bold for headings. */
function pageStream(lines: string[]): string {
  return lines
    .map((l, i) => `BT /${isHeading(l) ? "F2" : "F1"} ${SIZE} Tf ${MARGIN} ${PAGE_H - MARGIN - SIZE - i * LEADING} Td (${pdfSafe(l)}) Tj ET`)
    .join("\n");
}

/**
 * Build a PDF document from plain text.
 * @param text the report as plain text @returns PDF bytes (always a valid PDF, empty text gives one blank page)
 */
export function textToPdf(text: string): Uint8Array {
  const pages = paginate(text);
  // Objects: 1 catalog, 2 pages, 3 Helvetica, 4 Helvetica-Bold, then per page: page + content.
  const objs: string[] = [];
  const kids = pages.map((_, i) => `${5 + i * 2} 0 R`).join(" ");
  objs.push("<< /Type /Catalog /Pages 2 0 R >>");
  objs.push(`<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`);
  objs.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  objs.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
  pages.forEach((lines, i) => {
    const stream = pageStream(lines);
    objs.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${6 + i * 2} 0 R >>`);
    objs.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  });
  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  objs.forEach((o, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  out += offsets.map((n) => `${String(n).padStart(10, "0")} 00000 n \n`).join("");
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(out);
}
