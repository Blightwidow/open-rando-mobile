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

function rewritePmtilesUrls(style: MapStyleSpec): MapStyleSpec {
  const next = JSON.parse(JSON.stringify(style)) as MapStyleSpec;
  for (const source of Object.values(next.sources)) {
    if (typeof source.url === "string" && source.url.startsWith(PMTILES_DEV_PREFIX)) {
      source.url = `pmtiles://${PMTILES_BASE}/${source.url.slice(PMTILES_DEV_PREFIX.length)}`;
    }
  }
  return next;
}

export function getStyle(style: MapStyle): MapStyleSpec {
  const raw = (style === "dark"
    ? styleDarkRaw
    : styleLightRaw) as unknown as MapStyleSpec;
  return rewritePmtilesUrls(raw);
}
