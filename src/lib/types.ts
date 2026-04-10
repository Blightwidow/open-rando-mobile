export interface StationAccommodation {
  has_hotel: boolean;
  has_camping: boolean;
}

export interface StationInfo {
  name: string;
  code: string;
  lat: number;
  lon: number;
  distance_to_trail_m: number;
  transit_lines: string[];
  accommodation: StationAccommodation;
}

export interface HikeStep {
  start_station: StationInfo;
  end_station: StationInfo;
  distance_km: number;
  estimated_duration_min: number;
  elevation_gain_m: number;
  elevation_loss_m: number;
}

export type Difficulty = "easy" | "moderate";
export type RouteType = "gr";
export type Terrain = "coastal" | "hills" | "mountain" | "plains";

export interface Hike {
  id: string;
  slug: string;
  path_ref: string;
  path_name: string;
  osm_relation_id: number;
  start_station: StationInfo;
  end_station: StationInfo;
  steps: HikeStep[];
  step_count: number;
  distance_km: number;
  estimated_duration_min: number;
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
  is_reversible: boolean;
  route_type: RouteType;
  is_grp: boolean;
  is_circular_trail: boolean;
  is_round_trip: boolean;
  terrain: Terrain[];
  last_updated: string;
}

export interface CatalogResponse {
  generated_at: string;
  source: string;
  license: string;
  hikes: Hike[];
}

export interface ElevationProfile {
  distances_km: number[];
  elevations_m: number[];
  times_min: number[];
  step_boundaries_km: number[];
}

export type DownloadStatus = "idle" | "downloading" | "complete" | "error";

export interface DownloadState {
  status: DownloadStatus;
  progress: number;
  error?: string;
}
