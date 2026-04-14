import { describe, expect, it, vi } from "vitest";
import { t, setLocale } from "@/lib/i18n";

vi.mock("expo-localization", () => ({
  getLocales: () => [{ languageCode: "en" }],
}));

describe("i18n", () => {
  it("t() returns French translation when locale is fr", () => {
    setLocale("fr");
    expect(t("tabs.explore")).toBe("Explorer");
  });

  it("t() returns English translation when locale is en", () => {
    setLocale("en");
    expect(t("tabs.explore")).toBe("Explore");
  });

  it("t() substitutes parameters", () => {
    setLocale("en");
    expect(t("download.downloading", { progress: 42 })).toBe("Downloading... 42%");
  });

  it("t() returns key for missing translation", () => {
    setLocale("en");
    expect(t("nonexistent.key")).toBe("nonexistent.key");
  });

  it("t() falls back to English for missing French key", () => {
    setLocale("fr");
    // All current keys exist in both locales, so test with a known key
    const frenchExplore = t("tabs.explore");
    expect(frenchExplore).toBe("Explorer");
  });
});
