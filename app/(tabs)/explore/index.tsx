import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { useRoutes, useCatalogSync } from "@/hooks/use-catalog";
import { RouteCard } from "@/components/route-card";
import { colors, spacing, fontSize } from "@/lib/theme";
import type { Route } from "@/lib/types";

export default function ExploreScreen() {
  const { data: routes, isLoading, error, refetch } = useRoutes();
  const { mutate: syncCatalog, isPending: isSyncing } = useCatalogSync();

  const handleRefresh = () => {
    syncCatalog(undefined, {
      onSuccess: () => refetch(),
    });
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading catalog...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load routes</Text>
        <Text style={styles.errorDetail}>{error.message}</Text>
      </View>
    );
  }

  if (!routes || routes.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No routes available</Text>
        <Text style={styles.emptyDetail}>Pull to refresh or check your connection</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={routes}
      keyExtractor={(item: Route) => item.id}
      renderItem={({ item }) => <RouteCard route={item} />}
      contentContainerStyle={styles.list}
      refreshing={isSyncing}
      onRefresh={handleRefresh}
    />
  );
}

const styles = StyleSheet.create({
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
});
