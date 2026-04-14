import { describe, expect, it, beforeEach } from "vitest";
import { useGpsStore } from "@/stores/gps-store";

describe("gps-store", () => {
  beforeEach(() => {
    useGpsStore.getState().stopFollowing();
  });

  it("starts in idle state", () => {
    const state = useGpsStore.getState();
    expect(state.isTracking).toBe(false);
    expect(state.activeRouteId).toBeNull();
    expect(state.position).toBeNull();
  });

  it("startFollowing sets tracking state", () => {
    useGpsStore.getState().startFollowing("route-1", "route-slug");
    const state = useGpsStore.getState();
    expect(state.isTracking).toBe(true);
    expect(state.activeRouteId).toBe("route-1");
    expect(state.activeRouteSlug).toBe("route-slug");
    expect(state.position).toBeNull();
  });

  it("stopFollowing resets all state", () => {
    useGpsStore.getState().startFollowing("route-1", "route-slug");
    useGpsStore.getState().stopFollowing();
    const state = useGpsStore.getState();
    expect(state.isTracking).toBe(false);
    expect(state.activeRouteId).toBeNull();
    expect(state.activeRouteSlug).toBeNull();
    expect(state.position).toBeNull();
  });

  it("updatePosition sets position", () => {
    useGpsStore.getState().startFollowing("route-1", "route-slug");
    useGpsStore.getState().updatePosition(48.0, 2.025, 10);
    const state = useGpsStore.getState();
    expect(state.position).toEqual({ latitude: 48.0, longitude: 2.025, accuracy: 10 });
  });
});
