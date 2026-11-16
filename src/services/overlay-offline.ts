import type { PmtilesFileEntry } from "@/lib/types";
import { OVERLAY_REMOTE_URL } from "@/lib/overlay";
import { logInfo, logWarn } from "@/lib/logger";
import { overlayFile } from "./offline-paths";
import { downloadSingleFile } from "./pmtiles-download";

// Zoom range of overlay.pmtiles, from the web project's docs/VECTOR_TILES.md (Stage G).
const OVERLAY_MINZOOM = 8;
const OVERLAY_MAXZOOM = 14;

export function isOverlayDownloaded(): boolean {
  const file = overlayFile();
  return file.exists && file.size > 0;
}

export function getOverlayLocalSizeBytes(): number {
  const file = overlayFile();
  return file.exists ? file.size : 0;
}

/** Size of the file on the server. The overlay is not listed in `grid.json`, so ask with a HEAD. */
export async function fetchOverlayRemoteSizeBytes(signal?: AbortSignal): Promise<number> {
  const response = await fetch(OVERLAY_REMOTE_URL, { method: "HEAD", signal });
  if (!response.ok) {
    throw new Error(`Failed to read overlay size: ${response.status}`);
  }
  const size = Number(response.headers.get("content-length"));
  if (!Number.isFinite(size) || size <= 0) {
    throw new Error("Overlay size unknown: no content-length");
  }
  return size;
}

/** Download the overlay, or refresh it when the server file changed size. */
export async function downloadOverlay(
  onProgress: (fraction: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  const size = await fetchOverlayRemoteSizeBytes(signal);
  const entry: PmtilesFileEntry = {
    url: OVERLAY_REMOTE_URL,
    size,
    minzoom: OVERLAY_MINZOOM,
    maxzoom: OVERLAY_MAXZOOM,
  };
  await downloadSingleFile(entry, overlayFile(), "overlay", onProgress, signal);
  logInfo("overlay", `overlay ready (${size} bytes)`);
}

export function removeOverlay(): void {
  const file = overlayFile();
  if (!file.exists) return;
  try {
    file.delete();
  } catch (error) {
    logWarn("overlay", `failed to delete overlay: ${String(error)}`);
  }
}

/** Source URL for the map: the local file when downloaded, the server otherwise. */
export function getOverlaySourceUrl(): string {
  return isOverlayDownloaded()
    ? `pmtiles://${overlayFile().uri}`
    : `pmtiles://${OVERLAY_REMOTE_URL}`;
}
