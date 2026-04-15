import type { MapStyle } from "@/lib/constants";

export type PoiType = "train_station" | "bus_stop" | "camping" | "hotel";

export interface PointOfInterest {
  name: string;
  lat: number;
  lon: number;
  poi_type: PoiType;
  url: string;
  distance_km: number;
}

export type Difficulty = "easy" | "moderate" | "difficult" | "very_difficult";
export type Terrain = "coastal" | "hills" | "mountain" | "plains" | "forest";

export interface Route {
  id: string;
  slug: string;
  path_ref: string;
  path_name: string;
  description: string;
  osm_relation_id: number;
  pois: PointOfInterest[];
  distance_km: number;
  elevation_gain_m: number;
  elevation_loss_m: number;
  max_elevation_m: number;
  min_elevation_m: number;
  difficulty: Difficulty;
  bbox: [number, number, number, number];
  region: string;
  departement: string;
  gpx_path: string;
  geojson_path: string;
  is_circular_trail: boolean;
  terrain: Terrain[];
  last_updated: string;
}

export interface CatalogResponse {
  generated_at: string;
  source: string;
  license: string;
  routes: Route[];
}

export interface ElevationProfile {
  distances_km: number[];
  elevations_m: number[];
  times_min: number[];
  station_positions_km: number[];
}

export type DownloadStatus = "idle" | "downloading" | "complete" | "error";

export interface DownloadState {
  status: DownloadStatus;
  progress: number;
  error?: string;
  mapStyle?: MapStyle;
  routeName?: string;
}

export interface SectionEntry {
  sectionId: string;
  routeId: string;
  slug: string;
  fromKm: number;
  toKm: number;
  savedAt: string;
}
