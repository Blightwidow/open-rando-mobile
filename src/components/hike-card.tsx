import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import type { Hike } from "@/lib/types";
import { formatDistance, formatDuration, formatElevation } from "@/lib/format";
import { colors, spacing, fontSize, borderRadius } from "@/lib/theme";
import { DifficultyBadge } from "./difficulty-badge";
import { useDownloadStore } from "@/stores/download-store";

interface HikeCardProps {
  hike: Hike;
}

export function HikeCard({ hike }: HikeCardProps) {
  const router = useRouter();
  const downloadState = useDownloadStore((state) =>
    state.getDownloadState(hike.id),
  );

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/explore/${hike.slug}`)}
    >
      <View style={styles.header}>
        <View style={styles.pathBadge}>
          <Text style={styles.pathBadgeText}>{hike.path_ref}</Text>
        </View>
        <DifficultyBadge difficulty={hike.difficulty} />
        {downloadState.status === "complete" && (
          <Text style={styles.downloadedIndicator}>✓</Text>
        )}
      </View>

      <Text style={styles.stations} numberOfLines={1}>
        {hike.start_station.name} → {hike.end_station.name}
      </Text>

      {hike.region ? (
        <Text style={styles.region}>{hike.region}</Text>
      ) : null}

      <View style={styles.stats}>
        <Text style={styles.stat}>{formatDistance(hike.distance_km)}</Text>
        <Text style={styles.statSeparator}>·</Text>
        <Text style={styles.stat}>
          {formatDuration(hike.estimated_duration_min)}
        </Text>
        <Text style={styles.statSeparator}>·</Text>
        <Text style={styles.stat}>
          ↑ {formatElevation(hike.elevation_gain_m)}
        </Text>
        {hike.step_count > 1 && (
          <>
            <Text style={styles.statSeparator}>·</Text>
            <Text style={styles.stat}>{hike.step_count} steps</Text>
          </>
        )}
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
  stations: {
    fontSize: fontSize.subtitle,
    fontWeight: "600",
    color: colors.text,
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
