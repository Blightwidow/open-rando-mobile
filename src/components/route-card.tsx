import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import type { Route } from "@/lib/types";
import { formatDistance, formatElevation } from "@/lib/format";
import { colors, spacing, fontSize, borderRadius } from "@/lib/theme";
import { DifficultyBadge } from "./difficulty-badge";
import { useDownloadStore } from "@/stores/download-store";

interface RouteCardProps {
  route: Route;
}

export function RouteCard({ route }: RouteCardProps) {
  const router = useRouter();
  const downloadState = useDownloadStore((state) =>
    state.getDownloadState(route.id),
  );

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/explore/${route.slug}`)}
    >
      <View style={styles.header}>
        <View style={styles.pathBadge}>
          <Text style={styles.pathBadgeText}>{route.path_ref}</Text>
        </View>
        <DifficultyBadge difficulty={route.difficulty} />
        {downloadState.status === "complete" && (
          <Text style={styles.downloadedIndicator}>✓</Text>
        )}
      </View>

      <Text style={styles.pathName}>{route.path_name}</Text>

      {route.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {route.description}
        </Text>
      ) : null}

      {route.region ? (
        <Text style={styles.region}>{route.region}</Text>
      ) : null}

      <View style={styles.stats}>
        <Text style={styles.stat}>{formatDistance(route.distance_km)}</Text>
        <Text style={styles.statSeparator}>·</Text>
        <Text style={styles.stat}>
          ↑ {formatElevation(route.elevation_gain_m)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.large,
    padding: spacing.medium,
    marginHorizontal: spacing.medium,
    marginVertical: spacing.small / 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.small,
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
  downloadedIndicator: {
    color: colors.success,
    fontSize: fontSize.subtitle,
    fontWeight: "700",
    marginLeft: "auto",
  },
  pathName: {
    fontSize: fontSize.subtitle,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 2,
  },
  description: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  region: {
    fontSize: fontSize.small,
    color: colors.textSecondary,
    marginBottom: spacing.small,
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
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
});
