import { Paths, File, Directory } from "expo-file-system";
import type { MapStyle } from "@/lib/map-style";
import type { ElevationProfile, PointOfInterest, Route } from "@/lib/types";
import { fetchElevation, fetchGeoJson } from "./api";
import { buildRoutePois } from "./poi-data";
import { logDebug, logInfo, logWarn } from "@/lib/logger";
import {
  downloadRouteTiles,
  downloadSectionTiles,
  gcOfflineTiles,
  removeRouteTiles,
  removeSectionTiles,
} from "./offline-tiles";
import { sliceRouteByKm } from "@/lib/geometry";
import { poisForSection } from "@/lib/route-pois";
import {
  baseRootDirectory,
  gridRootDirectory,
  routesRootDirectory,
  stylesRootDirectory,
} from "./offline-paths";

const routesDirectory = new Directory(Paths.document, "hikes");

function routeDirectory(routeId: string): Directory {
  return new Directory(routesDirectory, routeId);
}

function routeSectionsDirectory(routeId: string): Directory {
  return new Directory(routeDirectory(routeId), "sections");
}

function sectionDirectory(routeId: string, sectionId: string): Directory {
  return new Directory(routeSectionsDirectory(routeId), sectionId);
}

function geoJsonFile(routeId: string): File {
  return new File(routeDirectory(routeId), "geojson.json");
}

function elevationFile(routeId: string): File {
  return new File(routeDirectory(routeId), "elevation.json");
}

function poisFile(routeId: string): File {
  return new File(routeDirectory(routeId), "pois.json");
}

function sectionPoisFile(routeId: string, sectionId: string): File {
  return new File(sectionDirectory(routeId, sectionId), "pois.json");
}

function writeJsonFile(target: File, value: unknown): void {
  if (!target.exists) target.create();
  target.write(JSON.stringify(value));
}

function sectionGeoJsonFile(routeId: string, sectionId: string): File {
  return new File(sectionDirectory(routeId, sectionId), "geojson.json");
}

