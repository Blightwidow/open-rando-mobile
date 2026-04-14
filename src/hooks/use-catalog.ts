import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { syncCatalog } from "@/services/catalog-sync";
import { getAllRoutes, getRouteBySlug } from "@/services/database";

export function useCatalogSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: syncCatalog,
    onSuccess: (result) => {
      if (result.synced) {
        queryClient.invalidateQueries({ queryKey: ["routes"] });
      }
    },
  });
}

export function useRoutes() {
  return useQuery({
    queryKey: ["routes"],
    queryFn: getAllRoutes,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRoute(slug: string) {
  return useQuery({
    queryKey: ["route", slug],
    queryFn: () => getRouteBySlug(slug),
    enabled: !!slug,
  });
}
