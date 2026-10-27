import { haversineDistance } from "@/lib/geo";
import type { PoiLink, PoiRecord, PoiType } from "@/lib/types";

/**
 * Links grid POIs to a custom track, ported from the backend
 * (open-rando pipeline `processors/link.py` and `processors/match.py`).
 *
 * Differences from the backend, all on purpose:
 * - Distances are real haversine meters. The backend's degrees_to_meters averages the
 *   latitude and longitude scales, which reads north-south distances about 14% short.
 * - The position along the track is the walked haversine distance up to the nearest point.
 *   The backend refines train junctions by OSRM walking distance, unavailable offline.
 * - "Nearest point" is measured in a local metric projection, not in degree space.
 */

type Coordinate = [number, number]; // [longitude, latitude]

// config.py / fetchers/pois.py
export const MAX_STATION_DISTANCE_METERS = 5000;
export const MAX_BUS_STOP_DISTANCE_METERS = 2000;
export const MAX_ACCOMMODATION_DISTANCE_METERS = 3000;

// processors/link.py
export const CANDIDATE_BUFFER_DEGREES = 0.07;
export const CANDIDATE_SIMPLIFY_TOLERANCE_DEGREES = 0.001;

// processors/match.py
export const METERS_PER_DEGREE_LATITUDE = 111_320;
export const DEDUPLICATION_DISTANCE_METERS = 500;
export const MINIMUM_FRACTION_SEPARATION = 0.001;
export const NEAREST_STATION_RADIUS_METERS = 5000;

// Wider than the largest search radius (5 km is at most 0.072° of longitude in France)
// divided by the cell size, so a ring of 2 cells always contains every candidate in range.
const CELL_SIZE_DEGREES = 0.05;
const CELL_RING = 2;

interface PreparedTrack {
  coordinates: Coordinate[];
  /** Haversine meters from the start to each vertex. */
  cumulativeMeters: number[];
  totalMeters: number;
  segmentsByCell: Map<number, number[]>;
}

interface TrackMatch {
  distanceMeters: number;
  /** Walked haversine meters from the start up to the nearest point. */
  alongMeters: number;
  junction: Coordinate;
}

interface MatchedStation {
  poi: PoiRecord;
  fraction: number;
  match: TrackMatch;
}

function cellKey(column: number, row: number): number {
  return (column + 2000) * 100_000 + (row + 2000);
}

function cellIndex(degrees: number): number {
  return Math.floor(degrees / CELL_SIZE_DEGREES);
}

function prepareTrack(coordinates: Coordinate[]): PreparedTrack {
  const cumulativeMeters: number[] = [0];
  for (let index = 1; index < coordinates.length; index += 1) {
    const [previousLongitude, previousLatitude] = coordinates[index - 1];
    const [longitude, latitude] = coordinates[index];
    cumulativeMeters.push(
      cumulativeMeters[index - 1] +
        haversineDistance(previousLatitude, previousLongitude, latitude, longitude),
    );
  }

  const segmentsByCell = new Map<number, number[]>();
  for (let segmentIndex = 0; segmentIndex < coordinates.length - 1; segmentIndex += 1) {
    const [startLongitude, startLatitude] = coordinates[segmentIndex];
    const [endLongitude, endLatitude] = coordinates[segmentIndex + 1];
    const firstColumn = cellIndex(Math.min(startLongitude, endLongitude));
    const lastColumn = cellIndex(Math.max(startLongitude, endLongitude));
    const firstRow = cellIndex(Math.min(startLatitude, endLatitude));
    const lastRow = cellIndex(Math.max(startLatitude, endLatitude));
    for (let column = firstColumn; column <= lastColumn; column += 1) {
      for (let row = firstRow; row <= lastRow; row += 1) {
        const key = cellKey(column, row);
        const bucket = segmentsByCell.get(key);
        if (bucket) bucket.push(segmentIndex);
        else segmentsByCell.set(key, [segmentIndex]);
      }
    }
  }

  return {
    coordinates,
    cumulativeMeters,
    totalMeters: cumulativeMeters[cumulativeMeters.length - 1],
    segmentsByCell,
  };
}

