import { PMTILES_BASE, type MapStyle } from "@/lib/map-style";

/**
 * Hiking overlay: water, shelters, peaks, passes, bridges, power lines and rivers read from
 * `overlay.pmtiles` (built by the web project's `tiles/Makefile.overlay`). Ported from
 * `website/src/lib/overlay.ts`. Drawn only, never pressed. Layers are grouped so one toggle
 * and one legend swatch stand for each kind of feature.
 */

export const OVERLAY_SOURCE_ID = "overlay";
export const OVERLAY_PMTILES_FILENAME = "overlay.pmtiles";
export const OVERLAY_REMOTE_URL = `${PMTILES_BASE}/${OVERLAY_PMTILES_FILENAME}`;
export const OVERLAY_ICON_NAMES = [
  "peak",
  "pass",
  "hut",
  "shelter",
  "water",
  "spring",
  "viewpoint",
  "waterfall",
  "cave",
  "ford",
  "toilets",
  "church",
  "cemetery",
  "guidepost",
] as const;

export type OverlayIconName = (typeof OVERLAY_ICON_NAMES)[number];

/** Id under which an icon is registered on the map; the layers' `icon-image` uses it. */
export function overlayIconImageId(name: OverlayIconName): string {
  return `overlay-icon-${name}`;
}

export type OverlayGroupKey =
  | "river"
  | "water"
  | "shelter"
  | "peak"
  | "viewpoint"
  | "nature"
  | "crossing"
  | "landmark"
  | "toilets"
  | "aerialway"
  | "guidepost"
  | "power";

/** Order of the toggle list and the legend. */
export const OVERLAY_GROUP_KEYS: OverlayGroupKey[] = [
  "river",
  "water",
  "shelter",
  "peak",
  "viewpoint",
  "nature",
  "crossing",
  "landmark",
  "toilets",
  "aerialway",
  "guidepost",
  "power",
];

export type OverlayExpression = unknown[];

export interface OverlayLayerSpec {
  id: string;
  type: "circle" | "line" | "symbol";
  sourceLayer: string;
  minzoom?: number;
  filter?: OverlayExpression;
  /** Layout properties, kebab-case as in the MapLibre style spec. */
  layout?: Record<string, unknown>;
  /** Paint properties, kebab-case as in the MapLibre style spec. */
  paint?: Record<string, unknown>;
}

export interface OverlayGroup {
  key: OverlayGroupKey;
  /** Translation key of the toggle and legend label. */
  labelKey: string;
  /** Legend swatch: a stroke for lines, an icon for point features. */
  swatch: "line" | "icon";
  /** The icon the legend shows when `swatch` is `icon`. */
  icon?: OverlayIconName;
  color: string;
  defaultVisible: boolean;
  layers: OverlayLayerSpec[];
}

interface Palette {
  river: string;
  water: string;
  shelter: string;
  peak: string;
  viewpoint: string;
  guidepost: string;
  power: string;
  waterfall: string;
  cave: string;
  toilets: string;
  aerialway: string;
  bridgeDeck: string;
  bridgeCasing: string;
  halo: string;
  text: string;
  dotOutline: string;
}

const LIGHT: Palette = {
  river: "#2563eb",
  water: "#0284c7",
  shelter: "#b45309",
  peak: "#57534e",
  viewpoint: "#db2777",
  guidepost: "#0f766e",
  power: "#78716c",
  waterfall: "#0891b2",
  cave: "#7c2d12",
  toilets: "#0d9488",
  aerialway: "#1c1917",
  bridgeDeck: "#fafaf9",
  bridgeCasing: "#44403c",
  halo: "#ffffff",
  text: "#44403c",
  dotOutline: "#ffffff",
};

const DARK: Palette = {
  river: "#60a5fa",
  water: "#38bdf8",
  shelter: "#f59e0b",
  peak: "#d6d3d1",
  viewpoint: "#f472b6",
  guidepost: "#2dd4bf",
  power: "#a8a29e",
  waterfall: "#22d3ee",
  cave: "#fb923c",
  toilets: "#2dd4bf",
  aerialway: "#f5f5f4",
  bridgeDeck: "#292524",
  bridgeCasing: "#e7e5e4",
  halo: "#1c1917",
  text: "#e7e5e4",
  dotOutline: "#1c1917",
};

const FONT = ["Noto Sans Regular"];

const ELEVATION_LABEL: OverlayExpression = [
  "case",
  ["has", "ele"],
  ["concat", ["get", "name"], "\n", ["to-string", ["get", "ele"]], " m"],
  ["get", "name"],
];

