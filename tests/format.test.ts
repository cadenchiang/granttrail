import { describe, expect, it } from "vitest";
import { daysBetween, formatDate, formatPct, formatUSD, parseISODate } from "@/lib/format";

describe("format", () => {
  it("parses ISO dates as UTC and rejects bad input", () => {
    expect(parseISODate("2026-07-01")).toBe(Date.UTC(2026, 6, 1));
    expect(() => parseISODate("2026-7-1")).toThrow(/Invalid ISO date/);
    expect(() => parseISODate("2026-02-30")).toThrow(/Invalid calendar date/);
  });
  it("counts days in both directions", () => {
    expect(daysBetween("2026-07-01", "2026-10-22")).toBe(113);
    expect(daysBetween("2026-12-31", "2027-04-30")).toBe(120);
    expect(daysBetween("2026-10-22", "2026-10-21")).toBe(-1);
  });
  it("formats money, percents and dates", () => {
    expect(formatUSD(151502)).toBe("$151,502");
    expect(formatUSD(-214)).toBe("-$214");
    expect(formatPct(0.5509)).toBe("55%");
    expect(formatDate("2026-10-22")).toBe("Oct 22, 2026");
  });
});
