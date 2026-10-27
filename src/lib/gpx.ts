import { computeBboxFromCoords, type Bbox } from "@/lib/geometry";
import { haversineDistance } from "@/lib/geo";
import type { ElevationProfile, Route } from "@/lib/types";

export interface GpxPoint {
  longitude: number;
  latitude: number;
  elevationMeters: number | null;
}

export interface ParsedGpx {
  name: string | null;
  points: GpxPoint[];
}

export class GpxParseError extends Error {}

const HIKING_SPEED_KM_PER_HOUR = 4;
const ASCENT_METERS_PER_HOUR = 600;
// Ignore elevation jitter below this threshold when summing gain/loss
const ELEVATION_NOISE_METERS = 3;

function decodeXmlEntities(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
}

function readAttribute(attributes: string, attributeName: string): number | null {
  const match = new RegExp(`\\b${attributeName}\\s*=\\s*["']([^"']+)["']`).exec(
    attributes,
  );
  if (!match) return null;
  const value = Number.parseFloat(match[1]);
  return Number.isFinite(value) ? value : null;
}

function extractPoints(xml: string, elementName: string): GpxPoint[] {
  const pointPattern = new RegExp(
    `<${elementName}\\b([^>]*?)(?:/>|>([\\s\\S]*?)</${elementName}>)`,
    "g",
  );
  const points: GpxPoint[] = [];
  for (const match of xml.matchAll(pointPattern)) {
    const latitude = readAttribute(match[1], "lat");
    const longitude = readAttribute(match[1], "lon");
    if (latitude === null || longitude === null) continue;
    if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) continue;

    const elevationMatch = /<ele>\s*([^<\s]+)\s*<\/ele>/.exec(match[2] ?? "");
    const elevationValue = elevationMatch ? Number.parseFloat(elevationMatch[1]) : NaN;
    points.push({
      longitude,
      latitude,
      elevationMeters: Number.isFinite(elevationValue) ? elevationValue : null,
    });
  }
  return points;
}

function extractName(xml: string): string | null {
  // Prefer the track/route name; metadata name is the fallback
  const candidates = [
    /<trk\b[^>]*>[\s\S]*?<name>([\s\S]*?)<\/name>/,
    /<rte\b[^>]*>[\s\S]*?<name>([\s\S]*?)<\/name>/,
    /<metadata\b[^>]*>[\s\S]*?<name>([\s\S]*?)<\/name>/,
  ];
  for (const pattern of candidates) {
    const match = pattern.exec(xml);
    if (match) {
      const name = decodeXmlEntities(match[1]);
      if (name) return name;
    }
  }
  return null;
}

export function parseGpx(xml: string): ParsedGpx {
  if (!/<gpx\b/.test(xml)) {
    throw new GpxParseError("not a GPX document");
  }

  // Tracks first; fall back to planned routes
  let points = extractPoints(xml, "trkpt");
  if (points.length === 0) points = extractPoints(xml, "rtept");
  if (points.length < 2) {
    throw new GpxParseError("GPX contains no track");
  }

  return { name: extractName(xml), points };
}

interface ElevationTotals {
  gain: number;
  loss: number;
  cumulativeGain: number[];
}

function sumElevation(elevations: number[]): ElevationTotals {
  let gain = 0;
  let loss = 0;
  let reference = elevations[0];
  const cumulativeGain: number[] = [];
  for (const elevation of elevations) {
    const difference = elevation - reference;
    if (difference >= ELEVATION_NOISE_METERS) {
      gain += difference;
      reference = elevation;
    } else if (difference <= -ELEVATION_NOISE_METERS) {
      loss -= difference;
      reference = elevation;
    }
    cumulativeGain.push(gain);
  }
  return { gain, loss, cumulativeGain };
}

export interface ImportedGpxRoute {
  route: Route;
  geoJson: GeoJSON.FeatureCollection;
  elevation: ElevationProfile;
  bbox: Bbox;
}

/** Deterministic 32-bit FNV-1a hash, so re-importing the same track yields the same id. */
function hashCoordinates(points: GpxPoint[]): string {
  let hash = 0x811c9dc5;
  for (const point of points) {
    const text = `${point.longitude.toFixed(6)},${point.latitude.toFixed(6)};`;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
  }
  return hash.toString(16).padStart(8, "0");
}

export function slugifyForRoute(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildImportedRoute(
  parsed: ParsedGpx,
  fallbackName: string,
  importedAt: string,
): ImportedGpxRoute {
  const { points } = parsed;
  const name = parsed.name ?? fallbackName;
  const hash = hashCoordinates(points);
  const id = `gpx-${hash}`;

  const distancesKm: number[] = [0];
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const stepMeters = haversineDistance(
      previous.latitude,
      previous.longitude,
      current.latitude,
      current.longitude,
    );
    distancesKm.push(distancesKm[index - 1] + stepMeters / 1000);
  }
  const totalKm = distancesKm[distancesKm.length - 1];

  const hasElevation = points.every((point) => point.elevationMeters !== null);
  const elevationsMeters = hasElevation
    ? points.map((point) => point.elevationMeters as number)
    : [];
  const totals: ElevationTotals = hasElevation
    ? sumElevation(elevationsMeters)
    : { gain: 0, loss: 0, cumulativeGain: [] };

  // Naismith's rule: walking time plus ascent penalty
  const timesMinutes = distancesKm.map((distanceKm, index) => {
    const ascentSoFar = totals.cumulativeGain[index] ?? 0;
    return (
      (distanceKm / HIKING_SPEED_KM_PER_HOUR + ascentSoFar / ASCENT_METERS_PER_HOUR) * 60
    );
  });

  const coordinates = points.map((point) => [point.longitude, point.latitude]) as [
    number,
    number,
  ][];
  const bbox = computeBboxFromCoords(coordinates);
  if (!bbox) throw new GpxParseError("GPX contains no track");

  const geoJson: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { name },
        geometry: { type: "LineString", coordinates },
      },
    ],
  };

  // An empty profile makes ElevationChart render nothing
  const elevation: ElevationProfile = {
    distances_km: hasElevation ? distancesKm : [],
    elevations_m: elevationsMeters,
    times_min: hasElevation ? timesMinutes : [],
    station_positions_km: [],
  };

  const route: Route = {
    id,
    slug: `${slugifyForRoute(name) || "gpx"}-${hash}`,
    path_ref: "GPX",
    path_name: name,
    description: "",
    osm_relation_id: 0,
    pois: [],
    distance_km: totalKm,
    elevation_gain_m: Math.round(totals.gain),
    elevation_loss_m: Math.round(totals.loss),
    max_elevation_m: hasElevation ? Math.max(...elevationsMeters) : 0,
    min_elevation_m: hasElevation ? Math.min(...elevationsMeters) : 0,
    difficulty: "moderate",
    bbox,
    region: "",
    departement: "",
    gpx_path: "",
    geojson_path: "",
    is_circular_trail: false,
    terrain: [],
    last_updated: importedAt,
  };

  return { route, geoJson, elevation, bbox };
}
