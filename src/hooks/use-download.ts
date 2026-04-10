import { useCallback } from "react";
import { useDownloadStore } from "@/stores/download-store";
import type { Hike } from "@/lib/types";

export function useDownload(hike: Hike) {
  const downloadState = useDownloadStore((state) =>
    state.getDownloadState(hike.id),
  );
  const startDownload = useDownloadStore((state) => state.startDownload);
  const removeDownload = useDownloadStore((state) => state.removeDownload);

  const download = useCallback(() => {
    startDownload(hike);
  }, [hike, startDownload]);

  const remove = useCallback(() => {
    removeDownload(hike.id);
  }, [hike.id, removeDownload]);

  return {
    status: downloadState.status,
    progress: downloadState.progress,
    error: downloadState.error,
    isDownloaded: downloadState.status === "complete",
    download,
    remove,
  };
}
