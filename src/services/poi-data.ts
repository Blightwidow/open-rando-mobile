import { BASE_DATA_URL } from "@/lib/constants";
import { logInfo } from "@/lib/logger";
import { squareKey, squaresForBoundingBox, type PoiSquare } from "@/lib/poi-grid";
import { linkPoisToTrack } from "@/lib/poi-linking";
import { joinRoutePois } from "@/lib/route-pois";
import type {
  LinksFile,
  PoiIndex,
  PoiRecord,
  PoiSquareFile,
  PointOfInterest,
  Route,
} from "@/lib/types";

const POI_BASE_URL = `${BASE_DATA_URL}/pois`;
const MAX_PARALLEL_SQUARE_FETCHES = 3;
// A square is 0.2 to 3 MB of JSON: keep a few for consecutive imports, not the whole grid
const MAX_CACHED_SQUARES = 8;

let cachedIndex: PoiIndex | null = null;
// Keyed by index generation + square, so a rebuilt grid never serves stale squares
const cachedSquares = new Map<string, PoiRecord[]>();

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function fetchPoiIndex(signal?: AbortSignal): Promise<PoiIndex> {
  if (cachedIndex) return cachedIndex;
  const index = await fetchJson<PoiIndex>(`${POI_BASE_URL}/index.json`, signal);
  cachedIndex = index;
  return index;
}

/** Drops the in-memory index and squares, e.g. to pick up a rebuilt grid. */
export function clearPoiCache(): void {
  cachedIndex = null;
  cachedSquares.clear();
}

async function fetchPoiSquare(
  index: PoiIndex,
  square: PoiSquare,
  signal?: AbortSignal,
): Promise<PoiRecord[]> {
  const key = squareKey(square);
  const entry = index.squares.find(
    (candidate) => candidate.col === square[0] && candidate.row === square[1],
  );
  // A square absent from the index was never built, which is different from empty
  if (!entry) throw new Error(`POI square ${key} is missing from pois/index.json`);
  if (entry.count === 0) return [];

  const cacheKey = `${index.generated_at}/${key}`;
  const cached = cachedSquares.get(cacheKey);
  if (cached) return cached;

  const file = await fetchJson<PoiSquareFile>(`${POI_BASE_URL}/${key}.json`, signal);
  cachedSquares.set(cacheKey, file.pois);
  if (cachedSquares.size > MAX_CACHED_SQUARES) {
    const oldestKey = cachedSquares.keys().next().value;
    if (oldestKey !== undefined) cachedSquares.delete(oldestKey);
  }
  return file.pois;
}

async function fetchPoiSquares(
  squares: PoiSquare[],
  signal?: AbortSignal,
): Promise<PoiRecord[]> {
  const index = await fetchPoiIndex(signal);
  const pois: PoiRecord[] = [];
  for (let start = 0; start < squares.length; start += MAX_PARALLEL_SQUARE_FETCHES) {
    const batch = squares.slice(start, start + MAX_PARALLEL_SQUARE_FETCHES);
    const results = await Promise.all(
      batch.map((square) => fetchPoiSquare(index, square, signal)),
    );
    for (const result of results) pois.push(...result);
  }
  return pois;
}

async function fetchPoisForBoundingBox(
  bbox: [number, number, number, number],
  signal?: AbortSignal,
): Promise<PoiRecord[]> {
  const index = await fetchPoiIndex(signal);
  const squares = squaresForBoundingBox(index.grid, bbox);
  logInfo(
    "poi-data",
    `Loading ${squares.length} POI square(s): ${squares.map(squareKey).join(", ")}`,
  );
  return fetchPoiSquares(squares, signal);
}

/** POIs of a curated route: its links file joined with the squares around its bbox. */
export async function buildRoutePois(
  route: Pick<Route, "id" | "bbox">,
  signal?: AbortSignal,
): Promise<PointOfInterest[]> {
  const [links, records] = await Promise.all([
    fetchJson<LinksFile>(`${BASE_DATA_URL}/links/${route.id}.json`, signal),
    fetchPoisForBoundingBox(route.bbox, signal),
  ]);
  const poisById = new Map(records.map((record) => [record.id, record]));
  const pois = joinRoutePois(links.links, poisById);
  logInfo("poi-data", `Route ${route.id}: ${pois.length} POIs joined`);
  return pois;
}

/** POIs along a custom track, linked on the device with the backend's rules. */
export async function buildTrackPois(
  coordinates: [number, number][],
  bbox: [number, number, number, number],
  signal?: AbortSignal,
): Promise<PointOfInterest[]> {
  const records = await fetchPoisForBoundingBox(bbox, signal);
  const links = linkPoisToTrack(coordinates, records);
  const poisById = new Map(records.map((record) => [record.id, record]));
  const pois = joinRoutePois(links, poisById);
  logInfo(
    "poi-data",
    `Custom track: ${pois.length} POIs linked from ${records.length} candidates`,
  );
  return pois;
}
