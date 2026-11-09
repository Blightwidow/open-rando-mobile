import { describe, expect, it } from "vitest";
import { buildTrailModel, interpolateAtKm } from "@/lib/trail-progress";
import { formatDuration } from "@/lib/format";

// ~11.1 km straight line north along longitude 2 (0.1 degree latitude)
const straightTrail = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: [
          [2, 48],
          [2, 48.05],
          [2, 48.1],
        ],
      },
    },
  ],
};

describe("interpolateAtKm", () => {
  const distances = [0, 2, 4];
  const times = [0, 30, 90];

  it("interpolates between samples", () => {
    expect(interpolateAtKm(distances, times, 3)).toBe(60);
  });

  it("clamps before the start", () => {
    expect(interpolateAtKm(distances, times, -1)).toBe(0);
  });

  it("clamps after the end", () => {
    expect(interpolateAtKm(distances, times, 10)).toBe(90);
  });

  it("returns null when the series is empty", () => {
    expect(interpolateAtKm(distances, [], 1)).toBeNull();
  });
});

describe("buildTrailModel", () => {
  it("returns null for a track without segments", () => {
    expect(buildTrailModel({ type: "FeatureCollection", features: [] }, 10)).toBeNull();
  });

  it("finds the coordinate halfway along the track", () => {
    const model = buildTrailModel(straightTrail, 10);
    const [longitude, latitude] = model!.coordinateAtChartKm(5)!;
    expect(longitude).toBeCloseTo(2, 5);
    expect(latitude).toBeCloseTo(48.05, 3);
  });

  it("clamps the coordinate past the end to the last point", () => {
    const model = buildTrailModel(straightTrail, 10);
    expect(model!.coordinateAtChartKm(50)![1]).toBeCloseTo(48.1, 5);
  });

  it("maps a position to the chart axis scale", () => {
    const model = buildTrailModel(straightTrail, 10);
    const chartKm = model!.chartKmOfPosition({ latitude: 48.05, longitude: 2 });
    expect(chartKm).toBeCloseTo(5, 1);
  });
});

describe("formatDuration", () => {
  it("shows minutes under an hour", () => {
    expect(formatDuration(42)).toBe("42 min");
  });

  it("shows hours and padded minutes", () => {
    expect(formatDuration(65)).toBe("1h05");
  });
});
