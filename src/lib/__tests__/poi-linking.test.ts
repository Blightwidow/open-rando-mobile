import { describe, expect, it } from "vitest";
import { linkPoisToTrack, simplifyTrack } from "@/lib/poi-linking";
import type { PoiRecord, PoiType } from "@/lib/types";

const TRACK_LATITUDE = 45;
const METERS_PER_DEGREE_LATITUDE_HAVERSINE = 111_195;

// 40 km-ish straight line heading east, one vertex every 0.01° of longitude
const TRACK: [number, number][] = Array.from({ length: 51 }, (_, index) => [
  4 + index * 0.01,
  TRACK_LATITUDE,
]);

function poiNorthOfTrack(
  id: string,
  kind: PoiType,
  longitude: number,
  metersNorth: number,
  name = id,
): PoiRecord {
  return {
    id,
    kind,
    name,
    lat: TRACK_LATITUDE + metersNorth / METERS_PER_DEGREE_LATITUDE_HAVERSINE,
    lon: longitude,
  };
}

describe("linkPoisToTrack", () => {
  it("links a station with its position along the track", () => {
    const [link] = linkPoisToTrack(TRACK, [
      poiNorthOfTrack("node/1", "train_station", 4.25, 1000),
    ]);
    // 0.25° of longitude at 45°N is about 19.7 km
    expect(link.kind).toBe("train_station");
    expect(link.distance_km).toBeGreaterThan(19.5);
    expect(link.distance_km).toBeLessThan(19.9);
    expect(link.distance_to_trail_m).toBeCloseTo(1000, -1);
  });

  it("puts the junction on the track", () => {
    const [link] = linkPoisToTrack(TRACK, [
      poiNorthOfTrack("node/1", "train_station", 4.25, 1000),
    ]);
    expect(link.junction?.[0]).toBeCloseTo(4.25, 4);
    expect(link.junction?.[1]).toBeCloseTo(TRACK_LATITUDE, 6);
  });

  it("drops a station beyond 5 km and keeps one just inside", () => {
    const links = linkPoisToTrack(TRACK, [
      poiNorthOfTrack("node/near", "train_station", 4.1, 4900),
      poiNorthOfTrack("node/far", "train_station", 4.3, 5100),
    ]);
    expect(links.map((link) => link.poi_id)).toEqual(["node/near"]);
  });

  it("uses a 2 km limit for bus stops and no position", () => {
    const links = linkPoisToTrack(TRACK, [
      poiNorthOfTrack("node/in", "bus_stop", 4.1, 1900),
      poiNorthOfTrack("node/out", "bus_stop", 4.3, 2100),
    ]);
    expect(links.map((link) => link.poi_id)).toEqual(["node/in"]);
    expect(links[0].distance_km).toBeNull();
  });

  it("uses a 3 km limit for hotels and campings, without position", () => {
    const links = linkPoisToTrack(TRACK, [
      poiNorthOfTrack("way/hotel", "hotel", 4.1, 2900),
      poiNorthOfTrack("way/camping", "camping", 4.2, 2900),
      poiNorthOfTrack("way/hotel-far", "hotel", 4.3, 3100),
      poiNorthOfTrack("way/camping-far", "camping", 4.3, 3100),
    ]);
    expect(links.map((link) => link.poi_id).sort()).toEqual(["way/camping", "way/hotel"]);
    expect(links.every((link) => link.distance_km === null)).toBe(true);
  });

  it("measures north-south distance in real meters, not degrees scaled by the backend average", () => {
    // 2.2 km north: the backend's averaged scale reads this as ~1.9 km and would keep it
    const links = linkPoisToTrack(TRACK, [
      poiNorthOfTrack("node/1", "bus_stop", 4.1, 2200),
    ]);
    expect(links).toEqual([]);
  });

  it("keeps the closer of two same-name stations near each other on the track", () => {
    const links = linkPoisToTrack(TRACK, [
      poiNorthOfTrack("node/a", "train_station", 4.2, 800, "Gare du Lac"),
      poiNorthOfTrack("node/b", "train_station", 4.2005, 300, "Gare du Lac"),
    ]);
    expect(links.map((link) => link.poi_id)).toEqual(["node/b"]);
  });

  it("keeps same-name stations that are far apart along the track", () => {
    const links = linkPoisToTrack(TRACK, [
      poiNorthOfTrack("node/a", "train_station", 4.05, 500, "Gare"),
      poiNorthOfTrack("node/b", "train_station", 4.35, 500, "Gare"),
    ]);
    expect(links).toHaveLength(2);
  });

  it("drops a station that is never the closest to any track vertex", () => {
    const links = linkPoisToTrack(TRACK, [
      poiNorthOfTrack("node/close", "train_station", 4.2, 500, "Close"),
      // Slightly further along but 4.9 km away: the close station beats it at every vertex
      poiNorthOfTrack("node/shadowed", "train_station", 4.205, 4900, "Shadowed"),
    ]);
    expect(links.map((link) => link.poi_id)).toEqual(["node/close"]);
  });

  it("orders stations along the track, then positionless POIs by distance", () => {
    const links = linkPoisToTrack(TRACK, [
      poiNorthOfTrack("way/hotel", "hotel", 4.1, 2000),
      poiNorthOfTrack("node/late", "train_station", 4.4, 400),
      poiNorthOfTrack("node/bus", "bus_stop", 4.1, 900),
      poiNorthOfTrack("node/early", "train_station", 4.1, 400),
    ]);
    expect(links.map((link) => link.poi_id)).toEqual([
      "node/early",
      "node/late",
      "node/bus",
      "way/hotel",
    ]);
  });

  it("ignores POIs nowhere near the track", () => {
    const links = linkPoisToTrack(TRACK, [
      { id: "node/1", kind: "train_station", name: "Ailleurs", lat: 48, lon: 2 },
    ]);
    expect(links).toEqual([]);
  });

  it("returns nothing for a track with fewer than two points", () => {
    expect(linkPoisToTrack([[4, 45]], [poiNorthOfTrack("a", "hotel", 4, 100)])).toEqual(
      [],
    );
  });
});

describe("simplifyTrack", () => {
  it("drops collinear vertices and keeps the ends", () => {
    expect(simplifyTrack(TRACK, 0.001)).toEqual([TRACK[0], TRACK[TRACK.length - 1]]);
  });

  it("keeps a vertex that bends the line beyond the tolerance", () => {
    const bent: [number, number][] = [
      [0, 0],
      [1, 0.5],
      [2, 0],
    ];
    expect(simplifyTrack(bent, 0.001)).toHaveLength(3);
  });
});
