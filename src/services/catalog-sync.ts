import { fetchCatalog } from "./api";
import { getMetadataValue, setMetadataValue, upsertRoutes } from "./database";

export interface SyncResult {
  synced: boolean;
  routeCount: number;
  generatedAt: string | null;
}

export async function syncCatalog(): Promise<SyncResult> {
  const storedGeneratedAt = await getMetadataValue("catalog_generated_at");

  try {
    const catalog = await fetchCatalog();

    if (storedGeneratedAt === catalog.generated_at) {
      return {
        synced: false,
        routeCount: catalog.routes.length,
        generatedAt: catalog.generated_at,
      };
    }

    await upsertRoutes(catalog.routes);
    await setMetadataValue("catalog_generated_at", catalog.generated_at);

    return {
      synced: true,
      routeCount: catalog.routes.length,
      generatedAt: catalog.generated_at,
    };
  } catch (error) {
    if (storedGeneratedAt) {
      return {
        synced: false,
        routeCount: 0,
        generatedAt: storedGeneratedAt,
      };
    }
    throw error;
  }
}
