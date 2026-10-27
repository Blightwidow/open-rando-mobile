import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildRoutePois, buildTrackPois, clearPoiCache } from "@/services/poi-data";

vi.mock("@/lib/logger", () => ({
  logInfo: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn(),
  logDebug: vi.fn(),
}));

const INDEX = {
  generated_at: "2026-10-27T00:00:00Z",
  grid: { bbox: [-5.5, 41.0, 10.0, 51.5], cols: 12, rows: 8 },
  squares: [
    { col: 6, row: 5, count: 2 },
    { col: 7, row: 5, count: 0 },
  ],
};

const SQUARE_6_5 = {
  square: { col: 6, row: 5 },
  pois: [
    { id: "node/1", kind: "train_station", name: "Gare", lat: 48.5, lon: 2.5 },
    { id: "way/2", kind: "hotel", name: "Hôtel", lat: 48.5, lon: 2.52 },
  ],
};

function respondWith(routes: Record<string, unknown>): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn(async (url: string) => {
    const match = Object.entries(routes).find(([suffix]) => url.endsWith(suffix));
    return match
      ? { ok: true, status: 200, json: async () => match[1] }
      : { ok: false, status: 404, json: async () => ({}) };
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

// Stays inside square 6_5 (lon 2.25..3.54, lat 47.875..49.19) even with the margin
const ROUTE = {
  id: "route-1",
  bbox: [2.4, 48.4, 2.6, 48.6] as [number, number, number, number],
};

describe("buildRoutePois", () => {
  beforeEach(() => {
    clearPoiCache();
    vi.unstubAllGlobals();
  });

  it("joins the links file with the squares around the bbox", async () => {
    respondWith({
      "/pois/index.json": INDEX,
      "/pois/6_5.json": SQUARE_6_5,
      "/links/route-1.json": {
        route_id: "route-1",
        counts: {},
        links: [
          {
            poi_id: "node/1",
            kind: "train_station",
            distance_to_trail_m: 100,
            distance_km: 4.2,
            junction: [2.5, 48.5],
          },
        ],
      },
    });
    const pois = await buildRoutePois(ROUTE);
    expect(pois).toMatchObject([{ id: "node/1", name: "Gare", distance_km: 4.2 }]);
  });

  it("fails loudly when a link points at a POI missing from the squares", async () => {
    respondWith({
      "/pois/index.json": INDEX,
      "/pois/6_5.json": SQUARE_6_5,
      "/links/route-1.json": {
        route_id: "route-1",
        counts: {},
        links: [
          {
            poi_id: "node/404",
            kind: "hotel",
            distance_to_trail_m: 10,
            distance_km: null,
            junction: null,
          },
        ],
      },
    });
    await expect(buildRoutePois(ROUTE)).rejects.toThrow(/node\/404/);
  });

  it("fails when a needed square is absent from the index", async () => {
    respondWith({
      "/pois/index.json": { ...INDEX, squares: [] },
      "/links/route-1.json": { route_id: "route-1", counts: {}, links: [] },
    });
    await expect(buildRoutePois(ROUTE)).rejects.toThrow(/6_5 is missing/);
  });
});

describe("buildTrackPois", () => {
  beforeEach(() => {
    clearPoiCache();
    vi.unstubAllGlobals();
  });

  it("treats an empty square as empty without fetching it", async () => {
    const fetchMock = respondWith({ "/pois/index.json": INDEX });
    const pois = await buildTrackPois(
      [
        [3.8, 48.5],
        [3.9, 48.5],
      ],
      [3.8, 48.5, 3.9, 48.5],
    );
    expect(pois).toEqual([]);
    expect(fetchMock.mock.calls.map(([url]) => url as string)).toEqual([
      expect.stringContaining("/pois/index.json"),
    ]);
  });

  it("links the POIs around a custom track", async () => {
    respondWith({ "/pois/index.json": INDEX, "/pois/6_5.json": SQUARE_6_5 });
    const pois = await buildTrackPois(
      [
        [2.45, 48.5],
        [2.55, 48.5],
      ],
      [2.45, 48.5, 2.55, 48.5],
    );
    expect(pois.map((poi) => poi.id).sort()).toEqual(["node/1", "way/2"]);
  });
});
