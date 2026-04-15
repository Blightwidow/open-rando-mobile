import { fetchCatalog } from "./api";
import { getMetadataValue, setMetadataValue, upsertRoutes } from "./database";
import { logInfo, logWarn, logError } from "@/lib/logger";

export interface SyncResult {
  synced: boolean;
  routeCount: number;
  generatedAt: string | null;
}

export async function syncCatalog(): Promise<SyncResult> {
  logInfo("catalog-sync", "Starting catalog sync");
  const storedGeneratedAt = await getMetadataValue("catalog_generated_at");
  logInfo("catalog-sync", `Stored generated_at: ${storedGeneratedAt ?? "none"}`);

  try {
    const catalog = await fetchCatalog();

    if (storedGeneratedAt === catalog.generated_at) {
      logInfo("catalog-sync", `Catalog up-to-date (${catalog.routes.length} routes)`);
      return {
        synced: false,
        routeCount: catalog.routes.length,
        generatedAt: catalog.generated_at,
      };
    }

    logInfo("catalog-sync", `New catalog: ${catalog.routes.length} routes, generated_at=${catalog.generated_at}`);
    await upsertRoutes(catalog.routes);
    await setMetadataValue("catalog_generated_at", catalog.generated_at);

    logInfo("catalog-sync", "Catalog sync complete");
    return {
      synced: true,
      routeCount: catalog.routes.length,
      generatedAt: catalog.generated_at,
    };
  } catch (error) {
    if (storedGeneratedAt) {
      logWarn("catalog-sync", `Sync failed, falling back to stale data: ${error}`);
      return {
        synced: false,
        routeCount: 0,
        generatedAt: storedGeneratedAt,
      };
    }
    logError("catalog-sync", `Sync failed with no fallback: ${error}`);
    throw error;
  }
}
