import styleLightRaw from "./styles/style-light.json";
import styleDarkRaw from "./styles/style-dark.json";

export const PMTILES_BASE = "https://pub-8869314668be498091e185b1a6fe798d.r2.dev";

export type MapStyle = "light" | "dark";

export const ALL_MAP_STYLES: MapStyle[] = ["light", "dark"];

interface StyleSource {
  url?: string;
  tiles?: string[];
  [key: string]: unknown;
}

export interface MapStyleSpec {
  version: number;
  sources: Record<string, StyleSource>;
  sprite?: string | { id: string; url: string }[];
  glyphs?: string;
  layers: unknown[];
  [key: string]: unknown;
}

const PMTILES_DEV_PREFIX = "pmtiles:///data/";
const WORLD_ASSET_FILENAME = "world-low.pmtiles";

function rewritePmtilesUrls(
  style: MapStyleSpec,
  worldLocalUri: string | null,
): MapStyleSpec {
  const next = JSON.parse(JSON.stringify(style)) as MapStyleSpec;
  for (const source of Object.values(next.sources)) {
    if (typeof source.url !== "string" || !source.url.startsWith(PMTILES_DEV_PREFIX)) {
      continue;
    }
    const filename = source.url.slice(PMTILES_DEV_PREFIX.length);
    if (filename === WORLD_ASSET_FILENAME && worldLocalUri) {
      source.url = `pmtiles://${worldLocalUri}`;
    } else {
      source.url = `pmtiles://${PMTILES_BASE}/${filename}`;
    }
  }
  return next;
}

export function getStyle(
  style: MapStyle,
  worldLocalUri: string | null = null,
): MapStyleSpec {
  const raw = (style === "dark"
    ? styleDarkRaw
    : styleLightRaw) as unknown as MapStyleSpec;
  return rewritePmtilesUrls(raw, worldLocalUri);
}
