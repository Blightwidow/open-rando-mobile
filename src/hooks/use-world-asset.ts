import { useEffect, useState } from "react";
import { ensureWorldAsset, getWorldAssetUri } from "@/services/world-asset";

export function useWorldAssetUri(): string | null {
  const [uri, setUri] = useState<string | null>(getWorldAssetUri());

  useEffect(() => {
    if (uri) return;
    let cancelled = false;
    void ensureWorldAsset().then((resolved) => {
      if (!cancelled) setUri(resolved);
    });
    return () => {
      cancelled = true;
    };
  }, [uri]);

  return uri;
}
