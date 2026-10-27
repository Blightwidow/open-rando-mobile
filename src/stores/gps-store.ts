import { create } from "zustand";

export interface GpsPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface GpsState {
  isTracking: boolean;
  activeRouteId: string | null;
  activeRouteSlug: string | null;
  activeSectionId: string | null;
  position: GpsPosition | null;

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

  startFollowing: (routeId: string, routeSlug: string, sectionId?: string) => {
    set({
      isTracking: true,
      activeRouteId: routeId,
      activeRouteSlug: routeSlug,
      activeSectionId: sectionId ?? null,
      position: null,
    });
  },

  stopFollowing: () => {
    set({
      isTracking: false,
      activeRouteId: null,
      activeRouteSlug: null,
      activeSectionId: null,
      position: null,
    });
  },

  updatePosition: (latitude: number, longitude: number, accuracy: number) => {
    set({ position: { latitude, longitude, accuracy } });
  },
}));
