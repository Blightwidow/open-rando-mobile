import type { Route } from "@/lib/types";
import { getRouteById, getRouteBySlug } from "@/services/database";
import { isImportedRouteId, useImportedRouteStore } from "@/stores/imported-route-store";

/** Resolves catalog routes from SQLite and GPX imports from the imported-route store. */
export async function lookupRouteById(routeId: string): Promise<Route | null> {
  if (isImportedRouteId(routeId)) {
    return useImportedRouteStore.getState().getRouteById(routeId);
  }
  return getRouteById(routeId);
}

export async function lookupRouteBySlug(slug: string): Promise<Route | null> {
  const imported = useImportedRouteStore.getState().getRouteBySlug(slug);
  if (imported) return imported;
  return getRouteBySlug(slug);
}
