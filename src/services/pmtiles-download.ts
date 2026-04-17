import { File, Directory } from "expo-file-system";
import {
  createDownloadResumable,
  type DownloadResumable,
} from "expo-file-system/legacy";
import { MAX_PARALLEL_DOWNLOADS } from "@/lib/constants";
import type {
  GridManifest,
  LayerKind,
  PmtilesFileEntry,
  RouteManifest,
  SquareKey,
} from "@/lib/types";
import { logError, logInfo, logWarn } from "@/lib/logger";
import {
  baseLayerFile,
  ensureOfflineDirectories,
  squareDirectory,
  squareLayerFile,
} from "./offline-paths";

const LAYERS: LayerKind[] = ["france", "contours", "hillshade"];
const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 1000;

interface DownloadItem {
  entry: PmtilesFileEntry;
  destFile: File;
  label: string;
  ensureParent?: () => void;
}

class AbortError extends Error {
  constructor() {
    super("Download aborted");
    this.name = "AbortError";
  }
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new AbortError());
    };
    if (signal?.aborted) {
      clearTimeout(timer);
      reject(new AbortError());
      return;
    }
    signal?.addEventListener("abort", onAbort);
  });
}

function partFile(destFile: File): File {
  return new File(`${destFile.uri}.part`);
}

function safeDelete(file: File): void {
  try {
    if (file.exists) file.delete();
  } catch (error) {
    logWarn("pmtiles-dl", `delete failed ${file.uri}: ${String(error)}`);
  }
}

async function downloadOnce(
  item: DownloadItem,
  onBytes: (delta: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  if (signal?.aborted) throw new AbortError();

  const { entry, destFile } = item;
  const part = partFile(destFile);

  safeDelete(part);

  let lastBytes = 0;
  const resumable: DownloadResumable = createDownloadResumable(
    entry.url,
    part.uri,
    {},
    ({ totalBytesWritten }) => {
      const delta = totalBytesWritten - lastBytes;
      lastBytes = totalBytesWritten;
      if (delta > 0) onBytes(delta);
    },
  );

  const onAbort = () => {
    void resumable.cancelAsync().catch(() => {});
  };
  if (signal) {
    if (signal.aborted) {
      safeDelete(part);
      throw new AbortError();
    }
    signal.addEventListener("abort", onAbort);
  }

  try {
    const result = await resumable.downloadAsync();
    if (!result) {
      safeDelete(part);
      throw new AbortError();
    }

    if (!part.exists) {
      throw new Error(`download finished but .part missing: ${entry.url}`);
    }
    const actualSize = part.size;
    if (actualSize !== entry.size) {
      safeDelete(part);
      throw new Error(
        `size mismatch for ${entry.url}: expected ${entry.size}, got ${actualSize}`,
      );
    }

    safeDelete(destFile);
    part.move(destFile);
  } finally {
    signal?.removeEventListener("abort", onAbort);
  }
}

async function downloadPmtilesFile(
  item: DownloadItem,
  onBytes: (delta: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  item.ensureParent?.();

  if (item.destFile.exists && item.destFile.size === item.entry.size) {
    onBytes(item.entry.size);
    return;
  }

  let attempt = 0;
  let lastError: unknown;
  while (attempt < MAX_ATTEMPTS) {
    attempt += 1;
    try {
      await downloadOnce(item, onBytes, signal);
      return;
    } catch (error) {
      if (error instanceof AbortError || signal?.aborted) throw error;
      lastError = error;
      logWarn(
        "pmtiles-dl",
        `attempt ${attempt}/${MAX_ATTEMPTS} failed for ${item.label}: ${String(error)}`,
      );
      if (attempt < MAX_ATTEMPTS) {
        await delay(BASE_BACKOFF_MS * 2 ** (attempt - 1), signal);
      }
    }
  }
  logError("pmtiles-dl", `giving up on ${item.label} after ${MAX_ATTEMPTS} attempts`);
  throw lastError instanceof Error
    ? lastError
    : new Error(`download failed: ${item.label}`);
}

function buildItems(
  routeManifest: RouteManifest,
  gridManifest: GridManifest,
): DownloadItem[] {
  const items: DownloadItem[] = [];

  for (const layer of LAYERS) {
    const entry = gridManifest.base[layer];
    items.push({
      entry,
      destFile: baseLayerFile(layer),
      label: `base/${layer}`,
    });
  }

  for (const [col, row] of routeManifest.squares) {
    const key: SquareKey = `${col}_${row}`;
    const square = gridManifest.squares[key];
    if (!square) {
      logWarn("pmtiles-dl", `grid manifest missing square ${key}`);
      continue;
    }
    const dir: Directory = squareDirectory(col, row);
    for (const layer of LAYERS) {
      const entry = square.files[layer];
      items.push({
        entry,
        destFile: squareLayerFile(col, row, layer),
        label: `grid/${key}/${layer}`,
        ensureParent: () => {
          if (!dir.exists) dir.create();
        },
      });
    }
  }

  return items;
}

async function runWithConcurrency(
  items: DownloadItem[],
  limit: number,
  worker: (item: DownloadItem) => Promise<void>,
): Promise<void> {
  let cursor = 0;
  const runners: Promise<void>[] = [];
  const next = async (): Promise<void> => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      await worker(items[index]);
    }
  };
  for (let i = 0; i < Math.min(limit, items.length); i += 1) {
    runners.push(next());
  }
  await Promise.all(runners);
}

export async function downloadAllForRoute(
  routeId: string,
  routeManifest: RouteManifest,
  gridManifest: GridManifest,
  onProgress: (fraction: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  ensureOfflineDirectories();

  const items = buildItems(routeManifest, gridManifest);
  const totalBytes = items.reduce((sum, item) => sum + item.entry.size, 0);
  if (totalBytes === 0) {
    onProgress(1);
    return;
  }

  logInfo(
    "pmtiles-dl",
    `route ${routeId}: ${items.length} files, ${totalBytes} bytes total`,
  );

  let downloadedBytes = 0;
  let lastEmittedFraction = 0;
  let lastEmittedAt = 0;
  const MIN_FRACTION_DELTA = 0.005;
  const MIN_INTERVAL_MS = 200;
  const reportProgress = (delta: number) => {
    downloadedBytes += delta;
    const fraction = Math.min(1, downloadedBytes / totalBytes);
    const now = Date.now();
    if (
      fraction < 1 &&
      fraction - lastEmittedFraction < MIN_FRACTION_DELTA &&
      now - lastEmittedAt < MIN_INTERVAL_MS
    ) {
      return;
    }
    lastEmittedFraction = fraction;
    lastEmittedAt = now;
    onProgress(fraction);
  };

  await runWithConcurrency(items, MAX_PARALLEL_DOWNLOADS, async (item) => {
    if (signal?.aborted) throw new AbortError();
    await downloadPmtilesFile(item, reportProgress, signal);
  });

  onProgress(1);
}
