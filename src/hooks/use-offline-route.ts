import { useQuery } from "@tanstack/react-query";
import { getRouteBySlug } from "@/services/database";
import {
  readElevation,
  readGeoJson,
  readSectionElevation,
  readSectionGeoJson,
} from "@/services/offline-storage";
import { useDownloadStore } from "@/stores/download-store";
import type { Route, ElevationProfile, DownloadState } from "@/lib/types";

const IDLE_DOWNLOAD_STATE: DownloadState = { status: "idle", progress: 0 };

interface OfflineRouteData {
  route: Route | null;
  geoJson: unknown | null;
  elevation: ElevationProfile | null;
  isLoading: boolean;
  error: Error | null;
}

export function useOfflineRoute(slug: string, sectionId?: string): OfflineRouteData {
  const routeQuery = useQuery({
    queryKey: ["route", slug],
    queryFn: () => getRouteBySlug(slug),
    enabled: !!slug,
  });

  const routeId = routeQuery.data?.id;
  const fullDownloadState = useDownloadStore((state) =>
    routeId ? state.getDownloadState(routeId) : IDLE_DOWNLOAD_STATE,
  );
  const sectionDownloadState = useDownloadStore((state) =>
    sectionId ? state.getSectionDownloadState(sectionId) : IDLE_DOWNLOAD_STATE,
  );

  const isSectionView = !!sectionId;
  const isReady = isSectionView
    ? sectionDownloadState.status === "complete"
    : fullDownloadState.status === "complete";

  const geoJsonQuery = useQuery({
    queryKey: isSectionView
      ? ["offline-section-geojson", routeId, sectionId]
      : ["offline-geojson", routeId],
    queryFn: () => {
      if (!routeId) return null;
      if (isSectionView && sectionId) {
        return readSectionGeoJson(routeId, sectionId);
      }
      return readGeoJson(routeId);
    },
    enabled: !!routeId && isReady,
  });

  const elevationQuery = useQuery({
    queryKey: isSectionView
      ? ["offline-section-elevation", routeId, sectionId]
      : ["offline-elevation", routeId],
    queryFn: () => {
      if (!routeId) return null;
      if (isSectionView && sectionId) {
        return readSectionElevation(routeId, sectionId);
      }
      return readElevation(routeId);
    },
    enabled: !!routeId && isReady,
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
