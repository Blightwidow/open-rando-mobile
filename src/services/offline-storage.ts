import { Paths, File, Directory } from "expo-file-system";
import MapLibreGL from "@maplibre/maplibre-react-native";
import type { ElevationProfile, Route } from "@/lib/types";
import type { MapStyle } from "@/lib/constants";
import {
  tileStyleUrl,
  OFFLINE_TILE_MIN_ZOOM,
  OFFLINE_TILE_MAX_ZOOM,
} from "@/lib/constants";
import { fetchElevation, fetchGeoJson } from "./api";
import { logInfo, logDebug, logError } from "@/lib/logger";

const routesDirectory = new Directory(Paths.document, "hikes");

function routeDirectory(routeId: string): Directory {
  return new Directory(routesDirectory, routeId);
}

function geoJsonFile(routeId: string): File {
  return new File(routeDirectory(routeId), "geojson.json");
}

function elevationFile(routeId: string): File {
  return new File(routeDirectory(routeId), "elevation.json");
}

export function ensureRoutesDirectory(): void {
  if (!routesDirectory.exists) {
    logInfo("offline-storage", "Creating routes directory");
    routesDirectory.create();
  }
}

export function isRouteDownloaded(routeId: string): boolean {
  return geoJsonFile(routeId).exists && elevationFile(routeId).exists;
}

const ALL_MAP_STYLES: MapStyle[] = ["liberty", "bright"];

export function tilePackName(routeId: string, mapStyle: MapStyle): string {
  return `tiles-${routeId}-${mapStyle}`;
}

async function downloadTilePack(
  routeId: string,
  bbox: [number, number, number, number],
  mapStyle: MapStyle,
  onProgress?: (progress: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  const packName = tilePackName(routeId, mapStyle);
  const styleURL = tileStyleUrl(mapStyle);

  logInfo("offline-storage", `Downloading tile pack ${packName}`);

  // Delete existing pack of this style if present
  try {
    await MapLibreGL.OfflineManager.deletePack(packName);
  } catch {
    // Pack may not exist, ignore
  }

  return new Promise<void>((resolve, reject) => {
    // Cancellation: deleting an in-progress pack triggers the error callback
    signal?.addEventListener("abort", () => {
      MapLibreGL.OfflineManager.deletePack(packName).catch(() => {});
    });

    MapLibreGL.OfflineManager.createPack(
      {
        name: packName,
        styleURL,
        bounds: [
          [bbox[2], bbox[3]], // ne [lon, lat]
          [bbox[0], bbox[1]], // sw [lon, lat]
        ],
        minZoom: OFFLINE_TILE_MIN_ZOOM,
        maxZoom: OFFLINE_TILE_MAX_ZOOM,
      },
      (_pack, status) => {
        if (signal?.aborted) return;
        onProgress?.(status.percentage / 100);
        if (status.percentage >= 100) {
          resolve();
        }
      },
      (_pack, error) => {
        if (signal?.aborted) {
          // Triggered by our deletePack cancel — resolve as aborted
          reject(new DOMException("Download cancelled", "AbortError"));
          return;
        }
        logError("offline-storage", `Tile pack error: ${error.message}`);
        reject(new Error(error.message));
      },
    ).catch(reject); // propagate async errors (e.g. pack already exists)
  });
}

async function deleteTilePack(routeId: string): Promise<void> {
  for (const mapStyle of ALL_MAP_STYLES) {
    try {
      await MapLibreGL.OfflineManager.deletePack(tilePackName(routeId, mapStyle));
      logInfo("offline-storage", `Deleted tile pack ${tilePackName(routeId, mapStyle)}`);
    } catch {
      // Pack may not exist
    }
  }
}

export async function downloadRouteData(
  route: Route,
  mapStyle: MapStyle,
  onProgress?: (progress: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  logInfo(
    "offline-storage",
    `Downloading route data for ${route.id} (style: ${mapStyle})`,
  );
  const directory = routeDirectory(route.id);
  if (!directory.exists) {
    directory.create();
  }

  onProgress?.(0.05);

  // Phase 1: GeoJSON + elevation (0% → 30%)
  const [geoJson, elevation] = await Promise.all([
    fetchGeoJson(route.id, signal),
    fetchElevation(route.id, signal),
  ]);

  onProgress?.(0.2);

  const geoJsonTarget = geoJsonFile(route.id);
  const elevationTarget = elevationFile(route.id);

  if (!geoJsonTarget.exists) {
    geoJsonTarget.create();
  }
  geoJsonTarget.write(JSON.stringify(geoJson));

  if (!elevationTarget.exists) {
    elevationTarget.create();
  }
  elevationTarget.write(JSON.stringify(elevation));

  onProgress?.(0.3);

  // Phase 2: Tile pack (30% → 100%)
  await downloadTilePack(
    route.id,
    route.bbox,
    mapStyle,
    (tileProgress) => {
      onProgress?.(0.3 + tileProgress * 0.7);
    },
    signal,
  );

  onProgress?.(1.0);
  logInfo("offline-storage", `Download complete for ${route.id}`);
}

export function getStorageUsedBytes(): number {
  ensureRoutesDirectory();
  return routesDirectory.size ?? 0;
}

export function deleteRouteData(routeId: string): void {
  logInfo("offline-storage", `Deleting route data for ${routeId}`);
  const directory = routeDirectory(routeId);
  if (directory.exists) {
    directory.delete();
  }
  // Fire-and-forget tile pack deletion
  deleteTilePack(routeId).catch(() => {});
}

export async function readGeoJson(routeId: string): Promise<unknown> {
  const content = await geoJsonFile(routeId).text();
  return JSON.parse(content);
}

export async function readElevation(routeId: string): Promise<ElevationProfile> {
  const content = await elevationFile(routeId).text();
  return JSON.parse(content) as ElevationProfile;
}

export function getDownloadedRouteIds(): string[] {
  ensureRoutesDirectory();
  const entries = routesDirectory.list();
  const downloadedIds: string[] = [];

  for (const entry of entries) {
    if (entry instanceof Directory) {
      const geoJsonExists = new File(entry, "geojson.json").exists;
      if (geoJsonExists) {
        downloadedIds.push(entry.name);
      }
    }
  }

  logDebug("offline-storage", `Found ${downloadedIds.length} downloaded routes`);
  return downloadedIds;
}
