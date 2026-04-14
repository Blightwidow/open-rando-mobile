import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { syncCatalog } from "@/services/catalog-sync";
import {
  getAllRoutes,
  getRouteBySlug,
  getFilteredRoutes,
  getDistinctRegions,
} from "@/services/database";
import { useFilterStore } from "@/stores/filter-store";
import type { Route, Terrain } from "@/lib/types";

export function useCatalogSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: syncCatalog,
    onSuccess: (result) => {
      if (result.synced) {
        queryClient.invalidateQueries({ queryKey: ["routes"] });
      }
    },
  });
}

export function useRoutes() {
  return useQuery({
    queryKey: ["routes"],
    queryFn: getAllRoutes,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRoute(slug: string) {
  return useQuery({
    queryKey: ["route", slug],
    queryFn: () => getRouteBySlug(slug),
    enabled: !!slug,
  });
}

function filterByTerrain(routes: Route[], terrains: Terrain[]): Route[] {
  if (terrains.length === 0) return routes;
  return routes.filter((route) =>
    route.terrain.some((terrainTag) => terrains.includes(terrainTag)),
  );
}

export function useFilteredRoutes() {
  const regions = useFilterStore((state) => state.regions);
  const terrains = useFilterStore((state) => state.terrains);

  return useQuery({
    queryKey: ["routes", "filtered", regions],
    queryFn: () => getFilteredRoutes({ regions }),
    staleTime: 5 * 60 * 1000,
    select: (routes) => filterByTerrain(routes, terrains),
  });
}

export function useDistinctRegions() {
  return useQuery({
    queryKey: ["routes", "regions"],
    queryFn: getDistinctRegions,
    staleTime: 10 * 60 * 1000,
  });
}
