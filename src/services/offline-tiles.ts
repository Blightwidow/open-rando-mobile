import { Directory } from "expo-file-system";
import type { MapStyle } from "@/lib/map-style";
import type {
  GridManifest,
  LayerKind,
  Route,
  RouteManifest,
  RouteOfflineRecord,
  SectionOfflineRecord,
  SquareKey,
} from "@/lib/types";
import { logError, logInfo, logWarn } from "@/lib/logger";
import type { Bbox } from "@/lib/geometry";
import { bboxesIntersect, padBbox } from "@/lib/geometry";
import {
  baseLayerFile,
  baseRootDirectory,
  ensureOfflineDirectories,
  gridRootDirectory,
  routeRecordFile,
  routeStyleDirectory,
  routeStyleFile,
  routesRootDirectory,
  sectionRecordFile,
  sectionsRootDirectory,
  squareDirectory,
  squareLayerFile,
} from "./offline-paths";
import { fetchGridManifest, fetchRouteManifest } from "./manifest";
import { downloadAllForRoute, downloadAllForSquares } from "./pmtiles-download";
import { buildOfflineStyle, persistOfflineStyle } from "./offline-style-builder";
import { ensureWorldAsset } from "./world-asset";

const LAYERS: LayerKind[] = ["france", "contours", "hillshade"];
const SECTION_BBOX_PAD_DEG = 0.01;

export interface DownloadSizeEstimate {
  totalBytes: number;
  newBytes: number;
  baseNewBytes: number;
  gridNewBytes: number;
  totalFiles: number;
  newFiles: number;
  squareCount: number;
}

function squareKey(col: number, row: number): SquareKey {
  return `${col}_${row}` as SquareKey;
}

function parseSquareKey(key: SquareKey): [number, number] | null {
  const [colStr, rowStr] = key.split("_");
  const col = Number(colStr);
  const row = Number(rowStr);
  if (!Number.isFinite(col) || !Number.isFinite(row)) return null;
  return [col, row];
}

function estimateBytes(
  gridManifest: GridManifest,
  squares: [number, number][],
): DownloadSizeEstimate {
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

  for (const [col, row] of squares) {
    const key = squareKey(col, row);
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
    squareCount: squares.length,
  };
}

export async function estimateRouteDownloadBytes(
  routeId: string,
  signal?: AbortSignal,
): Promise<DownloadSizeEstimate> {
  const [gridManifest, routeManifest] = await Promise.all([
    fetchGridManifest(signal),
    fetchRouteManifest(routeId, signal),
  ]);
  return estimateBytes(gridManifest, routeManifest.squares);
}

export function squaresIntersectingBbox(
  gridManifest: GridManifest,
  sectionBbox: Bbox,
): [number, number][] {
  const padded = padBbox(sectionBbox, SECTION_BBOX_PAD_DEG);
  const result: [number, number][] = [];
  for (const [key, entry] of Object.entries(gridManifest.squares)) {
    if (!bboxesIntersect(entry.bbox as Bbox, padded)) continue;
    const parsed = parseSquareKey(key as SquareKey);
    if (parsed) result.push(parsed);
  }
  return result;
}

