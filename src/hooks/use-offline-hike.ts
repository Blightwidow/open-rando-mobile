import { useQuery } from "@tanstack/react-query";
import { getHikeBySlug } from "@/services/database";
import { readGeoJson, readElevation } from "@/services/offline-storage";
import { useDownloadStore } from "@/stores/download-store";
import type { Hike, ElevationProfile } from "@/lib/types";

interface OfflineHikeData {
  hike: Hike | null;
  geoJson: unknown | null;
  elevation: ElevationProfile | null;
  isLoading: boolean;
  error: Error | null;
}

export function useOfflineHike(slug: string): OfflineHikeData {
  const hikeQuery = useQuery({
    queryKey: ["hike", slug],
    queryFn: () => getHikeBySlug(slug),
    enabled: !!slug,
  });

  const hikeId = hikeQuery.data?.id;
  const downloadState = useDownloadStore((state) =>
    hikeId
      ? state.getDownloadState(hikeId)
      : { status: "idle" as const, progress: 0 },
  );
  const isDownloaded = downloadState.status === "complete";

  const geoJsonQuery = useQuery({
    queryKey: ["offline-geojson", hikeId],
    queryFn: () => (hikeId ? readGeoJson(hikeId) : null),
    enabled: !!hikeId && isDownloaded,
  });

  const elevationQuery = useQuery({
    queryKey: ["offline-elevation", hikeId],
    queryFn: () => (hikeId ? readElevation(hikeId) : null),
    enabled: !!hikeId && isDownloaded,
  });

  return {
    hike: hikeQuery.data ?? null,
    geoJson: geoJsonQuery.data ?? null,
    elevation: elevationQuery.data ?? null,
    isLoading:
      hikeQuery.isLoading || geoJsonQuery.isLoading || elevationQuery.isLoading,
    error:
      (hikeQuery.error as Error) ??
      (geoJsonQuery.error as Error) ??
      (elevationQuery.error as Error) ??
      null,
  };
}
