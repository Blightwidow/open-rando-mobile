import { describe, expect, it } from "vitest";
import { computeWalkingTimesMinutes } from "@/lib/walking-time";

describe("computeWalkingTimesMinutes", () => {
  it("walks flat ground at 4 km/h", () => {
    const times = computeWalkingTimesMinutes([0, 4], [100, 100]);
    expect(times[1]).toBeCloseTo(60, 5);
  });

  it("climbs a slope of at least 10% at 300 m per hour", () => {
    // 1 km, +300 m = 30% slope
    const times = computeWalkingTimesMinutes([0, 1], [0, 300]);
    expect(times[1]).toBeCloseTo(60, 5);
  });

  it("descends a slope of at least 10% at 450 m per hour", () => {
    const times = computeWalkingTimesMinutes([0, 1], [450, 0]);
    expect(times[1]).toBeCloseTo(60, 5);
  });

  it("ignores gentle climbs below 10%", () => {
    // 1 km, +50 m = 5% slope: flat pace, no ascent penalty
    const times = computeWalkingTimesMinutes([0, 1], [0, 50]);
    expect(times[1]).toBeCloseTo(15, 5);
  });

  it("returns one non-decreasing time per input point", () => {
    const times = computeWalkingTimesMinutes([0, 0.03, 0.5], [10, 12, 90]);
    expect(times).toHaveLength(3);
    expect(times[0]).toBe(0);
    expect(times[2]).toBeGreaterThanOrEqual(times[1]);
  });
});
