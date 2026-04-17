import { useQuery } from "@tanstack/react-query";
import type { MapStyle } from "@/lib/map-style";
import { ensureOfflineStyle } from "@/services/offline-tiles";

export function useOfflineMapStyle(
  routeId: string | null | undefined,
  theme: MapStyle,
): string | null {
  const query = useQuery({
    queryKey: ["offline-style", routeId, theme],
    queryFn: () => (routeId ? ensureOfflineStyle(routeId, theme) : null),
    enabled: !!routeId,
    staleTime: Infinity,
  });
  return query.data ?? null;
}
