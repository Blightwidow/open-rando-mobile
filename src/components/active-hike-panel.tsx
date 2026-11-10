import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ElevationChart } from "@/components/elevation-chart";
import { useColors } from "@/hooks/use-colors";
import { useGpsStore } from "@/stores/gps-store";
import { buildTrailModel, interpolateAtKm } from "@/lib/trail-progress";
import { formatDistance, formatDuration } from "@/lib/format";
import { spacing, fontSize } from "@/lib/theme";
import { t } from "@/lib/i18n";
import type { ElevationProfile } from "@/lib/types";

const PANEL_CHART_HEIGHT = 110;

interface ActiveHikePanelProps {
  geoJson: unknown;
  elevation: ElevationProfile;
}

/**
 * Elevation profile under the map during a hike: where you are, distance and time left,
 * and a tappable point that shows on the map with the time to reach it.
 * Subscribes to the GPS position itself so the map above never re-renders.
 */
export function ActiveHikePanel({ geoJson, elevation }: ActiveHikePanelProps) {
  const colors = useColors();
  const position = useGpsStore((state) => state.position);
  const selectedPoint = useGpsStore((state) => state.selectedTrailPoint);
  const selectTrailPoint = useGpsStore((state) => state.selectTrailPoint);
  const [selectedKm, setSelectedKm] = useState<number | null>(null);

  // The map marker must not outlive the panel's own selection
  useEffect(() => () => useGpsStore.getState().selectTrailPoint(null), []);

  const distances = elevation.distances_km;
  const totalKm = distances?.[distances.length - 1] ?? 0;
  const trailModel = useMemo(() => buildTrailModel(geoJson, totalKm), [geoJson, totalKm]);

  const currentKm = useMemo(
    () => (position && trailModel ? trailModel.chartKmOfPosition(position) : null),
    [position, trailModel],
  );

  const timeAtKm = (km: number) => interpolateAtKm(distances, elevation.times_min, km);
  const currentMinutes = currentKm !== null ? timeAtKm(currentKm) : null;
  const finishMinutes = timeAtKm(totalKm);
  const remainingKm = currentKm !== null ? Math.max(0, totalKm - currentKm) : null;
  const remainingMinutes =
    currentMinutes !== null && finishMinutes !== null
      ? Math.max(0, finishMinutes - currentMinutes)
      : null;

  const selectedMinutes = selectedKm !== null ? timeAtKm(selectedKm) : null;
  const selectedDeltaKm =
    selectedKm !== null && currentKm !== null ? selectedKm - currentKm : null;
  const selectedDeltaMinutes =
    selectedMinutes !== null && currentMinutes !== null
      ? selectedMinutes - currentMinutes
      : null;

  const handleSelectKm = (km: number) => {
    setSelectedKm(km);
    const coordinate = trailModel?.coordinateAtChartKm(km);
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
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingHorizontal: spacing.medium,
          paddingTop: spacing.small,
        },
        row: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: 24,
        },
        label: {
          fontSize: fontSize.small,
          color: colors.textSecondary,
        },
        value: {
          fontSize: fontSize.body,
          fontWeight: "700",
          color: colors.text,
        },
        selectedValue: {
          fontSize: fontSize.body,
          fontWeight: "700",
          color: "#f97316",
        },
        selectedGroup: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.small,
        },
      }),
    [colors],
  );

  // Selection is only meaningful while the track still has this point
  const hasSelection = selectedKm !== null && selectedPoint !== null;
  if (distances.length === 0) return null;

  const formatDelta = (kilometers: number, minutes: number | null): string => {
    const direction = kilometers >= 0 ? t("active.ahead") : t("active.behind");
    const distanceText = formatDistance(Math.abs(kilometers));
    const durationText =
      minutes === null ? "" : ` · ${formatDuration(Math.abs(minutes))}`;
    return `${distanceText}${durationText} ${direction}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>{t("active.remaining")}</Text>
        <Text style={styles.value}>
          {remainingKm === null
            ? "–"
            : `${formatDistance(remainingKm)}${
                remainingMinutes === null ? "" : ` · ${formatDuration(remainingMinutes)}`
              }`}
        </Text>
      </View>

      {hasSelection && (
        <View style={styles.row}>
          <Text style={styles.label}>
            {t("active.selectedPoint")} · {formatDistance(selectedKm)}
          </Text>
          <View style={styles.selectedGroup}>
            <Text style={styles.selectedValue}>
              {selectedDeltaKm === null
                ? "–"
                : formatDelta(selectedDeltaKm, selectedDeltaMinutes)}
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
        height={PANEL_CHART_HEIGHT}
        currentKm={currentKm}
        selectedKm={selectedKm}
        onSelectKm={handleSelectKm}
      />
    </View>
  );
}