function dot(
  id: string,
  sourceLayer: string,
  color: string,
  outline: string,
  radius: [number, number],
): OverlayLayerSpec {
  return {
    id,
    type: "circle",
    sourceLayer,
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, radius[0], 15, radius[1]],
      "circle-color": color,
      "circle-stroke-color": outline,
      "circle-stroke-width": 1,
    },
  };
}

function label(
  id: string,
  sourceLayer: string,
  textField: OverlayExpression,
  palette: Palette,
  minzoom: number,
): OverlayLayerSpec {
  return {
    id,
    type: "symbol",
    sourceLayer,
    minzoom,
    filter: ["has", "name"],
    layout: {
      "text-field": textField,
      "text-font": FONT,
      "text-size": 11,
      "text-anchor": "top",
      "text-offset": [0, 0.6],
      "text-optional": true,
    },
    paint: {
      "text-color": palette.text,
      "text-halo-color": palette.halo,
      "text-halo-width": 1.5,
    },
  };
}

interface IconOptions {
  /** Draw only features that carry a name. */
  named?: boolean;
  /** Rare features overlap freely; dense ones thin out where they would collide. */
  allowOverlap?: boolean;
}

/**
 * Symbol layer drawing an icon registered through `MapLibreGL.Images`. The size is a multiplier
 * from z9 to z15, where 1 is 24 px.
 */
function icon(
  id: string,
  sourceLayer: string,
  name: OverlayIconName,
  size: [number, number],
  options: IconOptions = {},
): OverlayLayerSpec {
  return {
    id,
    type: "symbol",
    sourceLayer,
    ...(options.named ? { filter: ["has", "name"] } : {}),
    layout: {
      "icon-image": overlayIconImageId(name),
      "icon-size": ["interpolate", ["linear"], ["zoom"], 9, size[0], 15, size[1]],
      "icon-allow-overlap": options.allowOverlap ?? false,
    },
  };
}

