import { useMemo, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useGpsStore } from "@/stores/gps-store";
import { useDownloadStore } from "@/stores/download-store";
import { useActiveHike } from "@/hooks/use-active-hike";
import { useOfflineRoute } from "@/hooks/use-offline-route";
import { TrailMap } from "@/components/trail-map";
import { spacing, fontSize, borderRadius } from "@/lib/theme";
import { useColors } from "@/hooks/use-colors";
import { t } from "@/lib/i18n";
import { useLocale } from "@/hooks/use-locale";

export default function FollowRouteScreen() {
  useLocale();
  useActiveHike();
  const colors = useColors();

  const router = useRouter();
  const isTracking = useGpsStore((state) => state.isTracking);
  const position = useGpsStore((state) => state.position);
  const activeRouteSlug = useGpsStore((state) => state.activeRouteSlug);
  const stopFollowing = useGpsStore((state) => state.stopFollowing);

  const activeRouteId = useGpsStore((state) => state.activeRouteId);
  const downloadMapStyle = useDownloadStore((state) =>
    activeRouteId ? state.getDownloadState(activeRouteId).mapStyle : undefined,
  );
  const { route, geoJson } = useOfflineRoute(activeRouteSlug ?? "");
  const [poiPanelHeight, setPoiPanelHeight] = useState(0);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
        },
        fullScreenMap: {
          flex: 1,
          height: undefined,
          borderRadius: 0,
        },
        searchingBanner: {
          position: "absolute",
          top: 60,
          left: spacing.medium,
          right: spacing.medium,
          backgroundColor: colors.surface,
          borderRadius: borderRadius.medium,
          padding: spacing.small,
          alignItems: "center",
          borderWidth: 1,
          borderColor: colors.border,
        },
        searchingText: {
          fontSize: fontSize.body,
          color: colors.textSecondary,
        },
        stopButton: {
          position: "absolute",
          left: 16,
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: colors.error,
          justifyContent: "center",
          alignItems: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 4,
        },
      }),
    [colors],
  );

  useEffect(() => {
    if (!isTracking) {
      router.replace("/explore");
    }
  }, [isTracking, router]);

  if (!isTracking || !route || geoJson == null) {
    return null;
  }

  return (
    <View style={styles.container}>
      <TrailMap
        geoJson={geoJson}
        bbox={route.bbox}
        pois={route.pois}
        userPosition={position}
        followUserLocation={true}
        mapStyle={downloadMapStyle}
        routeId={route.id}
        showScaleBar={true}
        style={styles.fullScreenMap}
        onPoiPanelHeightChange={setPoiPanelHeight}
      />

      {!position && (
        <View style={styles.searchingBanner}>
          <Text style={styles.searchingText}>{t("gps.searching")}</Text>
        </View>
      )}

      <Pressable
        style={[styles.stopButton, { bottom: 16 + poiPanelHeight }]}
        onPress={stopFollowing}
      >
        <Ionicons name="stop" size={22} color="#fff" />
      </Pressable>
    </View>
  );
}
