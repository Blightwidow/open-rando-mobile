import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { useHikes, useCatalogSync } from "@/hooks/use-catalog";
import { HikeCard } from "@/components/hike-card";
import { colors, spacing, fontSize } from "@/lib/theme";
import type { Hike } from "@/lib/types";

export default function ExploreScreen() {
  const { data: hikes, isLoading, error, refetch } = useHikes();
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
        <Text style={styles.errorText}>Failed to load hikes</Text>
        <Text style={styles.errorDetail}>{error.message}</Text>
      </View>
    );
  }

  if (!hikes || hikes.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No hikes available</Text>
        <Text style={styles.emptyDetail}>
          Pull to refresh or check your connection
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={hikes}
      keyExtractor={(item: Hike) => item.id}
      renderItem={({ item }) => <HikeCard hike={item} />}
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
