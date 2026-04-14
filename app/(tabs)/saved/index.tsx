import { FlatList, Pressable, StyleSheet, Text, View, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useDownloadStore } from "@/stores/download-store";
import { getRouteById } from "@/services/database";
import { formatDistance, formatElevation } from "@/lib/format";
import { colors, spacing, fontSize, borderRadius } from "@/lib/theme";
import type { Route } from "@/lib/types";

export default function SavedScreen() {
  const router = useRouter();
  const downloads = useDownloadStore((state) => state.downloads);
  const removeDownload = useDownloadStore((state) => state.removeDownload);

  const downloadedIds = Object.entries(downloads)
    .filter(([, state]) => state.status === "complete")
    .map(([id]) => id);

  const { data: routes } = useQuery({
    queryKey: ["saved-routes", downloadedIds],
    queryFn: async () => {
      const results: Route[] = [];
      for (const id of downloadedIds) {
        const route = await getRouteById(id);
        if (route) results.push(route);
      }
      return results;
    },
    enabled: downloadedIds.length > 0,
  });

  const handleRemove = (route: Route) => {
    Alert.alert("Remove Download", `Remove offline data for "${route.path_name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => removeDownload(route.id),
      },
    ]);
  };

  if (downloadedIds.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No saved routes</Text>
        <Text style={styles.emptyDetail}>
          Download routes from the Explore tab to use offline
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={routes ?? []}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <Pressable style={styles.card} onPress={() => router.push(`/saved/${item.slug}`)}>
          <View style={styles.cardHeader}>
            <View style={styles.pathBadge}>
              <Text style={styles.pathBadgeText}>{item.path_ref}</Text>
            </View>
          </View>
          <Text style={styles.pathName} numberOfLines={1}>
            {item.path_name}
          </Text>
          <View style={styles.stats}>
            <Text style={styles.stat}>{formatDistance(item.distance_km)}</Text>
            <Text style={styles.statSeparator}>·</Text>
            <Text style={styles.stat}>↑ {formatElevation(item.elevation_gain_m)}</Text>
          </View>
          <Pressable style={styles.removeButton} onPress={() => handleRemove(item)}>
            <Text style={styles.removeText}>Remove</Text>
          </Pressable>
        </Pressable>
      )}
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
  emptyText: {
    fontSize: fontSize.title,
    fontWeight: "600",
    color: colors.text,
  },
  emptyDetail: {
    marginTop: spacing.small,
    fontSize: fontSize.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.large,
    padding: spacing.medium,
    marginHorizontal: spacing.medium,
    marginVertical: spacing.small / 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.small,
  },
  pathBadge: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.small,
    paddingHorizontal: spacing.small,
    paddingVertical: 2,
  },
  pathBadgeText: {
    color: "#fff",
    fontSize: fontSize.small,
    fontWeight: "700",
  },
  pathName: {
    fontSize: fontSize.subtitle,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 2,
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.small,
  },
  stat: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
  },
  statSeparator: {
    fontSize: fontSize.body,
    color: colors.border,
    marginHorizontal: spacing.extraSmall,
  },
  removeButton: {
    alignSelf: "flex-start",
  },
  removeText: {
    color: colors.error,
    fontSize: fontSize.small,
  },
});
