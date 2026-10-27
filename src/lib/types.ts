import type { MapStyle } from "@/lib/constants";

export type PoiType = "train_station" | "bus_stop" | "camping" | "hotel";

export interface ServiceWindow {
  first_departure_minutes: number;
  last_departure_minutes: number;
  departure_count: number;
  sample_date?: string | null;
}

export interface RailService {
  weekday: ServiceWindow | null;
  saturday: ServiceWindow | null;
  sunday: ServiceWindow | null;
}

/** A POI as stored in the grid (pois/<col>_<row>.json), independent of any track. */
export interface PoiRecord {
  id: string;
  kind: PoiType;
  name: string;
  lat: number;
  lon: number;
  url?: string | null;
  transit_lines?: string[];
  rail_service?: RailService | null;
}

/** How a POI relates to one track (links/<routeId>.json). */
export interface PoiLink {
  poi_id: string;
  kind: PoiType;
  distance_to_trail_m: number;
  /** Position along the trail from its start. Train stations only. */
  distance_km: number | null;
  /** [lon, lat] where the walk from the POI meets the trail. */
  junction: [number, number] | null;
}

export interface PoiCounts {
  train_station: number;
  bus_stop: number;
  hotel: number;
  camping: number;
  train_station_with_rail_service: number;
}

export interface LinksFile {
  route_id: string;
  counts: PoiCounts;
  links: PoiLink[];
}

export interface PoiGridDefinition {
  /** [lonMin, latMin, lonMax, latMax] */
  bbox: [number, number, number, number];
  cols: number;
  rows: number;
}

export interface PoiIndex {
  generated_at: string;
  grid: PoiGridDefinition;
  squares: { col: number; row: number; count: number }[];
}

export interface PoiSquareFile {
  square: { col: number; row: number };
  pois: PoiRecord[];
}

/** A POI of one track: the grid record joined with its link. */
export interface PointOfInterest {
  id: string;
  name: string;
  lat: number;
  lon: number;
  poi_type: PoiType;
  url?: string;
  transit_lines?: string[];
  /** Position along the trail (train stations only). */
  distance_km?: number;
  distance_to_trail_m: number;
  junction?: [number, number];
  rail_service?: RailService | null;
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
  poi_counts: PoiCounts;
  elevation_path: string;
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
  station_positions_km?: number[];
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
  bbox?: [number, number, number, number];
  mapStyle?: MapStyle;
  routeName?: string;
}

export type LayerKind = "france" | "contours" | "hillshade";
export type SquareKey = `${number}_${number}`;

export interface PmtilesFileEntry {
  url: string;
  size: number;
  minzoom: number;
  maxzoom: number;
}

export interface LayerZoomSpec {
  base_minzoom: number;
  base_maxzoom: number;
  grid_minzoom: number;
  grid_maxzoom: number;
}

export interface GridSquareEntry {
  bbox: [number, number, number, number];
  files: Record<LayerKind, PmtilesFileEntry>;
}

export interface GridManifest {
  version: number;
  source_snapshot: string;
  grid: {
    bbox: [number, number, number, number];
    cols: number;
    rows: number;
    pad_deg: number;
  };
  layers: Record<LayerKind, LayerZoomSpec>;
  base: Record<LayerKind, PmtilesFileEntry>;
  squares: Record<SquareKey, GridSquareEntry>;
}

export interface RouteManifest {
  route_id: string;
  source_snapshot: string;
  bbox: [number, number, number, number];
  squares: [number, number][];
}

export interface RouteOfflineRecord {
  snapshot: string;
  squares: SquareKey[];
}

export interface SectionOfflineRecord {
  routeId: string;
  snapshot: string;
  squares: SquareKey[];
  bbox: [number, number, number, number];
}
