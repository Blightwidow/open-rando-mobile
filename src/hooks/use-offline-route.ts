import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { lookupRouteBySlug } from "@/services/route-lookup";
import {
  readElevation,
  readGeoJson,
  readPois,
  readSectionElevation,
  readSectionGeoJson,
  readSectionPois,
} from "@/services/offline-storage";
import { useDownloadStore } from "@/stores/download-store";
import type {
  Route,
  ElevationProfile,
  DownloadState,
  PointOfInterest,
} from "@/lib/types";

const IDLE_DOWNLOAD_STATE: DownloadState = { status: "idle", progress: 0 };
const NO_POIS: PointOfInterest[] = [];

interface OfflineRouteData {
  route: Route | null;
  geoJson: unknown | null;
  elevation: ElevationProfile | null;
  pois: PointOfInterest[];
  isLoading: boolean;
  error: Error | null;
}

export function useOfflineRoute(slug: string, sectionId?: string): OfflineRouteData {
  const routeQuery = useQuery({
    queryKey: ["route", slug],
    queryFn: () => lookupRouteBySlug(slug),
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

  const poisQuery = useQuery({
    queryKey: isSectionView
      ? ["offline-section-pois", routeId, sectionId]
      : ["offline-pois", routeId],
    queryFn: () => {
      if (!routeId) return [];
      if (isSectionView && sectionId) {
        return readSectionPois(routeId, sectionId);
      }
      return readPois(routeId);
    },
    enabled: !!routeId && isReady,
  });

  const pois = poisQuery.data ?? NO_POIS;

  // elevation.json carries no station positions any more: they come from the POI links
  const elevation = useMemo(() => {
    const profile = elevationQuery.data;
    if (!profile) return null;
    const stationPositions = pois
      .filter((poi) => poi.poi_type === "train_station" && poi.distance_km !== undefined)
      .map((poi) => poi.distance_km as number);
    return { ...profile, station_positions_km: stationPositions };
  }, [elevationQuery.data, pois]);

  return {
    route: routeQuery.data ?? null,
    geoJson: geoJsonQuery.data ?? null,
    elevation,
    pois,
    isLoading:
      routeQuery.isLoading ||
      geoJsonQuery.isLoading ||
      elevationQuery.isLoading ||
      poisQuery.isLoading,
    error:
      (routeQuery.error as Error) ??
      (geoJsonQuery.error as Error) ??
      (elevationQuery.error as Error) ??
      (poisQuery.error as Error) ??
      null,
  };
}
