import { beforeEach, describe, expect, it, vi } from "vitest";
import { displayPhone, normalizePhone, poiTypeLabel } from "@/lib/poi-format";
import { setLocale } from "@/lib/i18n";

vi.mock("expo-localization", () => ({
  getLocales: () => [{ languageCode: "en" }],
}));

describe("normalizePhone", () => {
  it("builds a tel: link without spaces", () => {
    expect(normalizePhone("+33 4 12 34 56 78")).toBe("tel:+33412345678");
  });

  it("keeps the first of several numbers", () => {
    expect(normalizePhone("04 12 34 56 78; 06 00 00 00 00")).toBe("tel:0412345678");
  });

  it("returns null for text that is not a phone number", () => {
    expect(normalizePhone("call the owner")).toBeNull();
  });

  it("returns null when there is no phone", () => {
    expect(normalizePhone(undefined)).toBeNull();
  });
});

describe("displayPhone", () => {
  it("shows the first number, trimmed", () => {
    expect(displayPhone(" 04 12 34 56 78 ; 06 00")).toBe("04 12 34 56 78");
  });
});

describe("poiTypeLabel", () => {
  beforeEach(() => setLocale("en"));

  it("reads a shop as its category", () => {
    expect(poiTypeLabel("shop", "bakery")).toBe("Bakery");
  });

  it("translates the category in French", () => {
    setLocale("fr");
    expect(poiTypeLabel("shop", "bakery")).toBe("Boulangerie");
  });

  it("falls back to the raw category the app does not know", () => {
    expect(poiTypeLabel("shop", "wine_shop")).toBe("wine shop");
  });

  it("uses the kind when there is no category", () => {
    expect(poiTypeLabel("hotel")).toBe("Accommodation");
  });

  it("does not show a translation key for an unknown kind", () => {
    expect(poiTypeLabel("ferry_terminal")).toBe("ferry terminal");
  });
});
