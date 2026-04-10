import { fetchCatalog } from "./api";
import { getMetadataValue, setMetadataValue, upsertHikes } from "./database";

export interface SyncResult {
  synced: boolean;
  hikeCount: number;
  generatedAt: string | null;
}

export async function syncCatalog(): Promise<SyncResult> {
  const storedGeneratedAt = await getMetadataValue("catalog_generated_at");

  try {
    const catalog = await fetchCatalog();

    if (storedGeneratedAt === catalog.generated_at) {
      return {
        synced: false,
        hikeCount: catalog.hikes.length,
        generatedAt: catalog.generated_at,
      };
    }

    await upsertHikes(catalog.hikes);
    await setMetadataValue("catalog_generated_at", catalog.generated_at);

    return {
      synced: true,
      hikeCount: catalog.hikes.length,
      generatedAt: catalog.generated_at,
    };
  } catch (error) {
    if (storedGeneratedAt) {
      return {
        synced: false,
        hikeCount: 0,
        generatedAt: storedGeneratedAt,
      };
    }
    throw error;
  }
}
