import { useEffect, useMemo, useState } from "react";
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
import { isImportedRouteId } from "@/stores/imported-route-store";
import { useLocationPermission } from "@/hooks/use-location-permission";
import { useGpsStore } from "@/stores/gps-store";
import { DownloadStatus } from "@/components/download-status";
import { TrailMap } from "@/components/trail-map";
import { ElevationChart } from "@/components/elevation-chart";
import { formatDistance, formatDuration, formatElevation } from "@/lib/format";
import { buildTrailModel, interpolateAtKm } from "@/lib/trail-progress";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { spacing, fontSize, borderRadius } from "@/lib/theme";
import { useColors } from "@/hooks/use-colors";
import { t } from "@/lib/i18n";
import { useLocale } from "@/hooks/use-locale";

export default function OfflineRouteDetailScreen() {
  useLocale();
  const colors = useColors();
  const router = useRouter();
  const { slug, section: sectionParam } = useLocalSearchParams<{
    slug: string;
    section?: string;
  }>();
  const sectionId = typeof sectionParam === "string" ? sectionParam : undefined;
  const { route, geoJson, elevation, pois, isLoading, error } = useOfflineRoute(
    slug,
    sectionId,
  );
  const removeDownload = useDownloadStore((state) => state.removeDownload);
  const removeSection = useDownloadStore((state) => state.removeSection);
  const section = useDownloadStore((state) =>
    sectionId ? state.sections[sectionId] : undefined,
  );
  const fullDownloadMapStyle = useDownloadStore((state) =>
    route?.id ? state.getDownloadState(route.id).mapStyle : undefined,
  );
  const downloadMapStyle = section?.mapStyle ?? fullDownloadMapStyle;
  const sectionDownloadState = useDownloadStore((state) =>
    sectionId ? state.getSectionDownloadState(sectionId) : undefined,
  );
  const isSectionIncomplete =
    sectionDownloadState !== undefined && sectionDownloadState.status !== "complete";
  const { request: requestLocationPermission } = useLocationPermission();
  const startFollowing = useGpsStore((state) => state.startFollowing);
  const isTracking = useGpsStore((state) => state.isTracking);
  const selectTrailPoint = useGpsStore((state) => state.selectTrailPoint);
  const [selectedKm, setSelectedKm] = useState<number | null>(null);

  // The map marker must not outlive this screen
  useEffect(() => () => useGpsStore.getState().selectTrailPoint(null), []);

  const totalKm = elevation?.distances_km?.[elevation.distances_km.length - 1] ?? 0;
  const trailModel = useMemo(() => buildTrailModel(geoJson, totalKm), [geoJson, totalKm]);

  const handleSelectKm = (kilometers: number) => {
    setSelectedKm(kilometers);
    const coordinate = trailModel?.coordinateAtChartKm(kilometers);
    if (coordinate) {
      selectTrailPoint({ longitude: coordinate[0], latitude: coordinate[1] });
    }
  };

  const handleClearSelection = () => {
    setSelectedKm(null);
    selectTrailPoint(null);
  };

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
          minWidth: "45%",
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
        selectionRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: 24,
          marginBottom: spacing.small,
        },
        selectionLabel: {
          fontSize: fontSize.small,
          color: colors.textSecondary,
        },
        selectionValueGroup: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.small,
        },
        selectionValue: {
          fontSize: fontSize.body,
          fontWeight: "700",
          color: "#f97316",
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

  // Section profiles keep the full route's clock, so measure from the first point
  const times = elevation?.times_min ?? [];
  const totalMinutes = times.length > 0 ? times[times.length - 1]! - times[0]! : null;
  const selectedMinutes =
    selectedKm !== null && elevation
      ? interpolateAtKm(elevation.distances_km, times, selectedKm)
      : null;
  const selectedElevation =
    selectedKm !== null && elevation
      ? interpolateAtKm(elevation.distances_km, elevation.elevations_m, selectedKm)
      : null;

  const handleDelete = () => {
    if (!route) return;
    Alert.alert(
      t("saved.removeTitle"),
      t("saved.removeMessage", { name: route.path_name }),
      [
        { text: t("settings.cancel"), style: "cancel" },
        {
          text: t("download.remove"),
          style: "destructive",
          onPress: () => {
            if (sectionId) removeSection(sectionId);
            else removeDownload(route.id);
            router.back();
          },
        },
      ],
    );
  };

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
        {!isImportedRouteId(route.id) && (
          <DifficultyBadge difficulty={route.difficulty} />
        )}
        <Pressable style={styles.downloadedLabel} onPress={handleDelete} hitSlop={8}>
          {!isSectionIncomplete && (
            <Text style={styles.downloadedLabelText}>{t("download.complete")}</Text>
          )}
          <Ionicons name="trash-outline" size={14} color={colors.error} />
        </Pressable>
      </View>

      <Text style={styles.pathName}>{route.path_name}</Text>
      {route.description ? (
        <Text style={styles.description}>{route.description}</Text>
      ) : null}

      <View style={styles.statsGrid}>
        <StatItem
          label={t("route.distance")}
          value={formatDistance(
            section ? section.toKm - section.fromKm : route.distance_km,
          )}
        />
        {totalMinutes !== null && (
          <StatItem label={t("route.duration")} value={formatDuration(totalMinutes)} />
        )}
        <StatItem
          label={t("route.elevationGain")}
          value={formatElevation(route.elevation_gain_m)}
        />
        <StatItem
          label={t("route.elevationLoss")}
          value={formatElevation(route.elevation_loss_m)}
        />
      </View>

      <DownloadStatus state={sectionDownloadState} />

      {geoJson != null && !isTracking && (
        <Pressable
          style={styles.startHikeButton}
          onPress={async () => {
            const granted = await requestLocationPermission();
            if (!granted) {
              Alert.alert(t("gps.permissionRequired"), t("gps.permissionDenied"));
              return;
            }
            startFollowing(route.id, route.slug, sectionId);
            router.push("/active");
          }}
        >
          <Text style={styles.startHikeText}>{t("route.followRoute")}</Text>
        </Pressable>
      )}

      {geoJson != null && (
        <View style={styles.mapSection}>
          <Text style={styles.sectionTitle}>{t("route.trailMap")}</Text>
          <TrailMap
            geoJson={geoJson}
            bbox={section?.bbox ?? route.bbox}
            pois={pois}
            mapStyle={downloadMapStyle}
            routeId={route.id}
          />
        </View>
      )}

      {elevation && (
        <View style={styles.elevationSection}>
          <Text style={styles.sectionTitle}>{t("route.elevationProfile")}</Text>
          {selectedKm !== null && (
            <View style={styles.selectionRow}>
              <Text style={styles.selectionLabel}>{t("active.selectedPoint")}</Text>
              <View style={styles.selectionValueGroup}>
                <Text style={styles.selectionValue}>
                  {formatDistance(selectedKm)}
                  {selectedElevation !== null &&
                    ` · ${formatElevation(selectedElevation)}`}
                  {selectedMinutes !== null && ` · ${formatDuration(selectedMinutes)}`}
                </Text>
                <Pressable
                  onPress={handleClearSelection}
                  hitSlop={8}
                  accessibilityLabel={t("active.clearSelection")}
                >
                  <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                </Pressable>
              </View>
            </View>
          )}
          <ElevationChart
            elevation={elevation}
            selectedKm={selectedKm}
            onSelectKm={handleSelectKm}
          />
        </View>
      )}
    </ScrollView>
  );
}