/** Nearest point of the track to a POI, or null when nothing lies within maxMeters. */
function nearestOnTrack(
  track: PreparedTrack,
  longitude: number,
  latitude: number,
  maxMeters: number,
): TrackMatch | null {
  const metersPerDegreeLongitude =
    METERS_PER_DEGREE_LATITUDE * Math.cos((latitude * Math.PI) / 180);
  const column = cellIndex(longitude);
  const row = cellIndex(latitude);

  let bestSquaredMeters = Infinity;
  let bestSegmentIndex = -1;
  let bestRatio = 0;
  const visitedSegments = new Set<number>();

  for (let columnOffset = -CELL_RING; columnOffset <= CELL_RING; columnOffset += 1) {
    for (let rowOffset = -CELL_RING; rowOffset <= CELL_RING; rowOffset += 1) {
      const bucket = track.segmentsByCell.get(
        cellKey(column + columnOffset, row + rowOffset),
      );
      if (!bucket) continue;
      for (const segmentIndex of bucket) {
        if (visitedSegments.has(segmentIndex)) continue;
        visitedSegments.add(segmentIndex);

        const [startLongitude, startLatitude] = track.coordinates[segmentIndex];
        const [endLongitude, endLatitude] = track.coordinates[segmentIndex + 1];
        const startX = (startLongitude - longitude) * metersPerDegreeLongitude;
        const startY = (startLatitude - latitude) * METERS_PER_DEGREE_LATITUDE;
        const deltaX = (endLongitude - startLongitude) * metersPerDegreeLongitude;
        const deltaY = (endLatitude - startLatitude) * METERS_PER_DEGREE_LATITUDE;
        const segmentSquared = deltaX * deltaX + deltaY * deltaY;
        const ratio =
          segmentSquared === 0
            ? 0
            : Math.min(
                1,
                Math.max(0, -(startX * deltaX + startY * deltaY) / segmentSquared),
              );
        const offsetX = startX + ratio * deltaX;
        const offsetY = startY + ratio * deltaY;
        const squaredMeters = offsetX * offsetX + offsetY * offsetY;
        if (squaredMeters < bestSquaredMeters) {
          bestSquaredMeters = squaredMeters;
          bestSegmentIndex = segmentIndex;
          bestRatio = ratio;
        }
      }
    }
  }

  if (bestSegmentIndex < 0) return null;

  const [startLongitude, startLatitude] = track.coordinates[bestSegmentIndex];
  const [endLongitude, endLatitude] = track.coordinates[bestSegmentIndex + 1];
  const nearestLongitude = startLongitude + bestRatio * (endLongitude - startLongitude);
  const nearestLatitude = startLatitude + bestRatio * (endLatitude - startLatitude);
  const distanceMeters = haversineDistance(
    latitude,
    longitude,
    nearestLatitude,
    nearestLongitude,
  );
  if (distanceMeters > maxMeters) return null;

  const segmentMeters =
    track.cumulativeMeters[bestSegmentIndex + 1] -
    track.cumulativeMeters[bestSegmentIndex];
  return {
    distanceMeters,
    alongMeters: track.cumulativeMeters[bestSegmentIndex] + bestRatio * segmentMeters,
    junction: [nearestLongitude, nearestLatitude],
  };
}

function distanceToSegmentDegrees(
  longitude: number,
  latitude: number,
  start: Coordinate,
  end: Coordinate,
): number {
  const deltaLongitude = end[0] - start[0];
  const deltaLatitude = end[1] - start[1];
  const segmentSquared = deltaLongitude ** 2 + deltaLatitude ** 2;
  const ratio =
    segmentSquared === 0
      ? 0
      : Math.min(
          1,
          Math.max(
            0,
            ((longitude - start[0]) * deltaLongitude +
              (latitude - start[1]) * deltaLatitude) /
              segmentSquared,
          ),
        );
  return Math.hypot(
    longitude - (start[0] + ratio * deltaLongitude),
    latitude - (start[1] + ratio * deltaLatitude),
  );
}

/** Ramer-Douglas-Peucker, iterative so a long GPX cannot overflow the call stack. */
export function simplifyTrack(
  coordinates: Coordinate[],
  toleranceDegrees: number,
): Coordinate[] {
  if (coordinates.length <= 2) return coordinates;
  const keep = new Uint8Array(coordinates.length);
  keep[0] = 1;
  keep[coordinates.length - 1] = 1;
  const pending: [number, number][] = [[0, coordinates.length - 1]];

  while (pending.length > 0) {
    const [first, last] = pending.pop() as [number, number];
    let farthestDistance = 0;
    let farthestIndex = -1;
    for (let index = first + 1; index < last; index += 1) {
      const distance = distanceToSegmentDegrees(
        coordinates[index][0],
        coordinates[index][1],
        coordinates[first],
        coordinates[last],
      );
      if (distance > farthestDistance) {
        farthestDistance = distance;
        farthestIndex = index;
      }
    }
    if (farthestIndex >= 0 && farthestDistance > toleranceDegrees) {
      keep[farthestIndex] = 1;
      pending.push([first, farthestIndex], [farthestIndex, last]);
    }
  }

  return coordinates.filter((_, index) => keep[index] === 1);
}

