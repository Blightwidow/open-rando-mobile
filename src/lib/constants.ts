export const BASE_DATA_URL = "https://rando.dammaretz.fr/data";
export const CATALOG_URL = `${BASE_DATA_URL}/catalog.json`;

export const TILE_STYLE_LIBERTY = "https://tiles.openfreemap.org/styles/liberty";
export const TILE_STYLE_BRIGHT = "https://tiles.openfreemap.org/styles/bright";

/** Default style for online-only maps (explore tab) */
export const TILE_STYLE_URL = TILE_STYLE_LIBERTY;

export type MapStyle = "liberty" | "bright";

export function tileStyleUrl(style: MapStyle): string {
  return style === "bright" ? TILE_STYLE_BRIGHT : TILE_STYLE_LIBERTY;
}

export const OFFLINE_TILE_MIN_ZOOM = 10;
export const OFFLINE_TILE_MAX_ZOOM = 16;
