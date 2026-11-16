import { describe, expect, it } from "vitest";
import { countPois, joinRoutePois } from "@/lib/route-pois";
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

describe("shops and eateries", () => {
  const BAKERY: PoiRecord = {
    id: "node/3",
    kind: "shop",
    name: "Boulangerie du Pont",
    lat: 45.2,
    lon: 4.2,
    category: "bakery",
    opening_hours: "Tu-Su 07:00-19:00",
    phone: "+33 4 00 00 00 00",
  };
  const BAKERY_LINK: PoiLink = {
    poi_id: "node/3",
    kind: "shop",
    distance_to_trail_m: 300,
    distance_km: null,
    junction: [4.2, 45.19],
  };

  it("carries category, opening hours and phone from the grid record", () => {
    const [bakery] = joinRoutePois([BAKERY_LINK], new Map([[BAKERY.id, BAKERY]]));
    expect(bakery).toMatchObject({
      poi_type: "shop",
      category: "bakery",
      opening_hours: "Tu-Su 07:00-19:00",
      phone: "+33 4 00 00 00 00",
    });
  });

  it("reads a record without the new fields", () => {
    const [hotel] = joinRoutePois([HOTEL_LINK], poisById);
    expect(hotel.category).toBeUndefined();
    expect(hotel.opening_hours).toBeUndefined();
    expect(hotel.phone).toBeUndefined();
  });

  it("counts shops and eateries", () => {
    const [bakery] = joinRoutePois([BAKERY_LINK], new Map([[BAKERY.id, BAKERY]]));
    const counts = countPois([
      bakery,
      { ...bakery, id: "node/4", poi_type: "eatery" },
      bakery,
    ]);
    expect(counts).toMatchObject({ shop: 2, eatery: 1, hotel: 0 });
  });
});
