import { useCallback } from "react";
import { useDownloadStore } from "@/stores/download-store";
import type { Route } from "@/lib/types";
import type { MapStyle } from "@/lib/constants";

export function useDownload(route: Route) {
  const downloadState = useDownloadStore((state) => state.getDownloadState(route.id));
  const startDownload = useDownloadStore((state) => state.startDownload);
  const removeDownload = useDownloadStore((state) => state.removeDownload);

  const download = useCallback(
    (mapStyle: MapStyle) => {
      startDownload(route, mapStyle);
    },
    [route, startDownload],
  );

  const remove = useCallback(() => {
    removeDownload(route.id);
  }, [route.id, removeDownload]);

  return {
    status: downloadState.status,
    progress: downloadState.progress,
    error: downloadState.error,
    mapStyle: downloadState.mapStyle,
    isDownloaded: downloadState.status === "complete",
    download,
    remove,
  };
}
