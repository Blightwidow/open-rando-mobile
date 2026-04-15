import { describe, expect, it } from "vitest";
import { extractSlugAndSection, buildSectionId } from "@/lib/qr-utils";

describe("extractSlugAndSection", () => {
  it("parses deep link with section bounds", () => {
    const result = extractSlugAndSection("trainrando://route/gr-137?from=26.86&to=34.28");
    expect(result).toEqual({ slug: "gr-137", fromKm: 26.86, toKm: 34.28 });
  });

  it("parses deep link without section bounds", () => {
    const result = extractSlugAndSection("trainrando://route/gr-137");
    expect(result).toEqual({ slug: "gr-137" });
  });

  it("parses web URL with section bounds", () => {
    const result = extractSlugAndSection(
      "https://rando.dammaretz.fr/routes/gr-10-etape-3?from=0&to=15.5",
    );
    expect(result).toEqual({
      slug: "gr-10-etape-3",
      fromKm: 0,
      toKm: 15.5,
    });
  });

  it("parses web URL without section bounds", () => {
    const result = extractSlugAndSection(
      "https://rando.dammaretz.fr/routes/gr-10-etape-3",
    );
    expect(result).toEqual({ slug: "gr-10-etape-3" });
  });

  it("parses bare slug", () => {
    const result = extractSlugAndSection("gr-137");
    expect(result).toEqual({ slug: "gr-137" });
  });

  it("returns null for empty string", () => {
    expect(extractSlugAndSection("")).toBeNull();
  });

  it("returns null for wrong host", () => {
    expect(extractSlugAndSection("https://example.com/routes/gr-137")).toBeNull();
  });

  it("returns null for URL without slug path segment", () => {
    expect(extractSlugAndSection("trainrando://route/")).toBeNull();
  });

  it("returns null for non-numeric from param", () => {
    expect(extractSlugAndSection("trainrando://route/gr-137?from=abc&to=10")).toBeNull();
  });

  it("returns null for non-numeric to param", () => {
    expect(extractSlugAndSection("trainrando://route/gr-137?from=5&to=xyz")).toBeNull();
  });

  it("handles partial params — only from", () => {
    const result = extractSlugAndSection("trainrando://route/gr-137?from=10.5");
    expect(result).toEqual({ slug: "gr-137", fromKm: 10.5 });
  });

  it("handles partial params — only to", () => {
    const result = extractSlugAndSection("trainrando://route/gr-137?to=20");
    expect(result).toEqual({ slug: "gr-137", toKm: 20 });
  });

  it("trims whitespace", () => {
    const result = extractSlugAndSection("  trainrando://route/gr-137?from=1&to=2  ");
    expect(result).toEqual({ slug: "gr-137", fromKm: 1, toKm: 2 });
  });
});

describe("buildSectionId", () => {
  it("builds section ID with fixed precision", () => {
    expect(buildSectionId("abc-123", 26.86, 34.28)).toBe("abc-123:26.86:34.28");
  });

  it("pads short decimals", () => {
    expect(buildSectionId("route-1", 0, 15)).toBe("route-1:0.00:15.00");
  });

  it("truncates long decimals", () => {
    expect(buildSectionId("route-1", 1.999, 2.001)).toBe("route-1:2.00:2.00");
  });
});
