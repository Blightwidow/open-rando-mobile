import { useCallback } from "react";
import { useDownloadStore } from "@/stores/download-store";
import type { Route } from "@/lib/types";

export function useDownload(route: Route) {
  const downloadState = useDownloadStore((state) => state.getDownloadState(route.id));
  const startDownload = useDownloadStore((state) => state.startDownload);
  const removeDownload = useDownloadStore((state) => state.removeDownload);

  const download = useCallback(() => {
    startDownload(route);
  }, [route, startDownload]);

  const remove = useCallback(() => {
    removeDownload(route.id);
  }, [route.id, removeDownload]);

  return {
    status: downloadState.status,
    progress: downloadState.progress,
    error: downloadState.error,
    isDownloaded: downloadState.status === "complete",
    download,
    remove,
  };
}
