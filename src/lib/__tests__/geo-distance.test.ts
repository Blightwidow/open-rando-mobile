import { describe, expect, it } from "vitest";
import {
  haversineDistance,
  pointToSegmentDistance,
  distanceFromTrail,
  progressAlongTrail,
} from "@/lib/geo";

describe("haversineDistance", () => {
  it("returns zero for same point", () => {
    expect(haversineDistance(48.8566, 2.3522, 48.8566, 2.3522)).toBe(0);
  });

  it("computes Paris to Lyon (~392km)", () => {
    const distance = haversineDistance(48.8566, 2.3522, 45.764, 4.8357);
    expect(distance).toBeGreaterThan(380_000);
    expect(distance).toBeLessThan(400_000);
  });

  it("computes short distance (~1km)", () => {
    // ~1km north from origin
    const distance = haversineDistance(48.0, 2.0, 48.009, 2.0);
    expect(distance).toBeGreaterThan(900);
    expect(distance).toBeLessThan(1100);
  });
});

describe("pointToSegmentDistance", () => {
  it("returns zero when point is on segment start", () => {
    const distance = pointToSegmentDistance([2.0, 48.0], [2.0, 48.0], [2.1, 48.0]);
    expect(distance).toBeLessThan(1);
  });

  it("returns zero when point is on segment end", () => {
    const distance = pointToSegmentDistance([2.1, 48.0], [2.0, 48.0], [2.1, 48.0]);
    expect(distance).toBeLessThan(1);
  });

  it("returns perpendicular distance for mid-segment projection", () => {
    // Point slightly north of segment midpoint
    const distance = pointToSegmentDistance([2.05, 48.001], [2.0, 48.0], [2.1, 48.0]);
    // ~111m per 0.001 degree latitude
    expect(distance).toBeGreaterThan(80);
    expect(distance).toBeLessThan(150);
  });

  it("returns distance to nearest endpoint when projection is outside segment", () => {
    // Point far west of segment
    const distance = pointToSegmentDistance([1.0, 48.0], [2.0, 48.0], [2.1, 48.0]);
    const distanceToStart = haversineDistance(48.0, 1.0, 48.0, 2.0);
    expect(distance).toBeCloseTo(distanceToStart, -1);
  });

  it("handles zero-length segment", () => {
    const distance = pointToSegmentDistance([2.05, 48.0], [2.0, 48.0], [2.0, 48.0]);
    expect(distance).toBeGreaterThan(0);
  });
});

describe("distanceFromTrail", () => {
  const trailLine: [number, number][] = [
    [2.0, 48.0],
    [2.05, 48.0],
    [2.1, 48.0],
  ];

  it("returns near zero for point on trail", () => {
    const distance = distanceFromTrail({ latitude: 48.0, longitude: 2.025 }, trailLine);
    expect(distance).toBeLessThan(10);
  });

  it("returns reasonable distance for point 100m north of trail", () => {
    // ~0.0009 degrees latitude ≈ 100m
    const distance = distanceFromTrail({ latitude: 48.0009, longitude: 2.05 }, trailLine);
    expect(distance).toBeGreaterThan(70);
    expect(distance).toBeLessThan(130);
  });

  it("returns Infinity for empty trail", () => {
    expect(distanceFromTrail({ latitude: 48.0, longitude: 2.0 }, [])).toBe(Infinity);
  });

  it("handles single-point trail", () => {
    const distance = distanceFromTrail({ latitude: 48.0, longitude: 2.0 }, [[2.0, 48.0]]);
    expect(distance).toBeLessThan(1);
  });
});

describe("progressAlongTrail", () => {
  const trailLine: [number, number][] = [
    [2.0, 48.0],
    [2.05, 48.0],
    [2.1, 48.0],
  ];

  it("returns 0 at start of trail", () => {
    const progress = progressAlongTrail({ latitude: 48.0, longitude: 2.0 }, trailLine);
    expect(progress).toBeLessThan(0.01);
  });

  it("returns approximately half distance at midpoint", () => {
    const progress = progressAlongTrail({ latitude: 48.0, longitude: 2.05 }, trailLine);
    const totalLength = haversineDistance(48.0, 2.0, 48.0, 2.1) / 1000;
    expect(progress).toBeGreaterThan(totalLength * 0.4);
    expect(progress).toBeLessThan(totalLength * 0.6);
  });

  it("returns full distance at end of trail", () => {
    const progress = progressAlongTrail({ latitude: 48.0, longitude: 2.1 }, trailLine);
    const totalLength = haversineDistance(48.0, 2.0, 48.0, 2.1) / 1000;
    expect(progress).toBeGreaterThan(totalLength * 0.9);
    expect(progress).toBeLessThanOrEqual(totalLength * 1.05);
  });

  it("returns 0 for trail with fewer than 2 points", () => {
    expect(progressAlongTrail({ latitude: 48.0, longitude: 2.0 }, [[2.0, 48.0]])).toBe(0);
    expect(progressAlongTrail({ latitude: 48.0, longitude: 2.0 }, [])).toBe(0);
  });
});