/** POIs inside the buffered, simplified track: a cheap pre-filter for the precise match. */
function candidatesNearTrack(coordinates: Coordinate[], pois: PoiRecord[]): PoiRecord[] {
  const simplified = simplifyTrack(coordinates, CANDIDATE_SIMPLIFY_TOLERANCE_DEGREES);
  let minimumLongitude = Infinity;
  let minimumLatitude = Infinity;
  let maximumLongitude = -Infinity;
  let maximumLatitude = -Infinity;
  for (const [longitude, latitude] of simplified) {
    minimumLongitude = Math.min(minimumLongitude, longitude);
    minimumLatitude = Math.min(minimumLatitude, latitude);
    maximumLongitude = Math.max(maximumLongitude, longitude);
    maximumLatitude = Math.max(maximumLatitude, latitude);
  }

  return pois.filter((poi) => {
    if (
      poi.lon < minimumLongitude - CANDIDATE_BUFFER_DEGREES ||
      poi.lon > maximumLongitude + CANDIDATE_BUFFER_DEGREES ||
      poi.lat < minimumLatitude - CANDIDATE_BUFFER_DEGREES ||
      poi.lat > maximumLatitude + CANDIDATE_BUFFER_DEGREES
    ) {
      return false;
    }
    for (let index = 0; index < simplified.length - 1; index += 1) {
      if (
        distanceToSegmentDegrees(
          poi.lon,
          poi.lat,
          simplified[index],
          simplified[index + 1],
        ) <= CANDIDATE_BUFFER_DEGREES
      ) {
        return true;
      }
    }
    return false;
  });
}

/**
 * Same name within 500 m, or nearly the same position on the track: keep the closer one.
 * Like the backend, the 500 m threshold is compared with the fraction along the track
 * (500 / 111320), so its reach in meters grows with the track length.
 */
function deduplicateStations(candidates: MatchedStation[]): MatchedStation[] {
  const fractionThreshold = DEDUPLICATION_DISTANCE_METERS / METERS_PER_DEGREE_LATITUDE;
  const deduplicated: MatchedStation[] = [];

  for (const candidate of candidates) {
    let isDuplicate = false;
    for (let existingIndex = 0; existingIndex < deduplicated.length; existingIndex += 1) {
      const existing = deduplicated[existingIndex];
      const fractionGap = Math.abs(candidate.fraction - existing.fraction);
      const isSameStation =
        candidate.poi.name === existing.poi.name && fractionGap < fractionThreshold;
      const isSamePosition = fractionGap < MINIMUM_FRACTION_SEPARATION;
      if (isSameStation || isSamePosition) {
        if (candidate.match.distanceMeters < existing.match.distanceMeters) {
          deduplicated[existingIndex] = candidate;
        }
        isDuplicate = true;
        break;
      }
    }
    if (!isDuplicate) deduplicated.push(candidate);
  }

  return deduplicated;
}

