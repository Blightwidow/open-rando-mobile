import { BASE_DATA_URL, CATALOG_URL } from "@/lib/constants";
import type { CatalogResponse, ElevationProfile } from "@/lib/types";

export async function fetchCatalog(): Promise<CatalogResponse> {
  const response = await fetch(CATALOG_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch catalog: ${response.status}`);
  }
  return response.json();
}

export async function fetchGeoJson(hikeId: string): Promise<unknown> {
  const response = await fetch(`${BASE_DATA_URL}/geojson/${hikeId}.json`);
  if (!response.ok) {
    throw new Error(`Failed to fetch GeoJSON for ${hikeId}: ${response.status}`);
  }
  return response.json();
}

export async function fetchElevation(
  hikeId: string,
): Promise<ElevationProfile> {
  const response = await fetch(`${BASE_DATA_URL}/elevation/${hikeId}.json`);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch elevation for ${hikeId}: ${response.status}`,
    );
  }
  return response.json();
}
