import { useMemo } from "react";
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
import { useRoute } from "@/hooks/use-catalog";
import { DownloadButton } from "@/components/download-button";
import { TrailMap } from "@/components/trail-map";
import { ElevationChart } from "@/components/elevation-chart";
import { useDownloadStore } from "@/stores/download-store";
import { useOfflineRoute } from "@/hooks/use-offline-route";
import { useLocationPermission } from "@/hooks/use-location-permission";
import { useGpsStore } from "@/stores/gps-store";
import { formatDistance, formatElevation } from "@/lib/format";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { spacing, fontSize, borderRadius } from "@/lib/theme";
import { useColors } from "@/hooks/use-colors";
import { t } from "@/lib/i18n";
import { useLocale } from "@/hooks/use-locale";
import type { DownloadState } from "@/lib/types";

const IDLE_DOWNLOAD_STATE: DownloadState = { status: "idle", progress: 0 };

export default function RouteDetailScreen() {
  useLocale();
  const colors = useColors();
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data: route, isLoading, error } = useRoute(slug);
  const routeId = route?.id;
  const downloadState = useDownloadStore((state) =>
    routeId ? state.getDownloadState(routeId) : IDLE_DOWNLOAD_STATE,
  );
  const removeDownload = useDownloadStore((state) => state.removeDownload);
  const offlineData = useOfflineRoute(slug);
  const { request: requestLocationPermission } = useLocationPermission();
  const startFollowing = useGpsStore((state) => state.startFollowing);
  const isTracking = useGpsStore((state) => state.isTracking);

  const styles = useMemo(
    () =>
      StyleSheet.create({
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
          marginTop: spacing.small,
        },
        startHikeText: {
          color: "#fff",
          fontSize: fontSize.subtitle,
          fontWeight: "700",
        },
      }),
    [colors],
  );

  function StatItem({ label, value }: { label: string; value: string }) {
    return (
      <View style={styles.statItem}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
    );
  }

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
  const canFollowRoute = showMap && !isTracking;

  const handleFollowRoute = async () => {
    if (!route) return;

    const granted = await requestLocationPermission();
    if (!granted) {
      Alert.alert(t("gps.permissionRequired"), t("gps.permissionDenied"));
      return;
    }

    startFollowing(route.id, route.slug);
    router.push("/active");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.pathBadge}>
          <Text style={styles.pathBadgeText}>{route.path_ref}</Text>
        </View>
        <DifficultyBadge difficulty={route.difficulty} />
        {downloadState.status === "complete" && routeId && (
          <Pressable
            style={styles.downloadedLabel}
            onPress={() => removeDownload(routeId)}
            hitSlop={8}
          >
            <Text style={styles.downloadedLabelText}>{t("download.complete")}</Text>
            <Ionicons name="trash-outline" size={14} color={colors.error} />
          </Pressable>
        )}
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

      {canFollowRoute && (
        <Pressable style={styles.startHikeButton} onPress={handleFollowRoute}>
          <Text style={styles.startHikeText}>{t("route.followRoute")}</Text>
        </Pressable>
      )}

      {showMap && (
        <View style={styles.mapSection}>
          <Text style={styles.sectionTitle}>{t("route.trailMap")}</Text>
          <TrailMap geoJson={offlineData.geoJson} bbox={route.bbox} />
        </View>
      )}

      {offlineData.elevation && (
        <View style={styles.elevationSection}>
          <Text style={styles.sectionTitle}>{t("route.elevationProfile")}</Text>
          <ElevationChart elevation={offlineData.elevation} />
        </View>
      )}
    </ScrollView>
  );
}
