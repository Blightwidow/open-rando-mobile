import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFilteredRoutes, useCatalogSync } from "@/hooks/use-catalog";
import { RouteCard } from "@/components/route-card";
import { ExploreMap } from "@/components/explore-map";
import { FilterSheet } from "@/components/filter-sheet";
import { useFilterStore } from "@/stores/filter-store";
import { colors, spacing, fontSize, borderRadius } from "@/lib/theme";
import { t } from "@/lib/i18n";
import { useLocale } from "@/hooks/use-locale";
import type { Route } from "@/lib/types";

type ViewMode = "list" | "map";

export default function ExploreScreen() {
  useLocale();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [filterVisible, setFilterVisible] = useState(false);
  const { data: routes, isLoading, error, refetch } = useFilteredRoutes();
  const { mutate: syncCatalog, isPending: isSyncing } = useCatalogSync();
  const activeFilterCount = useFilterStore((state) => state.activeFilterCount);

  const handleRefresh = () => {
    syncCatalog(undefined, {
      onSuccess: () => refetch(),
    });
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t("explore.loading")}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{t("explore.error")}</Text>
        <Text style={styles.errorDetail}>{error.message}</Text>
      </View>
    );
  }

  if (!routes || routes.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>{t("explore.empty")}</Text>
        <Text style={styles.emptyDetail}>{t("explore.emptyDetail")}</Text>
      </View>
    );
  }

  const filterCount = activeFilterCount();

  return (
    <View style={styles.container}>
      <View style={styles.toggleContainer}>
        <View style={styles.toggleRow}>
          <View style={styles.toggle}>
            <Pressable
              style={[
                styles.toggleButton,
                viewMode === "list" && styles.toggleButtonActive,
              ]}
              onPress={() => setViewMode("list")}
            >
              <Text
                style={[
                  styles.toggleText,
                  viewMode === "list" && styles.toggleTextActive,
                ]}
              >
                {t("explore.list")}
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.toggleButton,
                viewMode === "map" && styles.toggleButtonActive,
              ]}
              onPress={() => setViewMode("map")}
            >
              <Text
                style={[styles.toggleText, viewMode === "map" && styles.toggleTextActive]}
              >
                {t("explore.map")}
              </Text>
            </Pressable>
          </View>
          <Pressable style={styles.filterButton} onPress={() => setFilterVisible(true)}>
            <Ionicons
              name="filter"
              size={20}
              color={filterCount > 0 ? colors.primary : colors.textSecondary}
            />
            {filterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{filterCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {viewMode === "list" ? (
        <FlatList
          data={routes}
          keyExtractor={(item: Route) => item.id}
          renderItem={({ item }) => <RouteCard route={item} />}
          contentContainerStyle={styles.list}
          refreshing={isSyncing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            filterCount > 0 ? (
              <View style={styles.centered}>
                <Text style={styles.emptyText}>{t("filters.noResults")}</Text>
              </View>
            ) : null
          }
        />
      ) : (
        <ExploreMap routes={routes} />
      )}

      <FilterSheet visible={filterVisible} onClose={() => setFilterVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    paddingVertical: spacing.small,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.large,
  },
  loadingText: {
    marginTop: spacing.medium,
    fontSize: fontSize.body,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: fontSize.title,
    fontWeight: "600",
    color: colors.error,
  },
  errorDetail: {
    marginTop: spacing.small,
    fontSize: fontSize.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  emptyText: {
    fontSize: fontSize.title,
    fontWeight: "600",
    color: colors.text,
  },
  emptyDetail: {
    marginTop: spacing.small,
    fontSize: fontSize.body,
    color: colors.textSecondary,
  },
  toggleContainer: {
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    backgroundColor: colors.background,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.small,
  },
  toggle: {
    flex: 1,
    flexDirection: "row",
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  toggleButton: {
    flex: 1,
    paddingVertical: spacing.small,
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    fontSize: fontSize.body,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  toggleTextActive: {
    color: "#fff",
  },
  filterButton: {
    padding: spacing.small,
    position: "relative",
  },
  filterBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: colors.primary,
    borderRadius: 999,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  filterBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
});
