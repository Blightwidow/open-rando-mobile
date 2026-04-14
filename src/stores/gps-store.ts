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
  position: GpsPosition | null;

  startFollowing: (routeId: string, routeSlug: string) => void;
  stopFollowing: () => void;
  updatePosition: (latitude: number, longitude: number, accuracy: number) => void;
}

export const useGpsStore = create<GpsState>()((set) => ({
  isTracking: false,
  activeRouteId: null,
  activeRouteSlug: null,
  position: null,

  startFollowing: (routeId: string, routeSlug: string) => {
    set({
      isTracking: true,
      activeRouteId: routeId,
      activeRouteSlug: routeSlug,
      position: null,
    });
  },

  stopFollowing: () => {
    set({
      isTracking: false,
      activeRouteId: null,
      activeRouteSlug: null,
      position: null,
    });
  },

  updatePosition: (latitude: number, longitude: number, accuracy: number) => {
    set({ position: { latitude, longitude, accuracy } });
  },
}));
