import type { PoiCounts, PoiLink, PoiRecord, PointOfInterest } from "@/lib/types";

/**
 * Joins a track's links (links/<id>.json) with the POIs they point at (pois/<col>_<row>.json).
 * Throws when a link points at a POI absent from the loaded squares: the grid was rebuilt
 * after the links, and shipping a route with holes would hide it.
 */
export function joinRoutePois(
  links: PoiLink[],
  poisById: Map<string, PoiRecord>,
): PointOfInterest[] {
  const missingIds = links
    .filter((link) => !poisById.has(link.poi_id))
    .map((link) => link.poi_id);
  if (missingIds.length > 0) {
    throw new Error(
      `${missingIds.length} linked POI(s) missing from the POI grid (first: ${missingIds[0]})`,
    );
  }

  return links.map((link) => {
    const poi = poisById.get(link.poi_id) as PoiRecord;
    return {
      id: poi.id,
      name: poi.name,
      lat: poi.lat,
      lon: poi.lon,
      poi_type: poi.kind,
      url: poi.url ?? undefined,
      transit_lines: poi.transit_lines,
      distance_km: link.distance_km ?? undefined,
      distance_to_trail_m: link.distance_to_trail_m,
      junction: link.junction ?? undefined,
      rail_service: poi.rail_service,
    };
  });
}

export function countPois(pois: PointOfInterest[]): PoiCounts {
  const counts: PoiCounts = {
    train_station: 0,
    bus_stop: 0,
    hotel: 0,
    camping: 0,
    train_station_with_rail_service: 0,
  };
  for (const poi of pois) {
    counts[poi.poi_type] += 1;
    if (poi.poi_type === "train_station" && poi.rail_service) {
      counts.train_station_with_rail_service += 1;
    }
  }
  return counts;
}

// Fallback margin for a POI with no junction: about the largest link distance
const SECTION_POI_MARGIN_DEGREES = 0.03;

/**
 * POIs of a section of a route. Train stations carry their position along the trail;
 * the others are kept when their junction on the trail falls inside the section bbox.
 */
export function poisForSection(
  pois: PointOfInterest[],
  fromKm: number,
  toKm: number,
  sectionBbox: [number, number, number, number],
): PointOfInterest[] {
  const [minLongitude, minLatitude, maxLongitude, maxLatitude] = sectionBbox;
  return pois.filter((poi) => {
    if (poi.distance_km !== undefined) {
      return poi.distance_km >= fromKm && poi.distance_km <= toKm;
    }
    const [longitude, latitude] = poi.junction ?? [poi.lon, poi.lat];
    const margin = poi.junction ? 0 : SECTION_POI_MARGIN_DEGREES;
    return (
      longitude >= minLongitude - margin &&
      longitude <= maxLongitude + margin &&
      latitude >= minLatitude - margin &&
      latitude <= maxLatitude + margin
    );
  });
}