export function getOverlayGroups(theme: MapStyle): OverlayGroup[] {
  const palette = theme === "dark" ? DARK : LIGHT;
  const outline = palette.dotOutline;

  return [
    {
      key: "river",
      labelKey: "overlay.river",
      swatch: "line",
      color: palette.river,
      defaultVisible: true,
      layers: [
        {
          id: "overlay-river-line",
          type: "line",
          sourceLayer: "river",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": palette.river,
            "line-width": ["interpolate", ["linear"], ["zoom"], 8, 0.8, 14, 2.2],
            "line-opacity": 0.8,
          },
        },
        {
          // A `>` glyph laid along the line points the way the line was drawn, which for an OSM
          // waterway is downstream.
          id: "overlay-river-flow",
          type: "symbol",
          sourceLayer: "river",
          minzoom: 11,
          layout: {
            "symbol-placement": "line",
            "symbol-spacing": 110,
            "text-field": ">",
            "text-font": FONT,
            "text-size": 18,
            "text-keep-upright": false,
            "text-rotation-alignment": "map",
            "text-allow-overlap": true,
          },
          paint: {
            "text-color": palette.river,
            "text-halo-color": palette.halo,
            "text-halo-width": 1.2,
          },
        },
      ],
    },
    {
      key: "water",
      labelKey: "overlay.water",
      swatch: "icon",
      icon: "water",
      color: palette.water,
      defaultVisible: true,
      layers: [
        icon("overlay-spring", "spring", "spring", [0.4, 0.7], { allowOverlap: true }),
        icon("overlay-water", "water", "water", [0.45, 0.8], { allowOverlap: true }),
      ],
    },
    {
      key: "shelter",
      labelKey: "overlay.shelter",
      swatch: "icon",
      icon: "hut",
      color: palette.shelter,
      defaultVisible: true,
      layers: [
        icon("overlay-shelter", "shelter", "shelter", [0.45, 0.8], {
          allowOverlap: true,
        }),
        icon("overlay-hut", "hut", "hut", [0.55, 0.95], { allowOverlap: true }),
        label("overlay-hut-label", "hut", ["get", "name"], palette, 12),
      ],
    },
    {
      key: "peak",
      labelKey: "overlay.peak",
      swatch: "icon",
      icon: "peak",
      color: palette.peak,
      defaultVisible: true,
      layers: [
        icon("overlay-peak", "peak", "peak", [0.4, 0.8], { named: true }),
        label("overlay-peak-label", "peak", ELEVATION_LABEL, palette, 11),
        icon("overlay-pass", "pass", "pass", [0.4, 0.75]),
        label("overlay-pass-label", "pass", ELEVATION_LABEL, palette, 12),
      ],
    },
    {
      key: "viewpoint",
      labelKey: "overlay.viewpoint",
      swatch: "icon",
      icon: "viewpoint",
      color: palette.viewpoint,
      defaultVisible: true,
      layers: [
        icon("overlay-viewpoint", "viewpoint", "viewpoint", [0.5, 0.85], {
          allowOverlap: true,
        }),
      ],
    },
    {
      key: "nature",
      labelKey: "overlay.nature",
      swatch: "icon",
      icon: "waterfall",
      color: palette.waterfall,
      defaultVisible: true,
      layers: [
        icon("overlay-waterfall", "waterfall", "waterfall", [0.45, 0.8], {
          allowOverlap: true,
        }),
        icon("overlay-cave", "cave", "cave", [0.45, 0.8], { allowOverlap: true }),
        label("overlay-waterfall-label", "waterfall", ["get", "name"], palette, 13),
        label("overlay-cave-label", "cave", ["get", "name"], palette, 13),
      ],
    },
    {
      key: "crossing",
      labelKey: "overlay.crossing",
      swatch: "line",
      color: "#a8a29e", // mid-tone: the legend reads on both a light and a dark panel
      defaultVisible: true,
      layers: [
        // A bridge reads as a pale deck between two dark edges, laid over the trail's own line.
        {
          id: "overlay-bridge-casing",
          type: "line",
          sourceLayer: "bridge",
          layout: { "line-cap": "butt" },
          paint: {
            "line-color": palette.bridgeCasing,
            "line-width": ["interpolate", ["linear"], ["zoom"], 13, 3, 17, 9],
          },
        },
        {
          id: "overlay-bridge-deck",
          type: "line",
          sourceLayer: "bridge",
          layout: { "line-cap": "butt" },
          paint: {
            "line-color": palette.bridgeDeck,
            "line-width": ["interpolate", ["linear"], ["zoom"], 13, 1.4, 17, 5.5],
          },
        },
        icon("overlay-ford", "ford", "ford", [0.4, 0.7]),
      ],
    },
    {
      key: "landmark",
      labelKey: "overlay.landmark",
      swatch: "icon",
      icon: "church",
      color: "#78716c", // mid-tone: the legend reads on both a light and a dark panel
      defaultVisible: true,
      layers: [
        icon("overlay-cemetery", "cemetery", "cemetery", [0.4, 0.75]),
        icon("overlay-church", "church", "church", [0.5, 0.95]),
        label("overlay-church-label", "church", ["get", "name"], palette, 14),
      ],
    },
    {
      key: "toilets",
      labelKey: "overlay.toilets",
      swatch: "icon",
      icon: "toilets",
      color: palette.toilets,
      defaultVisible: true,
      layers: [icon("overlay-toilets", "toilets", "toilets", [0.4, 0.75])],
    },
    {
      key: "aerialway",
      labelKey: "overlay.aerialway",
      swatch: "line",
      color: "#78716c", // mid-tone: the legend reads on both a light and a dark panel
      defaultVisible: true,
      layers: [
        {
          id: "overlay-aerialway",
          type: "line",
          sourceLayer: "aerialway",
          paint: {
            "line-color": palette.aerialway,
            "line-width": ["interpolate", ["linear"], ["zoom"], 10, 1, 15, 2.2],
            "line-dasharray": [2, 2],
          },
        },
      ],
    },
    {
      key: "guidepost",
      labelKey: "overlay.guidepost",
      swatch: "icon",
      icon: "guidepost",
      color: palette.guidepost,
      defaultVisible: true,
      layers: [icon("overlay-guidepost", "guidepost", "guidepost", [0.35, 0.65])],
    },
    {
      key: "power",
      labelKey: "overlay.power",
      swatch: "line",
      color: palette.power,
      defaultVisible: true,
      layers: [
        {
          id: "overlay-power-line",
          type: "line",
          sourceLayer: "power_line",
          paint: {
            "line-color": palette.power,
            "line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.8, 15, 1.6],
            "line-dasharray": [4, 3],
            "line-opacity": 0.9,
          },
        },
        dot("overlay-power-tower", "power_tower", palette.power, outline, [1.5, 3]),
      ],
    },
  ];
}

export function defaultVisibleOverlayGroups(): OverlayGroupKey[] {
  return getOverlayGroups("light")
    .filter((group) => group.defaultVisible)
    .map((group) => group.key);
}

/** `line-cap` becomes `lineCap`: the style keys the React Native layers take. */
export function toCamelCaseKeys(
  properties: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(properties)) {
    result[key.replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase())] =
      value;
  }
  return result;
}
