import { Asset } from "expo-asset";
import { logInfo, logWarn } from "@/lib/logger";

let cachedUri: string | null = null;
let pending: Promise<string | null> | null = null;

export function getWorldAssetUri(): string | null {
  return cachedUri;
}

export async function ensureWorldAsset(): Promise<string | null> {
  if (cachedUri) return cachedUri;
  if (pending) return pending;

  pending = (async () => {
    try {
      const asset = Asset.fromModule(
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        require("../../assets/world-low.pmtiles"),
      );
      if (!asset.localUri) await asset.downloadAsync();
      const uri = asset.localUri ?? asset.uri;
      cachedUri = uri;
      logInfo("world-asset", `ready at ${uri}`);
      return uri;
    } catch (error) {
      logWarn("world-asset", `load failed: ${String(error)}`);
      return null;
    } finally {
      pending = null;
    }
  })();

  return pending;
}
