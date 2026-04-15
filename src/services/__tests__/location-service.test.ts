import { describe, expect, it, vi } from "vitest";
import { isPositionReliable } from "@/services/location-service";
import type { LocationObject } from "expo-location";

vi.mock("@/lib/logger", () => ({
  logDebug: vi.fn(),
  logInfo: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn(),
}));

vi.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: vi.fn(),
  getForegroundPermissionsAsync: vi.fn(),
  watchPositionAsync: vi.fn(),
  Accuracy: { High: 5 },
}));

function makeLocation(accuracy: number | null): LocationObject {
  return {
    coords: {
      latitude: 48.0,
      longitude: 2.0,
      altitude: 100,
      accuracy,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    },
    timestamp: Date.now(),
  };
}

describe("isPositionReliable", () => {
  it("accepts position with good accuracy (10m)", () => {
    expect(isPositionReliable(makeLocation(10))).toBe(true);
  });

  it("accepts position at threshold (50m)", () => {
    expect(isPositionReliable(makeLocation(50))).toBe(true);
  });

  it("rejects position with poor accuracy (100m)", () => {
    expect(isPositionReliable(makeLocation(100))).toBe(false);
  });

  it("rejects position with null accuracy", () => {
    expect(isPositionReliable(makeLocation(null))).toBe(false);
  });
});
