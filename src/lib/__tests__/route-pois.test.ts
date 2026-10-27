import { describe, expect, it } from "vitest";
import { joinRoutePois } from "@/lib/route-pois";
import type { PoiLink, PoiRecord } from "@/lib/types";

const STATION: PoiRecord = {
  id: "node/1",
  kind: "train_station",
  name: "Gare de Test",
  lat: 45,
  lon: 4,
  url: "https://example.org/gare",
  transit_lines: ["TER"],
  rail_service: null,
};

const HOTEL: PoiRecord = {
  id: "way/2",
  kind: "hotel",
  name: "Hôtel",
  lat: 45.1,
  lon: 4.1,
};

const STATION_LINK: PoiLink = {
  poi_id: "node/1",
  kind: "train_station",
  distance_to_trail_m: 420,
  distance_km: 12.3,
  junction: [4.01, 45.01],
};

const HOTEL_LINK: PoiLink = {
  poi_id: "way/2",
  kind: "hotel",
  distance_to_trail_m: 900,
  distance_km: null,
  junction: null,
};

const poisById = new Map([STATION, HOTEL].map((poi) => [poi.id, poi]));

describe("joinRoutePois", () => {
  it("merges the grid record with its link and keeps link order", () => {
    const joined = joinRoutePois([STATION_LINK, HOTEL_LINK], poisById);
    expect(joined.map((poi) => poi.id)).toEqual(["node/1", "way/2"]);
    expect(joined[0]).toMatchObject({
      name: "Gare de Test",
      poi_type: "train_station",
      distance_km: 12.3,
      distance_to_trail_m: 420,
      junction: [4.01, 45.01],
      url: "https://example.org/gare",
    });
  });

  it("maps null position and null url to undefined", () => {
    const [, hotel] = joinRoutePois([STATION_LINK, HOTEL_LINK], poisById);
    expect(hotel.distance_km).toBeUndefined();
    expect(hotel.junction).toBeUndefined();
    expect(hotel.url).toBeUndefined();
  });

  it("throws when a linked POI is missing from the grid", () => {
    const missing: PoiLink = { ...HOTEL_LINK, poi_id: "node/404" };
    expect(() => joinRoutePois([STATION_LINK, missing], poisById)).toThrow(/node\/404/);
  });
});
