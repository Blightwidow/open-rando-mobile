import { Directory } from "expo-file-system";
import type { MapStyle } from "@/lib/map-style";
import type {
  GridManifest,
  LayerKind,
  Route,
  RouteManifest,
  RouteOfflineRecord,
  SquareKey,
} from "@/lib/types";
import { logError, logInfo, logWarn } from "@/lib/logger";
import {
  baseLayerFile,
  baseRootDirectory,
  ensureOfflineDirectories,
  gridRootDirectory,
  routeRecordFile,
  routeStyleDirectory,
  routeStyleFile,
  routesRootDirectory,
  squareDirectory,
  squareLayerFile,
} from "./offline-paths";
import { fetchGridManifest, fetchRouteManifest } from "./manifest";
import { downloadAllForRoute } from "./pmtiles-download";
import { buildOfflineStyle, persistOfflineStyle } from "./offline-style-builder";

const LAYERS: LayerKind[] = ["france", "contours", "hillshade"];

export interface DownloadSizeEstimate {
  totalBytes: number;
  newBytes: number;
  baseNewBytes: number;
  gridNewBytes: number;
  totalFiles: number;
  newFiles: number;
  squareCount: number;
}

export async function estimateRouteDownloadBytes(
  routeId: string,
  signal?: AbortSignal,
): Promise<DownloadSizeEstimate> {
  const [gridManifest, routeManifest] = await Promise.all([
    fetchGridManifest(signal),
    fetchRouteManifest(routeId, signal),
  ]);

  let totalBytes = 0;
  let newBytes = 0;
  let baseNewBytes = 0;
  let gridNewBytes = 0;
  let totalFiles = 0;
  let newFiles = 0;

  for (const layer of LAYERS) {
    const entry = gridManifest.base[layer];
    totalBytes += entry.size;
    totalFiles += 1;
    const file = baseLayerFile(layer);
    if (!file.exists || file.size !== entry.size) {
      newBytes += entry.size;
      baseNewBytes += entry.size;
      newFiles += 1;
    }
  }

  for (const [col, row] of routeManifest.squares) {
    const key = `${col}_${row}` as SquareKey;
    const square = gridManifest.squares[key];
    if (!square) continue;
    for (const layer of LAYERS) {
      const entry = square.files[layer];
      totalBytes += entry.size;
      totalFiles += 1;
      const file = squareLayerFile(col, row, layer);
      if (!file.exists || file.size !== entry.size) {
        newBytes += entry.size;
        gridNewBytes += entry.size;
        newFiles += 1;
      }
    }
  }

  return {
    totalBytes,
    newBytes,
    baseNewBytes,
    gridNewBytes,
    totalFiles,
    newFiles,
    squareCount: routeManifest.squares.length,
  };
}

function writeRouteRecord(routeId: string, record: RouteOfflineRecord): void {
  const file = routeRecordFile(routeId);
  if (!file.exists) file.create();
  file.write(JSON.stringify(record));
}

function readRouteRecord(routeId: string): RouteOfflineRecord | null {
  const file = routeRecordFile(routeId);
  if (!file.exists) return null;
  try {
    return JSON.parse(file.textSync()) as RouteOfflineRecord;
  } catch (error) {
    logError(
      "offline-tiles",
      `failed to parse route record ${routeId}: ${String(error)}`,
    );
    return null;
  }
}

function routeSquareKeys(manifest: RouteManifest): SquareKey[] {
  return manifest.squares.map(([col, row]) => `${col}_${row}` as SquareKey);
}

