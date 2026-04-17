import { getStyle, type MapStyle, type MapStyleSpec } from "@/lib/map-style";
import type {
  GridManifest,
  LayerKind,
  LayerZoomSpec,
  RouteManifest,
  SquareKey,
} from "@/lib/types";
import { logInfo } from "@/lib/logger";
import {
  baseLayerFile,
  ensureOfflineDirectories,
  routeStyleDirectory,
  routeStyleFile,
  squareLayerFile,
} from "./offline-paths";

const SOURCE_TO_LAYER: Record<string, LayerKind> = {
  protomaps: "france",
  contours: "contours",
  hillshade: "hillshade",
};

const ONLINE_ONLY_SOURCES = new Set(["protomaps_world"]);

interface StyleLayer {
  id: string;
  source?: string;
  [key: string]: unknown;
}

function pmtilesFileUri(fileUri: string): string {
  return `pmtiles://${fileUri}`;
}

function baseSourceId(kind: LayerKind): string {
  return `${kind}__base`;
}

function gridSourceId(kind: LayerKind, key: SquareKey): string {
  return `${kind}__${key}`;
}

function makeVectorSource(
  fileUri: string,
  bbox: [number, number, number, number],
  minzoom: number,
  maxzoom: number,
): Record<string, unknown> {
  return {
    type: "vector",
    url: pmtilesFileUri(fileUri),
    bounds: bbox,
    minzoom,
    maxzoom,
  };
}

function makeHillshadeSource(
  fileUri: string,
  bbox: [number, number, number, number],
  minzoom: number,
  maxzoom: number,
): Record<string, unknown> {
  return {
    type: "raster-dem",
    url: pmtilesFileUri(fileUri),
    encoding: "mapbox",
    tileSize: 512,
    bounds: bbox,
    minzoom,
    maxzoom,
  };
}

function makeSource(
  kind: LayerKind,
  fileUri: string,
  bbox: [number, number, number, number],
  minzoom: number,
  maxzoom: number,
): Record<string, unknown> {
  return kind === "hillshade"
    ? makeHillshadeSource(fileUri, bbox, minzoom, maxzoom)
    : makeVectorSource(fileUri, bbox, minzoom, maxzoom);
}

export function buildOfflineStyle(
  theme: MapStyle,
  routeManifest: RouteManifest,
  gridManifest: GridManifest,
): MapStyleSpec {
  const base = getStyle(theme);
  const next: MapStyleSpec = {
    ...base,
    sources: {},
    layers: [],
  };

  for (const [id, source] of Object.entries(base.sources)) {
    if (ONLINE_ONLY_SOURCES.has(id)) continue;
    if (id in SOURCE_TO_LAYER) continue;
    next.sources[id] = source;
  }

  const gridBbox = gridManifest.grid.bbox;
  for (const kind of ["france", "contours", "hillshade"] as LayerKind[]) {
    const entry = gridManifest.base[kind];
    next.sources[baseSourceId(kind)] = makeSource(
      kind,
      baseLayerFile(kind).uri,
      gridBbox,
      entry.minzoom,
      entry.maxzoom,
    );
  }

  for (const [col, row] of routeManifest.squares) {
    const key: SquareKey = `${col}_${row}`;
    const square = gridManifest.squares[key];
    if (!square) continue;
    for (const kind of ["france", "contours", "hillshade"] as LayerKind[]) {
      const entry = square.files[kind];
      next.sources[gridSourceId(kind, key)] = makeSource(
        kind,
        squareLayerFile(col, row, kind).uri,
        square.bbox,
        entry.minzoom,
        entry.maxzoom,
      );
    }
  }

  const originalLayers = base.layers as StyleLayer[];
  const nextLayers: StyleLayer[] = [];

  for (const layer of originalLayers) {
    const sourceId = layer.source;
    if (!sourceId) {
      nextLayers.push(layer);
      continue;
    }
    if (ONLINE_ONLY_SOURCES.has(sourceId)) continue;
    const kind = SOURCE_TO_LAYER[sourceId];
    if (!kind) {
      nextLayers.push(layer);
      continue;
    }
    const zoom: LayerZoomSpec = gridManifest.layers[kind];

    nextLayers.push({
      ...layer,
      id: `${layer.id}__base`,
      source: baseSourceId(kind),
      minzoom: zoom.base_minzoom,
      maxzoom: zoom.base_maxzoom + 1,
    });

    for (const [col, row] of routeManifest.squares) {
      const key: SquareKey = `${col}_${row}`;
      if (!gridManifest.squares[key]) continue;
      const gridLayer: StyleLayer = {
        ...layer,
        id: `${layer.id}__${key}`,
        source: gridSourceId(kind, key),
        minzoom: zoom.grid_minzoom,
      };
      delete gridLayer.maxzoom;
      nextLayers.push(gridLayer);
    }
  }

  next.layers = nextLayers;
  return next;
}

export function persistOfflineStyle(
  routeId: string,
  theme: MapStyle,
  style: MapStyleSpec,
): string {
  ensureOfflineDirectories();
  const dir = routeStyleDirectory(routeId);
  if (!dir.exists) dir.create();
  const file = routeStyleFile(routeId, theme);
  if (!file.exists) file.create();
  file.write(JSON.stringify(style));
  logInfo(
    "offline-style",
    `wrote ${routeId}/${theme}.json (${(style.layers as unknown[]).length} layers)`,
  );
  return file.uri;
}
