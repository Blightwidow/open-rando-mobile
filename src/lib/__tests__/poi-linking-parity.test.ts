import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { linkPoisToTrack } from "@/lib/poi-linking";
import type { PoiLink, PoiRecord } from "@/lib/types";

/**
 * Parity with the backend on the curated route "GR 13" (id 94cfc52e7d9d): linking its trail
 * on the device must find about the same POIs as links/94cfc52e7d9d.json.
 *
 * Needs a local copy of the data, about 5 MB, so the test skips when it is absent:
 *   OPEN_RANDO_PARITY_DIR=<dir> bun run test
 * where <dir> holds, copied from https://rando.dammaretz.fr/data/:
 *   tracks/94cfc52e7d9d/trail.geojson
 *   links/94cfc52e7d9d.json
 *   pois/6_4.json  pois/7_4.json  pois/6_5.json  pois/7_5.json
 *
 * Exact equality is not expected, see docs/POI_LINKING.md for the known differences.
 */
const DATA_DIRECTORY = process.env.OPEN_RANDO_PARITY_DIR;
const ROUTE_ID = "94cfc52e7d9d";
const SQUARE_KEYS = ["6_4", "7_4", "6_5", "7_5"];
const KINDS = ["train_station", "bus_stop", "hotel", "camping"] as const;

function readJson<T>(relativePath: string): T {
  return JSON.parse(
    readFileSync(path.join(DATA_DIRECTORY as string, relativePath), "utf8"),
  ) as T;
}

describe.skipIf(!DATA_DIRECTORY || !existsSync(DATA_DIRECTORY))(
  "linkPoisToTrack on GR 13",
  () => {
    let expectedLinks: PoiLink[] = [];
    let actualLinks: PoiLink[] = [];

    // The body of a skipped describe still runs, so read the files only when tests run
    beforeAll(() => {
      const geoJson = readJson<GeoJSON.FeatureCollection>(
        `tracks/${ROUTE_ID}/trail.geojson`,
      );
      expectedLinks = readJson<{ links: PoiLink[] }>(`links/${ROUTE_ID}.json`).links;
      const pois = SQUARE_KEYS.flatMap(
        (key) => readJson<{ pois: PoiRecord[] }>(`pois/${key}.json`).pois,
      );
      const coordinates = (geoJson.features[0].geometry as GeoJSON.LineString)
        .coordinates as [number, number][];
      actualLinks = linkPoisToTrack(coordinates, pois);
    });

    const idsOfKind = (links: PoiLink[], kind: string): Set<string> =>
      new Set(links.filter((link) => link.kind === kind).map((link) => link.poi_id));

    it.each(KINDS)("finds about as many %s as the backend", (kind) => {
      const expectedCount = idsOfKind(expectedLinks, kind).size;
      const actualCount = idsOfKind(actualLinks, kind).size;
      expect(Math.abs(actualCount - expectedCount)).toBeLessThanOrEqual(
        Math.max(1, Math.ceil(expectedCount * 0.1)),
      );
    });

    it("shares all but one train station with the backend", () => {
      const expectedIds = idsOfKind(expectedLinks, "train_station");
      const actualIds = idsOfKind(actualLinks, "train_station");
      const shared = [...expectedIds].filter((id) => actualIds.has(id));
      expect(shared.length).toBeGreaterThanOrEqual(expectedIds.size - 1);
    });

    it("places stations along the trail within 5% of the backend", () => {
      const actualById = new Map(actualLinks.map((link) => [link.poi_id, link]));
      const relativeGaps = expectedLinks
        .filter((link) => link.kind === "train_station" && link.distance_km)
        .flatMap((link) => {
          const actual = actualById.get(link.poi_id);
          if (!actual?.distance_km) return [];
          return [
            Math.abs(actual.distance_km - (link.distance_km as number)) /
              (link.distance_km as number),
          ];
        });
      expect(relativeGaps.length).toBeGreaterThanOrEqual(13);
      expect(Math.max(...relativeGaps)).toBeLessThan(0.05);
    });

    it("keeps links ordered along the trail", () => {
      const stationPositions = actualLinks
        .filter((link) => link.kind === "train_station")
        .map((link) => link.distance_km as number);
      expect(stationPositions).toEqual([...stationPositions].sort((a, b) => a - b));
    });
  },
);
