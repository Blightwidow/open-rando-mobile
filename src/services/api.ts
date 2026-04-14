import { BASE_DATA_URL, CATALOG_URL } from "@/lib/constants";
import type { CatalogResponse, ElevationProfile } from "@/lib/types";

export async function fetchCatalog(): Promise<CatalogResponse> {
  const response = await fetch(CATALOG_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch catalog: ${response.status}`);
  }
  return response.json();
}

export async function fetchGeoJson(routeId: string): Promise<unknown> {
  const response = await fetch(`${BASE_DATA_URL}/geojson/${routeId}.json`);
  if (!response.ok) {
    throw new Error(`Failed to fetch GeoJSON for ${routeId}: ${response.status}`);
  }
  return response.json();
}

export async function fetchElevation(routeId: string): Promise<ElevationProfile> {
  const response = await fetch(`${BASE_DATA_URL}/elevation/${routeId}.json`);
  if (!response.ok) {
    throw new Error(`Failed to fetch elevation for ${routeId}: ${response.status}`);
  }
  return response.json();
}
