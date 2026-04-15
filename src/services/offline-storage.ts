import { Paths, File, Directory } from "expo-file-system";
import type { ElevationProfile, Route } from "@/lib/types";
import { fetchElevation, fetchGeoJson } from "./api";
import { logInfo, logDebug } from "@/lib/logger";

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

export async function downloadRouteData(
  route: Route,
  onProgress?: (progress: number) => void,
): Promise<void> {
  logInfo("offline-storage", `Downloading route data for ${route.id}`);
  const directory = routeDirectory(route.id);
  if (!directory.exists) {
    directory.create();
  }

  onProgress?.(0.1);

  const [geoJson, elevation] = await Promise.all([
    fetchGeoJson(route.id),
    fetchElevation(route.id),
  ]);

  onProgress?.(0.6);

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

  onProgress?.(1.0);
  logInfo("offline-storage", `Download complete for ${route.id}`);
}

export function deleteRouteData(routeId: string): void {
  logInfo("offline-storage", `Deleting route data for ${routeId}`);
  const directory = routeDirectory(routeId);
  if (directory.exists) {
    directory.delete();
  }
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
