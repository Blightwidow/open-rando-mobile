import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useOfflineHike } from "@/hooks/use-offline-hike";
import { TrailMap } from "@/components/trail-map";
import { HikeStepsList } from "@/components/hike-steps-list";
import { formatDistance, formatDuration, formatElevation } from "@/lib/format";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { colors, spacing, fontSize, borderRadius } from "@/lib/theme";

export default function OfflineHikeDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { hike, geoJson, isLoading, error } = useOfflineHike(slug);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !hike) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load hike</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.pathBadge}>
          <Text style={styles.pathBadgeText}>{hike.path_ref}</Text>
        </View>
        <DifficultyBadge difficulty={hike.difficulty} />
      </View>

      <Text style={styles.stations}>
        {hike.start_station.name} → {hike.end_station.name}
      </Text>

      <View style={styles.statsGrid}>
        <StatItem label="Distance" value={formatDistance(hike.distance_km)} />
        <StatItem
          label="Duration"
          value={formatDuration(hike.estimated_duration_min)}
        />
        <StatItem
          label="Elevation ↑"
          value={formatElevation(hike.elevation_gain_m)}
        />
        <StatItem
          label="Elevation ↓"
          value={formatElevation(hike.elevation_loss_m)}
        />
      </View>

      {geoJson != null && (
        <View style={styles.mapSection}>
          <Text style={styles.sectionTitle}>Trail Map</Text>
          <TrailMap
            geoJson={geoJson}
            bbox={hike.bbox}
            startStation={hike.start_station}
            endStation={hike.end_station}
          />
        </View>
      )}

      <HikeStepsList steps={hike.steps} />
    </ScrollView>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.medium,
    paddingBottom: spacing.extraLarge,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: fontSize.title,
    color: colors.error,
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
    fontSize: fontSize.body,
    fontWeight: "700",
  },
  stations: {
    fontSize: fontSize.header,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.medium,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.small,
    marginBottom: spacing.medium,
  },
  statItem: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    padding: spacing.small,
    minWidth: "30%",
    flex: 1,
  },
  statLabel: {
    fontSize: fontSize.small,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  statValue: {
    fontSize: fontSize.subtitle,
    fontWeight: "600",
    color: colors.text,
  },
  mapSection: {
    marginTop: spacing.small,
  },
  sectionTitle: {
    fontSize: fontSize.title,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.small,
  },
});
