export const BASE_DATA_URL = "https://rando.dammaretz.fr/data";
export const CATALOG_URL = `${BASE_DATA_URL}/catalog.json`;

export type { MapStyle } from "@/lib/map-style";
export { ALL_MAP_STYLES } from "@/lib/map-style";

export const GRID_MANIFEST_URL = `${BASE_DATA_URL}/grid.json`;
export function routeManifestUrl(routeId: string): string {
  return `${BASE_DATA_URL}/routes/${routeId}/pmtiles.json`;
}

export const MAX_PARALLEL_DOWNLOADS = 4;
