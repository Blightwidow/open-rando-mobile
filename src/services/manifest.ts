import { GRID_MANIFEST_URL, routeManifestUrl } from "@/lib/constants";
import type { GridManifest, RouteManifest } from "@/lib/types";
import { logInfo, logError } from "@/lib/logger";
import {
  gridManifestCacheFile,
  routeManifestCacheFile,
} from "./offline-paths";

let cachedGridManifest: GridManifest | null = null;

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function fetchGridManifest(
  signal?: AbortSignal,
  options: { force?: boolean } = {},
): Promise<GridManifest> {
  if (!options.force && cachedGridManifest) return cachedGridManifest;

  const file = gridManifestCacheFile();
  if (!options.force && file.exists) {
    try {
      const cached = JSON.parse(await file.text()) as GridManifest;
      cachedGridManifest = cached;
      void refreshGridManifestIfNewer(cached, signal);
      return cached;
    } catch (error) {
      logError("manifest", `Failed to read cached grid.json: ${String(error)}`);
    }
  }

  const fresh = await fetchJson<GridManifest>(GRID_MANIFEST_URL, signal);
  persistGridManifest(fresh);
  return fresh;
}

async function refreshGridManifestIfNewer(
  cached: GridManifest,
  signal?: AbortSignal,
): Promise<void> {
  try {
    const fresh = await fetchJson<GridManifest>(GRID_MANIFEST_URL, signal);
    if (fresh.source_snapshot !== cached.source_snapshot) {
      logInfo(
        "manifest",
        `grid.json snapshot changed ${cached.source_snapshot} → ${fresh.source_snapshot}`,
      );
      persistGridManifest(fresh);
    }
  } catch {
    // offline or transient error — keep cached copy
  }
}

function persistGridManifest(manifest: GridManifest): void {
  cachedGridManifest = manifest;
  const file = gridManifestCacheFile();
  if (!file.exists) file.create();
  file.write(JSON.stringify(manifest));
}

export function readCachedGridManifest(): GridManifest | null {
  if (cachedGridManifest) return cachedGridManifest;
  const file = gridManifestCacheFile();
  if (!file.exists) return null;
  try {
    const parsed = JSON.parse(file.textSync()) as GridManifest;
    cachedGridManifest = parsed;
    return parsed;
  } catch {
    return null;
  }
}

export async function fetchRouteManifest(
  routeId: string,
  signal?: AbortSignal,
): Promise<RouteManifest> {
  const fresh = await fetchJson<RouteManifest>(
    routeManifestUrl(routeId),
    signal,
  );
  const file = routeManifestCacheFile(routeId);
  if (!file.exists) file.create();
  file.write(JSON.stringify(fresh));
  return fresh;
}

export function readCachedRouteManifest(routeId: string): RouteManifest | null {
  const file = routeManifestCacheFile(routeId);
  if (!file.exists) return null;
  try {
    return JSON.parse(file.textSync()) as RouteManifest;
  } catch {
    return null;
  }
}
