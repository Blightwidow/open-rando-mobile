import { useQuery } from "@tanstack/react-query";
import { getRouteBySlug } from "@/services/database";
import { readGeoJson, readElevation } from "@/services/offline-storage";
import { useDownloadStore } from "@/stores/download-store";
import type { Route, ElevationProfile } from "@/lib/types";

interface OfflineRouteData {
  route: Route | null;
  geoJson: unknown | null;
  elevation: ElevationProfile | null;
  isLoading: boolean;
  error: Error | null;
}

export function useOfflineRoute(slug: string): OfflineRouteData {
  const routeQuery = useQuery({
    queryKey: ["route", slug],
    queryFn: () => getRouteBySlug(slug),
    enabled: !!slug,
  });

  const routeId = routeQuery.data?.id;
  const downloadState = useDownloadStore((state) =>
    routeId ? state.getDownloadState(routeId) : { status: "idle" as const, progress: 0 },
  );
  const isDownloaded = downloadState.status === "complete";

  const geoJsonQuery = useQuery({
    queryKey: ["offline-geojson", routeId],
    queryFn: () => (routeId ? readGeoJson(routeId) : null),
    enabled: !!routeId && isDownloaded,
  });

  const elevationQuery = useQuery({
    queryKey: ["offline-elevation", routeId],
    queryFn: () => (routeId ? readElevation(routeId) : null),
    enabled: !!routeId && isDownloaded,
  });

  return {
    route: routeQuery.data ?? null,
    geoJson: geoJsonQuery.data ?? null,
    elevation: elevationQuery.data ?? null,
    isLoading: routeQuery.isLoading || geoJsonQuery.isLoading || elevationQuery.isLoading,
    error:
      (routeQuery.error as Error) ??
      (geoJsonQuery.error as Error) ??
      (elevationQuery.error as Error) ??
      null,
  };
}
