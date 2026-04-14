import { describe, expect, it, vi } from "vitest";
import { formatElapsedTime } from "@/lib/format";

describe("formatElapsedTime", () => {
  it("formats seconds only", () => {
    const now = Date.now();
    vi.setSystemTime(now + 45_000);
    expect(formatElapsedTime(now)).toBe("0m 45s");
    vi.useRealTimers();
  });

  it("formats minutes and seconds", () => {
    const now = Date.now();
    vi.setSystemTime(now + 5 * 60_000 + 30_000);
    expect(formatElapsedTime(now)).toBe("5m 30s");
    vi.useRealTimers();
  });

  it("formats hours and minutes", () => {
    const now = Date.now();
    vi.setSystemTime(now + 2 * 3600_000 + 15 * 60_000);
    expect(formatElapsedTime(now)).toBe("2h 15m");
    vi.useRealTimers();
  });

  it("pads single-digit values", () => {
    const now = Date.now();
    vi.setSystemTime(now + 3 * 3600_000 + 5 * 60_000);
    expect(formatElapsedTime(now)).toBe("3h 05m");
    vi.useRealTimers();
  });
});
