import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useOfflineRoute } from "@/hooks/use-offline-route";
import { useDownloadStore } from "@/stores/download-store";
import { useLocationPermission } from "@/hooks/use-location-permission";
import { useGpsStore } from "@/stores/gps-store";
import { TrailMap } from "@/components/trail-map";
import { ElevationChart } from "@/components/elevation-chart";
import { formatDistance, formatElevation } from "@/lib/format";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { colors, spacing, fontSize, borderRadius } from "@/lib/theme";
import { t } from "@/lib/i18n";
import { useLocale } from "@/hooks/use-locale";

export default function OfflineRouteDetailScreen() {
  useLocale();
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { route, geoJson, elevation, isLoading, error } = useOfflineRoute(slug);
  const removeDownload = useDownloadStore((state) => state.removeDownload);
  const { request: requestLocationPermission } = useLocationPermission();
  const startFollowing = useGpsStore((state) => state.startFollowing);
  const isTracking = useGpsStore((state) => state.isTracking);

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
        <Text style={styles.errorText}>{t("saved.failedLoad")}</Text>
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
        <Pressable
          style={styles.downloadedLabel}
          onPress={() => removeDownload(route.id)}
          hitSlop={8}
        >
          <Text style={styles.downloadedLabelText}>{t("download.complete")}</Text>
          <Ionicons name="trash-outline" size={14} color={colors.error} />
        </Pressable>
      </View>

      <Text style={styles.pathName}>{route.path_name}</Text>
      {route.description ? (
        <Text style={styles.description}>{route.description}</Text>
      ) : null}

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
      </View>

      {geoJson != null && !isTracking && (
        <Pressable
          style={styles.startHikeButton}
          onPress={async () => {
            const granted = await requestLocationPermission();
            if (!granted) {
              Alert.alert(t("gps.permissionRequired"), t("gps.permissionDenied"));
              return;
            }
            startFollowing(route.id, route.slug);
            router.push("/active");
          }}
        >
          <Text style={styles.startHikeText}>{t("route.followRoute")}</Text>
        </Pressable>
      )}

      {geoJson != null && (
        <View style={styles.mapSection}>
          <Text style={styles.sectionTitle}>{t("route.trailMap")}</Text>
          <TrailMap geoJson={geoJson} bbox={route.bbox} />
        </View>
      )}

      {elevation && (
        <View style={styles.elevationSection}>
          <Text style={styles.sectionTitle}>{t("route.elevationProfile")}</Text>
          <ElevationChart elevation={elevation} />
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
    flex: 1,
  },
  downloadedLabel: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  downloadedLabelText: {
    fontSize: fontSize.small,
    color: colors.textSecondary,
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
  elevationSection: {
    marginTop: spacing.medium,
  },
  sectionTitle: {
    fontSize: fontSize.title,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.small,
  },
  startHikeButton: {
    backgroundColor: colors.success,
    borderRadius: borderRadius.medium,
    paddingVertical: spacing.small + 2,
    alignItems: "center",
    marginBottom: spacing.small,
  },
  startHikeText: {
    color: "#fff",
    fontSize: fontSize.subtitle,
    fontWeight: "700",
  },
});