export async function downloadRouteTiles(
  route: Route,
  theme: MapStyle,
  onProgress: (fraction: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  ensureOfflineDirectories();

  const [gridManifest, routeManifest] = await Promise.all([
    fetchGridManifest(signal),
    fetchRouteManifest(route.id, signal),
  ]);

  if (routeManifest.source_snapshot !== gridManifest.source_snapshot) {
    logWarn(
      "offline-tiles",
      `snapshot mismatch: route ${routeManifest.source_snapshot} vs grid ${gridManifest.source_snapshot}`,
    );
  }

  await downloadAllForRoute(route.id, routeManifest, gridManifest, onProgress, signal);

  const record: RouteOfflineRecord = {
    snapshot: gridManifest.source_snapshot,
    squares: routeSquareKeys(routeManifest),
  };
  writeRouteRecord(route.id, record);

  const style = buildOfflineStyle(theme, routeManifest, gridManifest);
  persistOfflineStyle(route.id, theme, style);

  logInfo(
    "offline-tiles",
    `route ${route.id} ready (${record.squares.length} squares, snapshot ${record.snapshot})`,
  );
}

export function removeRouteTiles(routeId: string): void {
  const record = routeRecordFile(routeId);
  if (record.exists) {
    try {
      record.delete();
    } catch (error) {
      logWarn("offline-tiles", `failed to delete record ${routeId}: ${String(error)}`);
    }
  }
  const styleDir = routeStyleDirectory(routeId);
  if (styleDir.exists) {
    try {
      styleDir.delete();
    } catch (error) {
      logWarn("offline-tiles", `failed to delete styles ${routeId}: ${String(error)}`);
    }
  }
}

function listRouteRecords(): { id: string; record: RouteOfflineRecord }[] {
  const dir = routesRootDirectory();
  if (!dir.exists) return [];
  const entries = dir.list();
  const records: { id: string; record: RouteOfflineRecord }[] = [];
  for (const entry of entries) {
    if (entry instanceof Directory) continue;
    const name = entry.name;
    if (!name.endsWith(".json") || name.endsWith(".pmtiles.json")) continue;
    const id = name.slice(0, -".json".length);
    const record = readRouteRecord(id);
    if (record) records.push({ id, record });
  }
  return records;
}

export function gcOfflineTiles(): void {
  ensureOfflineDirectories();
  const records = listRouteRecords();
  const survivingSquares = new Set<SquareKey>();
  for (const { record } of records) {
    for (const key of record.squares) survivingSquares.add(key);
  }

  const gridRoot = gridRootDirectory();
  if (gridRoot.exists) {
    for (const entry of gridRoot.list()) {
      if (!(entry instanceof Directory)) continue;
      if (!survivingSquares.has(entry.name as SquareKey)) {
        try {
          entry.delete();
          logInfo("offline-tiles", `gc deleted grid/${entry.name}`);
        } catch (error) {
          logWarn("offline-tiles", `gc failed grid/${entry.name}: ${String(error)}`);
        }
      }
    }
  }

  if (records.length === 0) {
    for (const layer of LAYERS) {
      const file = baseLayerFile(layer);
      if (file.exists) {
        try {
          file.delete();
          logInfo("offline-tiles", `gc deleted base/${layer}`);
        } catch (error) {
          logWarn("offline-tiles", `gc failed base/${layer}: ${String(error)}`);
        }
      }
    }
    const baseDir = baseRootDirectory();
    if (baseDir.exists) {
      try {
        baseDir.delete();
        baseDir.create();
      } catch {
        // ignore
      }
    }
  }
}

export function isRouteTilesReady(
  routeId: string,
  gridManifest: GridManifest | null,
): boolean {
  const record = readRouteRecord(routeId);
  if (!record) return false;
  if (gridManifest && record.snapshot !== gridManifest.source_snapshot) {
    return false;
  }

  for (const layer of LAYERS) {
    const file = baseLayerFile(layer);
    if (!file.exists) return false;
    if (gridManifest) {
      const expected = gridManifest.base[layer].size;
      if (file.size !== expected) return false;
    }
  }

  for (const key of record.squares) {
    const [colStr, rowStr] = key.split("_");
    const col = Number(colStr);
    const row = Number(rowStr);
    if (!Number.isFinite(col) || !Number.isFinite(row)) return false;
    const dir = squareDirectory(col, row);
    if (!dir.exists) return false;
    for (const layer of LAYERS) {
      const file = squareLayerFile(col, row, layer);
      if (!file.exists) return false;
      if (gridManifest) {
        const square = gridManifest.squares[key];
        if (!square) return false;
        if (file.size !== square.files[layer].size) return false;
      }
    }
  }

  return true;
}

export function readOfflineStyleUri(routeId: string, theme: MapStyle): string | null {
  const file = routeStyleFile(routeId, theme);
  return file.exists ? file.uri : null;
}

export async function ensureOfflineStyle(
  routeId: string,
  theme: MapStyle,
): Promise<string | null> {
  const record = readRouteRecord(routeId);
  if (!record) return null;

  try {
    const [gridManifest, routeManifest] = await Promise.all([
      fetchGridManifest(),
      fetchRouteManifest(routeId),
    ]);
    const style = buildOfflineStyle(theme, routeManifest, gridManifest);
    return persistOfflineStyle(routeId, theme, style);
  } catch (error) {
    logError(
      "offline-tiles",
      `ensureOfflineStyle failed for ${routeId}/${theme}: ${String(error)}`,
    );
    return readOfflineStyleUri(routeId, theme);
  }
}