function sectionElevationFile(routeId: string, sectionId: string): File {
  return new File(sectionDirectory(routeId, sectionId), "elevation.json");
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

export function isSectionDownloaded(routeId: string, sectionId: string): boolean {
  return (
    sectionGeoJsonFile(routeId, sectionId).exists &&
    sectionElevationFile(routeId, sectionId).exists
  );
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

  const [geoJson, elevation, pois] = await Promise.all([
    fetchGeoJson(route, signal),
    fetchElevation(route, signal),
    buildRoutePois(route, signal),
  ]);

  onProgress?.(0.2);

  writeJsonFile(poisFile(route.id), pois);

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

  await downloadRouteTiles(
    route,
    mapStyle,
    (tileFraction) => {
      onProgress?.(0.3 + tileFraction * 0.7);
    },
    signal,
  );

  onProgress?.(1.0);
  logInfo("offline-storage", `Download complete for ${route.id}`);
}

export async function downloadSectionData(
  route: Route,
  sectionId: string,
  fromKm: number,
  toKm: number,
  mapStyle: MapStyle,
  onProgress?: (progress: number) => void,
  signal?: AbortSignal,
): Promise<{ bbox: [number, number, number, number] }> {
  logInfo(
    "offline-storage",
    `Downloading section ${sectionId} [${fromKm}..${toKm}km] style=${mapStyle}`,
  );
  const parentDir = routeDirectory(route.id);
  if (!parentDir.exists) parentDir.create();
  const sectionsDir = routeSectionsDirectory(route.id);
  if (!sectionsDir.exists) sectionsDir.create();
  const sectionDir = sectionDirectory(route.id, sectionId);
  if (!sectionDir.exists) sectionDir.create();

  onProgress?.(0.05);

  const [geoJson, elevation, routePois] = await Promise.all([
    fetchGeoJson(route, signal),
    fetchElevation(route, signal),
    buildRoutePois(route, signal),
  ]);

  onProgress?.(0.15);

  logInfo("offline-storage", `Slicing section ${sectionId}`);
  const sliced = sliceRouteByKm(geoJson, elevation, fromKm, toKm);
  if (!sliced) {
    throw new Error(`section ${sectionId}: slicing produced no geometry`);
  }
  logInfo(
    "offline-storage",
    `Section ${sectionId} sliced: bbox=${JSON.stringify(sliced.bbox)}`,
  );

  writeJsonFile(
    sectionPoisFile(route.id, sectionId),
    poisForSection(routePois, fromKm, toKm, sliced.bbox),
  );

  const geoJsonTarget = sectionGeoJsonFile(route.id, sectionId);
  const elevationTarget = sectionElevationFile(route.id, sectionId);

  if (!geoJsonTarget.exists) geoJsonTarget.create();
  geoJsonTarget.write(JSON.stringify(sliced.geoJson));

  if (!elevationTarget.exists) elevationTarget.create();
  elevationTarget.write(JSON.stringify(sliced.elevation));

  onProgress?.(0.25);

  await downloadSectionTiles(
    route.id,
    sectionId,
    sliced.bbox,
    mapStyle,
    (tileFraction) => {
      onProgress?.(0.25 + tileFraction * 0.75);
    },
    signal,
  );

  onProgress?.(1.0);
  logInfo("offline-storage", `Section ${sectionId} complete`);
  return { bbox: sliced.bbox };
}

export async function saveImportedSectionData(
  routeId: string,
  sectionId: string,
  geoJson: GeoJSON.FeatureCollection,
  elevation: ElevationProfile,
  pois: PointOfInterest[],
  bbox: [number, number, number, number],
  mapStyle: MapStyle,
  onProgress?: (progress: number) => void,
  signal?: AbortSignal,
): Promise<{ bbox: [number, number, number, number] }> {
  logInfo("offline-storage", `Saving imported GPX ${sectionId} style=${mapStyle}`);
  const parentDir = routeDirectory(routeId);
  if (!parentDir.exists) parentDir.create();
  const sectionsDir = routeSectionsDirectory(routeId);
  if (!sectionsDir.exists) sectionsDir.create();
  const sectionDir = sectionDirectory(routeId, sectionId);
  if (!sectionDir.exists) sectionDir.create();

  writeJsonFile(sectionPoisFile(routeId, sectionId), pois);
  const geoJsonTarget = sectionGeoJsonFile(routeId, sectionId);
  const elevationTarget = sectionElevationFile(routeId, sectionId);
  if (!geoJsonTarget.exists) geoJsonTarget.create();
  geoJsonTarget.write(JSON.stringify(geoJson));
  if (!elevationTarget.exists) elevationTarget.create();
  elevationTarget.write(JSON.stringify(elevation));

  onProgress?.(0.25);

  await downloadSectionTiles(
    routeId,
    sectionId,
    bbox,
    mapStyle,
    (tileFraction) => {
      onProgress?.(0.25 + tileFraction * 0.75);
    },
    signal,
  );

  onProgress?.(1.0);
  logInfo("offline-storage", `Imported GPX ${sectionId} complete`);
  return { bbox };
}

export function getStorageUsedBytes(): number {
  ensureRoutesDirectory();
  let total = routesDirectory.size ?? 0;
  for (const dir of [
    baseRootDirectory(),
    gridRootDirectory(),
    routesRootDirectory(),
    stylesRootDirectory(),
  ]) {
    if (dir.exists) total += dir.size ?? 0;
  }
  return total;
}

function safeDeleteFile(file: File): void {
  if (!file.exists) return;
  try {
    file.delete();
  } catch (error) {
    logWarn("offline-storage", `delete failed ${file.uri}: ${String(error)}`);
  }
}

function safeDeleteDir(dir: Directory): void {
  if (!dir.exists) return;
  try {
    dir.delete();
  } catch (error) {
    logWarn("offline-storage", `delete failed ${dir.uri}: ${String(error)}`);
  }
}

function routeDirectoryIsEmpty(routeId: string): boolean {
  const dir = routeDirectory(routeId);
  if (!dir.exists) return true;
  try {
    return dir.list().length === 0;
  } catch {
    return false;
  }
}

export function deleteRouteData(routeId: string): void {
  logInfo("offline-storage", `Deleting full route data for ${routeId}`);
  safeDeleteFile(geoJsonFile(routeId));
  safeDeleteFile(elevationFile(routeId));
  safeDeleteFile(poisFile(routeId));
  removeRouteTiles(routeId);
  if (routeDirectoryIsEmpty(routeId)) {
    safeDeleteDir(routeDirectory(routeId));
  }
  try {
    gcOfflineTiles();
  } catch {
    // best-effort
  }
}

export function deleteSectionData(routeId: string, sectionId: string): void {
  logInfo("offline-storage", `Deleting section ${sectionId} for ${routeId}`);
  safeDeleteDir(sectionDirectory(routeId, sectionId));
  removeSectionTiles(sectionId);

  const sectionsDir = routeSectionsDirectory(routeId);
  if (sectionsDir.exists) {
    try {
      if (sectionsDir.list().length === 0) safeDeleteDir(sectionsDir);
    } catch {
      // ignore
    }
  }
  if (routeDirectoryIsEmpty(routeId)) {
    safeDeleteDir(routeDirectory(routeId));
  }

  try {
    gcOfflineTiles();
  } catch {
    // best-effort
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

export async function readSectionGeoJson(
  routeId: string,
  sectionId: string,
): Promise<unknown> {
  const content = await sectionGeoJsonFile(routeId, sectionId).text();
  return JSON.parse(content);
}

export async function readSectionElevation(
  routeId: string,
  sectionId: string,
): Promise<ElevationProfile> {
  const content = await sectionElevationFile(routeId, sectionId).text();
  return JSON.parse(content) as ElevationProfile;
}

async function readPoisFile(source: File): Promise<PointOfInterest[]> {
  // Routes saved before POIs were split from the catalog have no pois.json
  if (!source.exists) return [];
  return JSON.parse(await source.text()) as PointOfInterest[];
}

export function readPois(routeId: string): Promise<PointOfInterest[]> {
  return readPoisFile(poisFile(routeId));
}

export function readSectionPois(
  routeId: string,
  sectionId: string,
): Promise<PointOfInterest[]> {
  return readPoisFile(sectionPoisFile(routeId, sectionId));
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
