import { describe, expect, it } from "vitest";
import { isHeading, paginate, pdfSafe, textToPdf, wrapLine, WRAP_AT } from "../src/lib/pdf";

const decode = (b: Uint8Array) => new TextDecoder().decode(b);

describe("pdfSafe", () => {
  it("escapes parentheses and backslashes", () => {
    expect(pdfSafe("a (b) \\c")).toBe("a \\(b\\) \\\\c");
  });
  it("maps report symbols to ASCII and unknown characters to ?", () => {
    expect(pdfSafe("15% → 40% ✓ — 中")).toBe("15% -> 40% v - ?");
  });
});

describe("wrapLine", () => {
  it("keeps short lines and blank lines", () => {
    expect(wrapLine("short")).toEqual(["short"]);
    expect(wrapLine("")).toEqual([""]);
  });
  it("wraps at word boundaries within the width", () => {
    const lines = wrapLine(Array(60).fill("word").join(" "), 20);
    expect(lines.every((l) => l.length <= 20)).toBe(true);
    expect(lines.join(" ")).toBe(Array(60).fill("word").join(" "));
  });
  it("hard-splits words longer than the width", () => {
    expect(wrapLine("x".repeat(25), 10)).toEqual(["x".repeat(10), "x".repeat(10), "x".repeat(5)]);
  });
});

describe("isHeading", () => {
  it("treats all-caps lines as headings, not references or sentences", () => {
    expect(isHeading("REFERENCES")).toBe(true);
    expect(isHeading("Target: 92% recall.")).toBe(false);
    expect(isHeading("[1] AWARD: p. 6")).toBe(false);
    expect(isHeading("")).toBe(false);
  });
});

describe("paginate / textToPdf", () => {
  it("splits long text across pages", () => {
    const text = Array.from({ length: 120 }, (_, i) => `line ${i}`).join("\n");
    expect(paginate(text).length).toBe(3);
  });
  it("gives one blank page for empty text", () => {
    expect(paginate("")).toEqual([[""]]);
    expect(decode(textToPdf(""))).toContain("/Count 1");
  });
  it("writes a well-formed PDF with a correct xref offset", () => {
    const pdf = decode(textToPdf("TITLE\n\nBody with (parens) and → arrow.\n" + "long ".repeat(WRAP_AT)));
    expect(pdf.startsWith("%PDF-1.4")).toBe(true);
    expect(pdf.trimEnd().endsWith("%%EOF")).toBe(true);
    const xref = Number(pdf.match(/startxref\n(\d+)/)![1]);
    expect(pdf.slice(xref, xref + 4)).toBe("xref");
    const first = pdf.indexOf("1 0 obj");
    expect(pdf).toContain(`${String(first).padStart(10, "0")} 00000 n`);
    expect(pdf).toContain("(Body with \\(parens\\) and -> arrow.)");
    expect(pdf).toContain("/F2 10 Tf");
  });
});
