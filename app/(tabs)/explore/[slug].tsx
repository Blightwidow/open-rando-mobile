import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useRoute } from "@/hooks/use-catalog";
import { DownloadButton } from "@/components/download-button";
import { TrailMap } from "@/components/trail-map";
import { useDownloadStore } from "@/stores/download-store";
import { useOfflineRoute } from "@/hooks/use-offline-route";
import { formatDistance, formatElevation } from "@/lib/format";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { colors, spacing, fontSize, borderRadius } from "@/lib/theme";
import { t } from "@/lib/i18n";
import { useLocale } from "@/hooks/use-locale";

export default function RouteDetailScreen() {
  useLocale();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data: route, isLoading, error } = useRoute(slug);
  const downloadState = useDownloadStore((state) =>
    route ? state.getDownloadState(route.id) : { status: "idle" as const, progress: 0 },
  );
  const offlineData = useOfflineRoute(slug);

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
        <Text style={styles.errorText}>{t("route.notFound")}</Text>
      </View>
    );
  }

  const showMap = downloadState.status === "complete" && offlineData.geoJson != null;

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
      {route.region ? <Text style={styles.region}>{route.region}</Text> : null}

      <View style={styles.statsGrid}>
        <StatItem label={t("route.distance")} value={formatDistance(route.distance_km)} />
        <StatItem
          label={t("route.elevationGain")}
          value={formatElevation(route.elevation_gain_m)}
        />
        <StatItem
          label={t("route.elevationLoss")}
          value={formatElevation(route.elevation_loss_m)}
        />
        <StatItem
          label={t("route.maxAltitude")}
          value={formatElevation(route.max_elevation_m)}
        />
      </View>

      {route.terrain.length > 0 && (
        <View style={styles.terrainRow}>
          {route.terrain.map((terrain) => (
            <View key={terrain} style={styles.terrainBadge}>
              <Text style={styles.terrainText}>{t(`terrain.${terrain}`)}</Text>
            </View>
          ))}
        </View>
      )}

      <DownloadButton route={route} />

      {showMap && (
        <View style={styles.mapSection}>
          <Text style={styles.sectionTitle}>{t("route.trailMap")}</Text>
          <TrailMap geoJson={offlineData.geoJson} bbox={route.bbox} pois={route.pois} />
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
    marginBottom: spacing.small,
  },
  region: {
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
  terrainRow: {
    flexDirection: "row",
    gap: spacing.small,
    marginBottom: spacing.medium,
  },
  terrainBadge: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.small,
    paddingHorizontal: spacing.small,
    paddingVertical: spacing.extraSmall,
  },
  terrainText: {
    fontSize: fontSize.small,
    color: colors.textSecondary,
  },
  mapSection: {
    marginTop: spacing.medium,
  },
  sectionTitle: {
    fontSize: fontSize.title,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.small,
  },
});
