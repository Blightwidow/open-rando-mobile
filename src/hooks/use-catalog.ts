import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { syncCatalog } from "@/services/catalog-sync";
import { getAllHikes, getHikeBySlug } from "@/services/database";

export function useCatalogSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: syncCatalog,
    onSuccess: (result) => {
      if (result.synced) {
        queryClient.invalidateQueries({ queryKey: ["hikes"] });
      }
    },
  });
}

export function useHikes() {
  return useQuery({
    queryKey: ["hikes"],
    queryFn: getAllHikes,
    staleTime: 5 * 60 * 1000,
  });
}

export function useHike(slug: string) {
  return useQuery({
    queryKey: ["hike", slug],
    queryFn: () => getHikeBySlug(slug),
    enabled: !!slug,
  });
}
