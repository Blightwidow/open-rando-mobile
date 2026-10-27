import { describe, expect, it } from "vitest";
import { buildImportedRoute, GpxParseError, parseGpx } from "@/lib/gpx";

const TRACK_GPX = `<?xml version="1.0"?>
<gpx version="1.1" creator="test">
  <metadata><name>Metadata name</name></metadata>
  <trk>
    <name>Tour du Lac &amp; Forêt</name>
    <trkseg>
      <trkpt lat="45.0000" lon="6.0000"><ele>1000</ele></trkpt>
      <trkpt lat="45.0100" lon="6.0000"><ele>1100</ele></trkpt>
      <trkpt lat="45.0200" lon="6.0100"><ele>1050</ele></trkpt>
    </trkseg>
  </trk>
</gpx>`;

describe("parseGpx", () => {
  it("reads track points in order", () => {
    const parsed = parseGpx(TRACK_GPX);
    expect(parsed.points).toHaveLength(3);
    expect(parsed.points[1]).toEqual({
      longitude: 6,
      latitude: 45.01,
      elevationMeters: 1100,
    });
  });

  it("prefers track name over metadata name and decodes entities", () => {
    expect(parseGpx(TRACK_GPX).name).toBe("Tour du Lac & Forêt");
  });

  it("falls back to route points when no track exists", () => {
    const routeGpx = `<gpx><rte><name>Planned</name>
      <rtept lat="45" lon="6"/><rtept lat="45.01" lon="6.01"/></rte></gpx>`;
    const parsed = parseGpx(routeGpx);
    expect(parsed.points).toHaveLength(2);
    expect(parsed.points[0].elevationMeters).toBeNull();
  });

  it("accepts single-quoted attributes", () => {
    const parsed = parseGpx(
      `<gpx><trk><trkseg><trkpt lat='45' lon='6'></trkpt><trkpt lat='45.1' lon='6'></trkpt></trkseg></trk></gpx>`,
    );
    expect(parsed.points).toHaveLength(2);
  });

  it("skips points with out-of-range coordinates", () => {
    const parsed = parseGpx(
      `<gpx><trk><trkseg><trkpt lat="95" lon="6"/><trkpt lat="45" lon="6"/><trkpt lat="45.1" lon="6"/></trkseg></trk></gpx>`,
    );
    expect(parsed.points).toHaveLength(2);
  });

  it("rejects non-GPX content", () => {
    expect(() => parseGpx("<html></html>")).toThrow(GpxParseError);
  });

  it("rejects a GPX with fewer than two points", () => {
    expect(() =>
      parseGpx(`<gpx><trk><trkseg><trkpt lat="45" lon="6"/></trkseg></trk></gpx>`),
    ).toThrow(GpxParseError);
  });
});

describe("buildImportedRoute", () => {
  const imported = buildImportedRoute(parseGpx(TRACK_GPX), "fallback", "2026-01-01");

  it("computes distance from haversine steps", () => {
    // ~1.11 km per 0.01° latitude, plus a diagonal leg
    expect(imported.route.distance_km).toBeGreaterThan(2.2);
    expect(imported.route.distance_km).toBeLessThan(3.2);
  });

  it("sums elevation gain and loss", () => {
    expect(imported.route.elevation_gain_m).toBe(100);
    expect(imported.route.elevation_loss_m).toBe(50);
  });

  it("reports min and max elevation", () => {
    expect(imported.route.max_elevation_m).toBe(1100);
    expect(imported.route.min_elevation_m).toBe(1000);
  });

  it("builds bbox as [minLon, minLat, maxLon, maxLat]", () => {
    expect(imported.bbox).toEqual([6, 45, 6.01, 45.02]);
  });

  it("derives stable id from coordinates", () => {
    const again = buildImportedRoute(parseGpx(TRACK_GPX), "other", "2027-01-01");
    expect(again.route.id).toBe(imported.route.id);
  });

  it("uses fallback name when GPX has none", () => {
    const unnamed = buildImportedRoute(
      parseGpx(
        `<gpx><trk><trkseg><trkpt lat="45" lon="6"/><trkpt lat="45.1" lon="6"/></trkseg></trk></gpx>`,
      ),
      "my-file",
      "2026-01-01",
    );
    expect(unnamed.route.path_name).toBe("my-file");
  });

  it("produces empty elevation profile when track has no elevation", () => {
    const flat = buildImportedRoute(
      parseGpx(
        `<gpx><trk><trkseg><trkpt lat="45" lon="6"/><trkpt lat="45.1" lon="6"/></trkseg></trk></gpx>`,
      ),
      "flat",
      "2026-01-01",
    );
    expect(flat.elevation.distances_km).toEqual([]);
  });

  it("gives every elevation sample a matching time estimate", () => {
    expect(imported.elevation.times_min).toHaveLength(
      imported.elevation.distances_km.length,
    );
  });
});