export async function estimateSectionDownloadBytes(
  sectionBbox: Bbox,
  signal?: AbortSignal,
): Promise<DownloadSizeEstimate> {
  const gridManifest = await fetchGridManifest(signal);
  const squares = squaresIntersectingBbox(gridManifest, sectionBbox);
  return estimateBytes(gridManifest, squares);
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

function writeSectionRecord(sectionId: string, record: SectionOfflineRecord): void {
  const file = sectionRecordFile(sectionId);
  if (!file.exists) file.create();
  file.write(JSON.stringify(record));
}

function readSectionRecord(sectionId: string): SectionOfflineRecord | null {
  const file = sectionRecordFile(sectionId);
  if (!file.exists) return null;
  try {
    return JSON.parse(file.textSync()) as SectionOfflineRecord;
  } catch (error) {
    logError(
      "offline-tiles",
      `failed to parse section record ${sectionId}: ${String(error)}`,
    );
    return null;
  }
}

function listSectionRecords(): { id: string; record: SectionOfflineRecord }[] {
  const dir = sectionsRootDirectory();
  if (!dir.exists) return [];
  const records: { id: string; record: SectionOfflineRecord }[] = [];
  for (const entry of dir.list()) {
    if (entry instanceof Directory) continue;
    const name = entry.name;
    if (!name.endsWith(".json")) continue;
    const id = name.slice(0, -".json".length);
    const record = readSectionRecord(id);
    if (record) records.push({ id, record });
  }
  return records;
}

function routeSquareKeys(manifest: RouteManifest): SquareKey[] {
  return manifest.squares.map(([col, row]) => squareKey(col, row));
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

  const worldLocalUri = await ensureWorldAsset();
  await rebuildAndPersistStyle(route.id, theme, gridManifest, worldLocalUri);

  logInfo(
    "offline-tiles",
    `route ${route.id} ready (${record.squares.length} squares, snapshot ${record.snapshot})`,
  );
}

export async function downloadSectionTiles(
  routeId: string,
  sectionId: string,
  sectionBbox: Bbox,
  theme: MapStyle,
  onProgress: (fraction: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  ensureOfflineDirectories();

  const gridManifest = await fetchGridManifest(signal);
  const squares = squaresIntersectingBbox(gridManifest, sectionBbox);

  await downloadAllForSquares(
    `section ${sectionId}`,
    squares,
    gridManifest,
    onProgress,
    signal,
  );

  const record: SectionOfflineRecord = {
    routeId,
    snapshot: gridManifest.source_snapshot,
    squares: squares.map(([col, row]) => squareKey(col, row)),
    bbox: sectionBbox,
  };
  writeSectionRecord(sectionId, record);

  const worldLocalUri = await ensureWorldAsset();
  await rebuildAndPersistStyle(routeId, theme, gridManifest, worldLocalUri);

  logInfo(
    "offline-tiles",
    `section ${sectionId} (route ${routeId}) ready (${record.squares.length} squares)`,
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

export function removeSectionTiles(sectionId: string): void {
  const file = sectionRecordFile(sectionId);
  if (file.exists) {
    try {
      file.delete();
    } catch (error) {
      logWarn(
        "offline-tiles",
        `failed to delete section record ${sectionId}: ${String(error)}`,
      );
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
  const routeRecords = listRouteRecords();
  const sectionRecords = listSectionRecords();
  const survivingSquares = new Set<SquareKey>();
  for (const { record } of routeRecords) {
    for (const key of record.squares) survivingSquares.add(key);
  }
  for (const { record } of sectionRecords) {
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

  const hasAnyRef = routeRecords.length > 0 || sectionRecords.length > 0;
  if (!hasAnyRef) {
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

function collectRouteSquares(routeId: string): SquareKey[] {
  const merged = new Set<SquareKey>();
  const routeRecord = readRouteRecord(routeId);
  if (routeRecord) {
    for (const key of routeRecord.squares) merged.add(key);
  }
  for (const { record } of listSectionRecords()) {
    if (record.routeId !== routeId) continue;
    for (const key of record.squares) merged.add(key);
  }
  return [...merged];
}

function syntheticRouteManifest(
  routeId: string,
  gridManifest: GridManifest,
  squareKeys: SquareKey[],
): RouteManifest {
  const squares: [number, number][] = [];
  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;
  for (const key of squareKeys) {
    const parsed = parseSquareKey(key);
    if (!parsed) continue;
    squares.push(parsed);
    const square = gridManifest.squares[key];
    if (!square) continue;
    const [sMinLon, sMinLat, sMaxLon, sMaxLat] = square.bbox;
    if (sMinLon < minLon) minLon = sMinLon;
    if (sMinLat < minLat) minLat = sMinLat;
    if (sMaxLon > maxLon) maxLon = sMaxLon;
    if (sMaxLat > maxLat) maxLat = sMaxLat;
  }
  const bbox: [number, number, number, number] = Number.isFinite(minLon)
    ? [minLon, minLat, maxLon, maxLat]
    : gridManifest.grid.bbox;
  return {
    route_id: routeId,
    source_snapshot: gridManifest.source_snapshot,
    bbox,
    squares,
  };
}

async function rebuildAndPersistStyle(
  routeId: string,
  theme: MapStyle,
  gridManifest: GridManifest,
  worldLocalUri: string | null,
): Promise<string | null> {
  const squareKeys = collectRouteSquares(routeId);
  if (squareKeys.length === 0) return null;
  const routeManifest = syntheticRouteManifest(routeId, gridManifest, squareKeys);
  const style = buildOfflineStyle(theme, routeManifest, gridManifest, worldLocalUri);
  return persistOfflineStyle(routeId, theme, style);
}

export function isRouteTilesReady(
  routeId: string,
  gridManifest: GridManifest | null,
): boolean {
  const squareKeys = collectRouteSquares(routeId);
  if (squareKeys.length === 0) return false;

  for (const layer of LAYERS) {
    const file = baseLayerFile(layer);
    if (!file.exists) return false;
    if (gridManifest) {
      const expected = gridManifest.base[layer].size;
      if (file.size !== expected) return false;
    }
  }

  for (const key of squareKeys) {
    const parsed = parseSquareKey(key);
    if (!parsed) return false;
    const [col, row] = parsed;
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
  const squareKeys = collectRouteSquares(routeId);
  if (squareKeys.length === 0) return null;

  try {
    const [gridManifest, worldLocalUri] = await Promise.all([
      fetchGridManifest(),
      ensureWorldAsset(),
    ]);
    return rebuildAndPersistStyle(routeId, theme, gridManifest, worldLocalUri);
  } catch (error) {
    logError(
      "offline-tiles",
      `ensureOfflineStyle failed for ${routeId}/${theme}: ${String(error)}`,
    );
    return readOfflineStyleUri(routeId, theme);
  }
}

export function hasDownloadedAssets(routeId: string): boolean {
  return collectRouteSquares(routeId).length > 0;
}
