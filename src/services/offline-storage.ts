import { Paths, File, Directory } from "expo-file-system";
import type { ElevationProfile, Hike } from "@/lib/types";
import { fetchElevation, fetchGeoJson } from "./api";

const hikesDirectory = new Directory(Paths.document, "hikes");

function hikeDirectory(hikeId: string): Directory {
  return new Directory(hikesDirectory, hikeId);
}

function geoJsonFile(hikeId: string): File {
  return new File(hikeDirectory(hikeId), "geojson.json");
}

function elevationFile(hikeId: string): File {
  return new File(hikeDirectory(hikeId), "elevation.json");
}

export function ensureHikesDirectory(): void {
  if (!hikesDirectory.exists) {
    hikesDirectory.create();
  }
}

export function isHikeDownloaded(hikeId: string): boolean {
  return geoJsonFile(hikeId).exists && elevationFile(hikeId).exists;
}

export async function downloadHikeData(
  hike: Hike,
  onProgress?: (progress: number) => void,
): Promise<void> {
  const directory = hikeDirectory(hike.id);
  if (!directory.exists) {
    directory.create();
  }

  onProgress?.(0.1);

  const [geoJson, elevation] = await Promise.all([
    fetchGeoJson(hike.id),
    fetchElevation(hike.id),
  ]);

  onProgress?.(0.6);

  const geoJsonTarget = geoJsonFile(hike.id);
  const elevationTarget = elevationFile(hike.id);

  if (!geoJsonTarget.exists) {
    geoJsonTarget.create();
  }
  geoJsonTarget.write(JSON.stringify(geoJson));

  if (!elevationTarget.exists) {
    elevationTarget.create();
  }
  elevationTarget.write(JSON.stringify(elevation));

  onProgress?.(1.0);
}

export function deleteHikeData(hikeId: string): void {
  const directory = hikeDirectory(hikeId);
  if (directory.exists) {
    directory.delete();
  }
}

export async function readGeoJson(hikeId: string): Promise<unknown> {
  const content = await geoJsonFile(hikeId).text();
  return JSON.parse(content);
}

export async function readElevation(
  hikeId: string,
): Promise<ElevationProfile> {
  const content = await elevationFile(hikeId).text();
  return JSON.parse(content) as ElevationProfile;
}

export function getDownloadedHikeIds(): string[] {
  ensureHikesDirectory();
  const entries = hikesDirectory.list();
  const downloadedIds: string[] = [];

  for (const entry of entries) {
    if (entry instanceof Directory) {
      const geoJsonExists = new File(entry, "geojson.json").exists;
      if (geoJsonExists) {
        downloadedIds.push(entry.name);
      }
    }
  }

  return downloadedIds;
}
