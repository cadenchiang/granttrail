import { afterEach, describe, expect, it, vi } from "vitest";
import { logEvent } from "@/lib/log";

describe("logEvent", () => {
  afterEach(() => vi.restoreAllMocks());
  it("writes structured JSON to the matching console method", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const entry = logEvent("info", "flag.resolve", "user click", { flagId: "x" }, "flag closed");
    expect(entry).toMatchObject({ level: "info", action: "flag.resolve", cause: "user click", context: { flagId: "x" }, impact: "flag closed" });
    expect(info).toHaveBeenCalledOnce();
    expect(JSON.parse(String(info.mock.calls[0][0]).replace("[granttrail] ", ""))).toMatchObject({ action: "flag.resolve" });
    logEvent("error", "export.fail", "blob error", {}, "no file");
    expect(error).toHaveBeenCalledOnce();
  });
  it("routes warnings to console.warn", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    logEvent("warn", "a", "b", {}, "c");
    expect(warn).toHaveBeenCalledOnce();
  });
});
