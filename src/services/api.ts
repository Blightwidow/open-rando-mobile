import { BASE_DATA_URL, CATALOG_URL } from "@/lib/constants";
import type { CatalogResponse, ElevationProfile } from "@/lib/types";
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

export async function fetchGeoJson(
  routeId: string,
  signal?: AbortSignal,
): Promise<unknown> {
  logInfo("api", `Fetching GeoJSON for ${routeId}`);
  const response = await fetch(`${BASE_DATA_URL}/geojson/${routeId}.json`, { signal });
  if (!response.ok) {
    logError("api", `GeoJSON fetch failed for ${routeId}: ${response.status}`);
    throw new Error(`Failed to fetch GeoJSON for ${routeId}: ${response.status}`);
  }
  return response.json();
}

export async function fetchElevation(
  routeId: string,
  signal?: AbortSignal,
): Promise<ElevationProfile> {
  logInfo("api", `Fetching elevation for ${routeId}`);
  const response = await fetch(`${BASE_DATA_URL}/elevation/${routeId}.json`, { signal });
  if (!response.ok) {
    logError("api", `Elevation fetch failed for ${routeId}: ${response.status}`);
    throw new Error(`Failed to fetch elevation for ${routeId}: ${response.status}`);
  }
  return response.json();
}
