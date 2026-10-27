import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Route } from "@/lib/types";

export const IMPORTED_ROUTE_ID_PREFIX = "gpx-";

export function isImportedRouteId(routeId: string): boolean {
  return routeId.startsWith(IMPORTED_ROUTE_ID_PREFIX);
}

interface ImportedRouteStore {
  routes: Record<string, Route>;
  addRoute: (route: Route) => void;
  removeRoute: (routeId: string) => void;
  getRouteById: (routeId: string) => Route | null;
  getRouteBySlug: (slug: string) => Route | null;
}

export const useImportedRouteStore = create<ImportedRouteStore>()(
  persist(
    (set, get) => ({
      routes: {},

      addRoute: (route: Route) => {
        set((state) => ({ routes: { ...state.routes, [route.id]: route } }));
      },

      removeRoute: (routeId: string) => {
        set((state) => {
          const { [routeId]: _removed, ...remaining } = state.routes;
          return { routes: remaining };
        });
      },

      getRouteById: (routeId: string) => get().routes[routeId] ?? null,

      getRouteBySlug: (slug: string) =>
        Object.values(get().routes).find((route) => route.slug === slug) ?? null,
    }),
    {
      name: "imported-route-store",
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ routes: state.routes }),
    },
  ),
);
