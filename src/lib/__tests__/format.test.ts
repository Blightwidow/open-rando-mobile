import { describe, expect, it } from "vitest";
import { formatDistance, formatElevation } from "@/lib/format";

describe("formatDistance", () => {
  it("formats kilometers with one decimal place", () => {
    expect(formatDistance(12.345)).toBe("12.3 km");
  });

  it("formats zero distance", () => {
    expect(formatDistance(0)).toBe("0.0 km");
  });

  it("formats short distances", () => {
    expect(formatDistance(0.7)).toBe("0.7 km");
  });

  it("formats long distances", () => {
    expect(formatDistance(123.456)).toBe("123.5 km");
  });
});

describe("formatElevation", () => {
  it("rounds to nearest integer", () => {
    expect(formatElevation(1234.6)).toBe("1235 m");
  });

  it("formats zero elevation", () => {
    expect(formatElevation(0)).toBe("0 m");
  });

  it("rounds down when below .5", () => {
    expect(formatElevation(456.3)).toBe("456 m");
  });
});
