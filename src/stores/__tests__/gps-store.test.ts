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

  it("starts with the camera unsettled", () => {
    expect(useGpsStore.getState().isCameraSettled).toBe(false);
  });

  it("settleCamera marks the first fix as handled", () => {
    useGpsStore.getState().startFollowing("route-1", "route-slug");
    useGpsStore.getState().settleCamera();
    expect(useGpsStore.getState().isCameraSettled).toBe(true);
  });

  it("keeps the camera settled across position updates", () => {
    useGpsStore.getState().startFollowing("route-1", "route-slug");
    useGpsStore.getState().settleCamera();
    useGpsStore.getState().updatePosition(48.0, 2.025, 10);
    expect(useGpsStore.getState().isCameraSettled).toBe(true);
  });

  it("starting a new hike unsettles the camera again", () => {
    useGpsStore.getState().startFollowing("route-1", "route-slug");
    useGpsStore.getState().settleCamera();
    useGpsStore.getState().startFollowing("route-2", "other-slug");
    expect(useGpsStore.getState().isCameraSettled).toBe(false);
  });

  it("stopFollowing unsettles the camera", () => {
    useGpsStore.getState().startFollowing("route-1", "route-slug");
    useGpsStore.getState().settleCamera();
    useGpsStore.getState().stopFollowing();
    expect(useGpsStore.getState().isCameraSettled).toBe(false);
  });
});
