import type { ElevationProfile } from "@/lib/types";

export type Bbox = [number, number, number, number];

type Coord = [number, number];

const EARTH_RADIUS_KM = 6371;

function haversineKm(a: Coord, b: Coord): number {
  const toRad = (deg: number): number => (deg * Math.PI) / 180;
  const [lon1, lat1] = a;
  const [lon2, lat2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(s));
}

function extractLineStrings(geoJson: unknown): Coord[][] {
  const result: Coord[][] = [];
  if (!geoJson || typeof geoJson !== "object") return result;
  const obj = geoJson as {
    type?: string;
    features?: unknown[];
    geometry?: unknown;
    coordinates?: unknown;
  };

  if (obj.type === "FeatureCollection" && Array.isArray(obj.features)) {
    for (const feature of obj.features) {
      result.push(...extractLineStrings(feature));
    }
    return result;
  }

  if (obj.type === "Feature" && obj.geometry) {
    return extractLineStrings(obj.geometry);
  }

  if (obj.type === "LineString" && Array.isArray(obj.coordinates)) {
    result.push(obj.coordinates as Coord[]);
  }

  if (obj.type === "MultiLineString" && Array.isArray(obj.coordinates)) {
    for (const line of obj.coordinates as Coord[][]) {
      result.push(line);
    }
  }

  return result;
}

export function computeBboxFromCoords(coords: Coord[]): Bbox | null {
  if (coords.length === 0) return null;
  let minLon = coords[0][0];
  let minLat = coords[0][1];
  let maxLon = coords[0][0];
  let maxLat = coords[0][1];
  for (const [lon, lat] of coords) {
    if (lon < minLon) minLon = lon;
    if (lat < minLat) minLat = lat;
    if (lon > maxLon) maxLon = lon;
    if (lat > maxLat) maxLat = lat;
  }
  return [minLon, minLat, maxLon, maxLat];
}

export function padBbox(bbox: Bbox, paddingDeg: number): Bbox {
  return [
    bbox[0] - paddingDeg,
    bbox[1] - paddingDeg,
    bbox[2] + paddingDeg,
    bbox[3] + paddingDeg,
  ];
}

export function bboxesIntersect(a: Bbox, b: Bbox): boolean {
  return a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
}

interface SlicedRoute {
  geoJson: GeoJSON.FeatureCollection;
  elevation: ElevationProfile;
  bbox: Bbox;
}

export function sliceRouteByKm(
  geoJson: unknown,
  elevation: ElevationProfile,
  fromKm: number,
  toKm: number,
): SlicedRoute | null {
  const lines = extractLineStrings(geoJson);
  const flatCoords: Coord[] = lines.flat();
  if (flatCoords.length < 2) return null;

  const cumulative: number[] = [0];
  for (let i = 1; i < flatCoords.length; i += 1) {
    cumulative.push(cumulative[i - 1] + haversineKm(flatCoords[i - 1], flatCoords[i]));
  }

  const totalKm = cumulative[cumulative.length - 1];
  const clampedFrom = Math.max(0, Math.min(fromKm, totalKm));
  const clampedTo = Math.max(clampedFrom, Math.min(toKm, totalKm));

  let startIndex = 0;
  while (startIndex < cumulative.length - 1 && cumulative[startIndex + 1] < clampedFrom) {
    startIndex += 1;
  }
  let endIndex = cumulative.length - 1;
  while (endIndex > startIndex && cumulative[endIndex - 1] > clampedTo) {
    endIndex -= 1;
  }

  const slicedCoords = flatCoords.slice(startIndex, endIndex + 1);
  const bbox = computeBboxFromCoords(slicedCoords);
  if (!bbox) return null;

  const slicedGeoJson: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { fromKm: clampedFrom, toKm: clampedTo },
        geometry: {
          type: "LineString",
          coordinates: slicedCoords,
        },
      },
    ],
  };

  const elevationSliced = sliceElevation(elevation, clampedFrom, clampedTo);

  return { geoJson: slicedGeoJson, elevation: elevationSliced, bbox };
}

function sliceElevation(
  elevation: ElevationProfile,
  fromKm: number,
  toKm: number,
): ElevationProfile {
  const distances = elevation.distances_km;
  if (distances.length === 0) return elevation;

  let startIndex = 0;
  while (startIndex < distances.length - 1 && distances[startIndex + 1] < fromKm) {
    startIndex += 1;
  }
  let endIndex = distances.length - 1;
  while (endIndex > startIndex && distances[endIndex - 1] > toKm) {
    endIndex -= 1;
  }

  const slicedDistances = elevation.distances_km.slice(startIndex, endIndex + 1);
  const slicedElevations = elevation.elevations_m.slice(startIndex, endIndex + 1);
  const slicedTimes = elevation.times_min.slice(startIndex, endIndex + 1);
  const stationPositions = elevation.station_positions_km.filter(
    (km) => km >= fromKm && km <= toKm,
  );

  return {
    distances_km: slicedDistances,
    elevations_m: slicedElevations,
    times_min: slicedTimes,
    station_positions_km: stationPositions,
  };
}
