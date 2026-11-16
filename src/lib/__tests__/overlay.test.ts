import { describe, expect, it, vi } from "vitest";
import {
  OVERLAY_GROUP_KEYS,
  OVERLAY_ICON_NAMES,
  OVERLAY_REMOTE_URL,
  defaultVisibleOverlayGroups,
  getOverlayGroups,
  toCamelCaseKeys,
} from "@/lib/overlay";
import { setLocale, t } from "@/lib/i18n";

vi.mock("expo-localization", () => ({
  getLocales: () => [{ languageCode: "en" }],
}));

describe("getOverlayGroups", () => {
  it("lists every group key once, in toggle order", () => {
    expect(getOverlayGroups("light").map((group) => group.key)).toEqual(
      OVERLAY_GROUP_KEYS,
    );
  });

  it("gives every layer a unique id", () => {
    const ids = getOverlayGroups("light").flatMap((group) =>
      group.layers.map((layer) => layer.id),
    );
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps the same layer ids in the dark theme", () => {
    const layerIds = (theme: "light" | "dark") =>
      getOverlayGroups(theme).flatMap((group) => group.layers.map((layer) => layer.id));
    expect(layerIds("dark")).toEqual(layerIds("light"));
  });

  it("uses a different bridge deck colour in the dark theme", () => {
    const deckColor = (theme: "light" | "dark") =>
      getOverlayGroups(theme)
        .flatMap((group) => group.layers)
        .find((layer) => layer.id === "overlay-bridge-deck")?.paint?.["line-color"];
    expect(deckColor("dark")).not.toBe(deckColor("light"));
  });

  it.each(["fr", "en"] as const)("has a %s label for every group", (locale) => {
    setLocale(locale);
    for (const group of getOverlayGroups("light")) {
      expect(t(group.labelKey)).not.toBe(group.labelKey);
    }
  });
});

describe("icons", () => {
  it("gives every icon layer an image the app ships", () => {
    const names = new Set<string>(OVERLAY_ICON_NAMES);
    const used = getOverlayGroups("light")
      .flatMap((group) => group.layers)
      .map((layer) => String(layer.layout?.["icon-image"] ?? ""))
      .filter(Boolean);
    expect(used.length).toBeGreaterThan(0);
    for (const imageId of used) {
      expect(names.has(imageId.replace("overlay-icon-", ""))).toBe(true);
    }
  });

  it("names an icon for every group drawn as an icon", () => {
    for (const group of getOverlayGroups("light")) {
      if (group.swatch === "icon") expect(group.icon).toBeDefined();
    }
  });
});

describe("defaultVisibleOverlayGroups", () => {
  it("shows every group", () => {
    expect(defaultVisibleOverlayGroups()).toEqual(OVERLAY_GROUP_KEYS);
  });
});

describe("toCamelCaseKeys", () => {
  it("turns kebab-case style keys into camelCase", () => {
    expect(toCamelCaseKeys({ "line-cap": "round", "text-halo-width": 1.5 })).toEqual({
      lineCap: "round",
      textHaloWidth: 1.5,
    });
  });
});

describe("OVERLAY_REMOTE_URL", () => {
  it("points at overlay.pmtiles on the tile bucket", () => {
    expect(OVERLAY_REMOTE_URL.endsWith("/overlay.pmtiles")).toBe(true);
  });
});
