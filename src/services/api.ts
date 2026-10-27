import { BASE_DATA_URL, CATALOG_URL } from "@/lib/constants";
import type { CatalogResponse, ElevationProfile, Route } from "@/lib/types";
import { logInfo, logError } from "@/lib/logger";

export async function fetchCatalog(): Promise<CatalogResponse> {
  logInfo("api", `Fetching catalog from ${CATALOG_URL}`);
  const response = await fetch(CATALOG_URL);
  if (!response.ok) {
    logError("api", `Catalog fetch failed with status ${response.status}`);
    throw new Error(`Failed to fetch catalog: ${response.status}`);
  }
  return response.json();
}

// Track files live under tracks/<id>/; the catalog gives each path, never rebuild it
export async function fetchGeoJson(
  route: Pick<Route, "id" | "geojson_path">,
  signal?: AbortSignal,
): Promise<unknown> {
  logInfo("api", `Fetching GeoJSON for ${route.id}`);
  const response = await fetch(`${BASE_DATA_URL}/${route.geojson_path}`, { signal });
  if (!response.ok) {
    logError("api", `GeoJSON fetch failed for ${route.id}: ${response.status}`);
    throw new Error(`Failed to fetch GeoJSON for ${route.id}: ${response.status}`);
  }
  return response.json();
}

export async function fetchElevation(
  route: Pick<Route, "id" | "elevation_path">,
  signal?: AbortSignal,
): Promise<ElevationProfile> {
  logInfo("api", `Fetching elevation for ${route.id}`);
  const response = await fetch(`${BASE_DATA_URL}/${route.elevation_path}`, { signal });
  if (!response.ok) {
    logError("api", `Elevation fetch failed for ${route.id}: ${response.status}`);
    throw new Error(`Failed to fetch elevation for ${route.id}: ${response.status}`);
  }
  return response.json();
}