/** Drops stations that are never the closest to any track vertex within 5 km. */
function filterNeverClosestStations(
  candidates: MatchedStation[],
  track: PreparedTrack,
): MatchedStation[] {
  if (candidates.length <= 1) return candidates;

  const candidatesByCell = new Map<number, number[]>();
  candidates.forEach(({ poi }, candidateIndex) => {
    const key = cellKey(cellIndex(poi.lon), cellIndex(poi.lat));
    const bucket = candidatesByCell.get(key);
    if (bucket) bucket.push(candidateIndex);
    else candidatesByCell.set(key, [candidateIndex]);
  });

  const closestIndexes = new Set<number>();
  for (const [vertexLongitude, vertexLatitude] of track.coordinates) {
    const metersPerDegreeLongitude =
      METERS_PER_DEGREE_LATITUDE * Math.cos((vertexLatitude * Math.PI) / 180);
    const column = cellIndex(vertexLongitude);
    const row = cellIndex(vertexLatitude);

    let bestSquaredMeters = Infinity;
    let bestIndex = -1;
    for (let columnOffset = -CELL_RING; columnOffset <= CELL_RING; columnOffset += 1) {
      for (let rowOffset = -CELL_RING; rowOffset <= CELL_RING; rowOffset += 1) {
        const bucket = candidatesByCell.get(
          cellKey(column + columnOffset, row + rowOffset),
        );
        if (!bucket) continue;
        for (const candidateIndex of bucket) {
          const { poi } = candidates[candidateIndex];
          const deltaX = (poi.lon - vertexLongitude) * metersPerDegreeLongitude;
          const deltaY = (poi.lat - vertexLatitude) * METERS_PER_DEGREE_LATITUDE;
          const squaredMeters = deltaX * deltaX + deltaY * deltaY;
          if (squaredMeters < bestSquaredMeters) {
            bestSquaredMeters = squaredMeters;
            bestIndex = candidateIndex;
          }
        }
      }
    }

    if (bestIndex < 0) continue;
    const { poi } = candidates[bestIndex];
    const bestMeters = haversineDistance(
      vertexLatitude,
      vertexLongitude,
      poi.lat,
      poi.lon,
    );
    if (bestMeters <= NEAREST_STATION_RADIUS_METERS) closestIndexes.add(bestIndex);
  }

  return candidates.filter((_, index) => closestIndexes.has(index));
}

function matchStations(
  pois: PoiRecord[],
  track: PreparedTrack,
  maxMeters: number,
): MatchedStation[] {
  const candidates: MatchedStation[] = [];
  for (const poi of pois) {
    const match = nearestOnTrack(track, poi.lon, poi.lat, maxMeters);
    if (!match) continue;
    candidates.push({
      poi,
      fraction: track.totalMeters > 0 ? match.alongMeters / track.totalMeters : 0,
      match,
    });
  }
  candidates.sort((first, second) => first.fraction - second.fraction);
  return filterNeverClosestStations(deduplicateStations(candidates), track);
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function linkOrder(first: PoiLink, second: PoiLink): number {
  const firstPositionless = first.distance_km === null;
  const secondPositionless = second.distance_km === null;
  if (firstPositionless !== secondPositionless) return firstPositionless ? 1 : -1;
  const positionGap = (first.distance_km ?? 0) - (second.distance_km ?? 0);
  if (positionGap !== 0) return positionGap;
  const distanceGap = first.distance_to_trail_m - second.distance_to_trail_m;
  if (distanceGap !== 0) return distanceGap;
  return first.poi_id < second.poi_id ? -1 : first.poi_id > second.poi_id ? 1 : 0;
}

function ofKind(pois: PoiRecord[], kind: PoiType): PoiRecord[] {
  return pois.filter((poi) => poi.kind === kind);
}

/** Links for every POI near the track, ordered along it, in the shape of links/<id>.json. */
export function linkPoisToTrack(coordinates: Coordinate[], pois: PoiRecord[]): PoiLink[] {
  if (coordinates.length < 2) return [];

  const track = prepareTrack(coordinates);
  const nearby = candidatesNearTrack(coordinates, pois);

  const links: PoiLink[] = [];

  for (const { match, poi } of matchStations(
    ofKind(nearby, "train_station"),
    track,
    MAX_STATION_DISTANCE_METERS,
  )) {
    links.push({
      poi_id: poi.id,
      kind: "train_station",
      distance_to_trail_m: roundTo(match.distanceMeters, 1),
      distance_km: roundTo(match.alongMeters / 1000, 2),
      junction: match.junction,
    });
  }

  for (const { match, poi } of matchStations(
    ofKind(nearby, "bus_stop"),
    track,
    MAX_BUS_STOP_DISTANCE_METERS,
  )) {
    links.push({
      poi_id: poi.id,
      kind: "bus_stop",
      distance_to_trail_m: roundTo(match.distanceMeters, 1),
      distance_km: null,
      junction: match.junction,
    });
  }

  for (const poi of [...ofKind(nearby, "hotel"), ...ofKind(nearby, "camping")]) {
    const match = nearestOnTrack(
      track,
      poi.lon,
      poi.lat,
      MAX_ACCOMMODATION_DISTANCE_METERS,
    );
    if (!match) continue;
    links.push({
      poi_id: poi.id,
      kind: poi.kind,
      distance_to_trail_m: roundTo(match.distanceMeters, 1),
      distance_km: null,
      junction: match.junction,
    });
  }

  return links.sort(linkOrder);
}
