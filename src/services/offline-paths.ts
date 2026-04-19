import { Paths, File, Directory } from "expo-file-system";
import type { LayerKind } from "@/lib/types";
import type { MapStyle } from "@/lib/map-style";

const baseDirectory = new Directory(Paths.document, "base");
const gridDirectory = new Directory(Paths.document, "grid");
const routesDirectory = new Directory(Paths.document, "routes");
const stylesDirectory = new Directory(Paths.document, "styles");
const gridManifestFile = new File(Paths.document, "grid.json");

export function ensureOfflineDirectories(): void {
  for (const directory of [
    baseDirectory,
    gridDirectory,
    routesDirectory,
    stylesDirectory,
  ]) {
    if (!directory.exists) directory.create();
  }
}

export function baseLayerFile(layer: LayerKind): File {
  return new File(baseDirectory, `${layer}.pmtiles`);
}

export function squareDirectory(col: number, row: number): Directory {
  return new Directory(gridDirectory, `${col}_${row}`);
}

export function squareLayerFile(col: number, row: number, layer: LayerKind): File {
  return new File(squareDirectory(col, row), `${layer}.pmtiles`);
}

export function routeRecordFile(routeId: string): File {
  return new File(routesDirectory, `${routeId}.json`);
}

export function routeManifestCacheFile(routeId: string): File {
  return new File(routesDirectory, `${routeId}.pmtiles.json`);
}

export function routeStyleDirectory(routeId: string): Directory {
  return new Directory(stylesDirectory, routeId);
}

export function routeStyleFile(routeId: string, style: MapStyle): File {
  return new File(routeStyleDirectory(routeId), `${style}.json`);
}

export function gridManifestCacheFile(): File {
  return gridManifestFile;
}

export function gridRootDirectory(): Directory {
  return gridDirectory;
}

export function baseRootDirectory(): Directory {
  return baseDirectory;
}

export function routesRootDirectory(): Directory {
  return routesDirectory;
}

export function stylesRootDirectory(): Directory {
  return stylesDirectory;
}
