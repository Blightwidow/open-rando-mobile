import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useOfflineRoute } from "@/hooks/use-offline-route";
import { TrailMap } from "@/components/trail-map";
import { formatDistance, formatElevation } from "@/lib/format";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { colors, spacing, fontSize, borderRadius } from "@/lib/theme";

export default function OfflineRouteDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { route, geoJson, isLoading, error } = useOfflineRoute(slug);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !route) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load route</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.pathBadge}>
          <Text style={styles.pathBadgeText}>{route.path_ref}</Text>
        </View>
        <DifficultyBadge difficulty={route.difficulty} />
      </View>

      <Text style={styles.pathName}>{route.path_name}</Text>
      {route.description ? (
        <Text style={styles.description}>{route.description}</Text>
      ) : null}

      <View style={styles.statsGrid}>
        <StatItem label="Distance" value={formatDistance(route.distance_km)} />
        <StatItem
          label="Elevation ↑"
          value={formatElevation(route.elevation_gain_m)}
        />
        <StatItem
          label="Elevation ↓"
          value={formatElevation(route.elevation_loss_m)}
        />
      </View>

      {geoJson != null && (
        <View style={styles.mapSection}>
          <Text style={styles.sectionTitle}>Trail Map</Text>
          <TrailMap
            geoJson={geoJson}
            bbox={route.bbox}
            pois={route.pois}
          />
        </View>
      )}
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
  pathName: {
    fontSize: fontSize.title,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 2,
  },
  description: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
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
