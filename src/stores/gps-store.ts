import { create } from "zustand";

export interface GpsPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface SelectedTrailPoint {
  latitude: number;
  longitude: number;
}

interface GpsState {
  isTracking: boolean;
  activeRouteId: string | null;
  activeRouteSlug: string | null;
  activeSectionId: string | null;
  position: GpsPosition | null;
  /**
   * True once the map handled the first GPS fix (centered on it) or the user panned first.
   * Lives here, not in the map component, so a remounted map never recenters again.
   */
  isCameraSettled: boolean;
  /** Point picked on the elevation chart; the map shows a marker there. */
  selectedTrailPoint: SelectedTrailPoint | null;

  selectTrailPoint: (point: SelectedTrailPoint | null) => void;
  settleCamera: () => void;
  startFollowing: (routeId: string, routeSlug: string, sectionId?: string) => void;
  stopFollowing: () => void;
  updatePosition: (latitude: number, longitude: number, accuracy: number) => void;
}

export const useGpsStore = create<GpsState>()((set) => ({
  isTracking: false,
  activeRouteId: null,
  activeRouteSlug: null,
  activeSectionId: null,
  position: null,
  isCameraSettled: false,
  selectedTrailPoint: null,

  selectTrailPoint: (point: SelectedTrailPoint | null) => {
    set({ selectedTrailPoint: point });
  },

  settleCamera: () => {
    set({ isCameraSettled: true });
  },

  startFollowing: (routeId: string, routeSlug: string, sectionId?: string) => {
    set({
      isTracking: true,
      activeRouteId: routeId,
      activeRouteSlug: routeSlug,
      activeSectionId: sectionId ?? null,
      position: null,
      isCameraSettled: false,
      selectedTrailPoint: null,
    });
  },

  stopFollowing: () => {
    set({
      isTracking: false,
      activeRouteId: null,
      activeRouteSlug: null,
      activeSectionId: null,
      position: null,
      isCameraSettled: false,
      selectedTrailPoint: null,
    });
  },

  updatePosition: (latitude: number, longitude: number, accuracy: number) => {
    set({ position: { latitude, longitude, accuracy } });
  },
}));
