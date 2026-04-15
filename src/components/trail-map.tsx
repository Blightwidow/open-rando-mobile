import { useMemo, useRef, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import MapLibreGL from "@maplibre/maplibre-react-native";
import { TILE_STYLE_URL } from "@/lib/constants";
import { colors, fontSize, spacing, borderRadius } from "@/lib/theme";
import { useColors } from "@/hooks/use-colors";
import { t } from "@/lib/i18n";
import { formatDistance } from "@/lib/format";
import type { GpsPosition } from "@/stores/gps-store";
import type { PointOfInterest } from "@/lib/types";

interface SelectedPoi {
  name: string;
  poiType: string;
  url: string;
  hasDirectUrl: boolean;
  distanceKm: number;
}

function buildPoiUrl(poi: PointOfInterest): { url: string; hasDirectUrl: boolean } {
  if (poi.url) {
    return { url: poi.url, hasDirectUrl: true };
  }
  const query = encodeURIComponent(poi.name);
  return {
    url: `https://maps.google.com/?q=${query}`,
    hasDirectUrl: false,
  };
}

const POI_COLOR_STOPS: [string, string][] = [
  ["train_station", "#22c55e"],
  ["bus_stop", "#3b82f6"],
  ["camping", "#f59e0b"],
  ["hotel", "#a855f7"],
];

const GPS_DOT_COLOR = "#007AFF";
const GPS_ACCURACY_COLOR = "rgba(0,122,255,0.15)";

interface TrailMapProps {
  geoJson: unknown;
  bbox: [number, number, number, number];
  pois?: PointOfInterest[];
  userPosition?: GpsPosition | null;
  followUserLocation?: boolean;
  style?: ViewStyle;
  onPoiPanelHeightChange?: (height: number) => void;
}

export function TrailMap({
  geoJson,
  bbox,
  pois,
  userPosition,
  followUserLocation,
  style,
  onPoiPanelHeightChange,
}: TrailMapProps) {
  const themeColors = useColors();
  const cameraRef = useRef<MapLibreGL.CameraRef>(null);
  const [selectedPoi, setSelectedPoi] = useState<SelectedPoi | null>(null);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          height: 300,
          borderRadius: 12,
          overflow: "hidden",
        },
        map: {
          flex: 1,
        },
        recenterButton: {
          position: "absolute",
          bottom: 16,
          right: 16,
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: themeColors.surface,
          justifyContent: "center",
          alignItems: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 4,
        },
        legend: {
          position: "absolute",
          top: 8,
          left: 8,
          backgroundColor: `${themeColors.surface}E6`,
          borderRadius: borderRadius.small,
          paddingHorizontal: spacing.small,
          paddingVertical: spacing.extraSmall,
          gap: 2,
        },
        legendItem: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
        },
        legendDot: {
          width: 10,
          height: 10,
          borderRadius: 5,
          borderWidth: 1.5,
          borderColor: "#ffffff",
        },
        legendLabel: {
          fontSize: fontSize.small,
          color: themeColors.text,
        },
        poiPanel: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: themeColors.surface,
          borderTopLeftRadius: borderRadius.medium,
          borderTopRightRadius: borderRadius.medium,
          padding: spacing.medium,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.12,
          shadowRadius: 6,
          elevation: 8,
        },
        poiPanelHeader: {
          flexDirection: "row",
          alignItems: "flex-start",
          gap: spacing.small,
        },
        poiPanelInfo: {
          flex: 1,
        },
        poiPanelName: {
          fontSize: fontSize.subtitle,
          fontWeight: "700",
          color: themeColors.text,
        },
        poiPanelType: {
          fontSize: fontSize.small,
          color: themeColors.textSecondary,
          marginTop: 2,
        },
        poiPanelLink: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          marginTop: spacing.small,
        },
        poiPanelLinkText: {
          fontSize: fontSize.body,
          color: themeColors.primary,
        },
      }),
    [themeColors],
  );
  const bounds = {
    ne: [bbox[2], bbox[3]] as [number, number],
    sw: [bbox[0], bbox[1]] as [number, number],
    paddingTop: 40,
    paddingBottom: 40,
    paddingLeft: 40,
    paddingRight: 40,
  };

  const poisGeoJson = useMemo(() => {
    if (!pois || pois.length === 0) return null;
    return {
      type: "FeatureCollection" as const,
      features: pois.map((poi) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [poi.lon, poi.lat],
        },
        properties: {
          poiType: poi.poi_type,
          name: poi.name,
          distanceKm: poi.distance_km,
          ...buildPoiUrl(poi),
        },
      })),
    };
  }, [pois]);

  const gpsPointGeoJson = useMemo(() => {
    if (!userPosition) return null;
    return {
      type: "FeatureCollection" as const,
      features: [
        {
          type: "Feature" as const,
          geometry: {
            type: "Point" as const,
            coordinates: [userPosition.longitude, userPosition.latitude],
          },
          properties: {
            accuracy: userPosition.accuracy,
          },
        },
      ],
    };
  }, [userPosition]);

  const handlePoiPress = (
    event: Parameters<
      NonNullable<React.ComponentProps<typeof MapLibreGL.ShapeSource>["onPress"]>
    >[0],
  ) => {
    const feature = event.features?.[0];
    if (!feature?.properties) return;
    const props = feature.properties as Record<string, unknown>;
    setSelectedPoi({
      name: String(props.name ?? ""),
      poiType: String(props.poiType ?? ""),
      url: String(props.url ?? ""),
      hasDirectUrl: Boolean(props.hasDirectUrl),
      distanceKm: Number(props.distanceKm ?? 0),
    });
  };

  const handleRecenter = () => {
    if (userPosition && cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [userPosition.longitude, userPosition.latitude],
        zoomLevel: 14,
        animationDuration: 500,
      });
    }
  };

  return (
    <View style={[styles.container, style]}>
      <MapLibreGL.MapView
        style={styles.map}
        mapStyle={TILE_STYLE_URL}
        logoEnabled={false}
        attributionEnabled={true}
        attributionPosition={{ bottom: 8, right: 8 }}
        onPress={() => {
          setSelectedPoi(null);
          onPoiPanelHeightChange?.(0);
        }}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          bounds={followUserLocation && userPosition ? undefined : bounds}
          centerCoordinate={
            followUserLocation && userPosition
              ? [userPosition.longitude, userPosition.latitude]
              : undefined
          }
          zoomLevel={followUserLocation && userPosition ? 14 : undefined}
          animationDuration={0}
        />

        <MapLibreGL.ShapeSource
          id="trail-source"
          shape={geoJson as GeoJSON.FeatureCollection}
        >
          <MapLibreGL.LineLayer
            id="trail-line-casing"
            style={{
              lineColor: "#ffffff",
              lineWidth: 5,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
          <MapLibreGL.LineLayer
            id="trail-line"
            style={{
              lineColor: colors.trailLine,
              lineWidth: 3,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        </MapLibreGL.ShapeSource>

        {gpsPointGeoJson && (
          <MapLibreGL.ShapeSource id="gps-source" shape={gpsPointGeoJson}>
            <MapLibreGL.CircleLayer
              id="gps-accuracy-ring"
              style={{
                circleRadius: 30,
                circleColor: GPS_ACCURACY_COLOR,
                circleOpacity: 1,
                circlePitchAlignment: "map",
              }}
            />
            <MapLibreGL.CircleLayer
              id="gps-dot"
              style={{
                circleRadius: 7,
                circleColor: GPS_DOT_COLOR,
                circleStrokeColor: "#ffffff",
                circleStrokeWidth: 2,
                circlePitchAlignment: "map",
              }}
            />
          </MapLibreGL.ShapeSource>
        )}

        {poisGeoJson && (
          <MapLibreGL.ShapeSource
            id="pois-source"
            shape={poisGeoJson}
            onPress={handlePoiPress}
          >
            <MapLibreGL.CircleLayer
              id="pois-circles"
              style={{
                circleRadius: 7,
                circleColor: [
                  "match",
                  ["get", "poiType"],
                  ...POI_COLOR_STOPS.flat(),
                  colors.primary,
                ] as unknown as string,
                circleStrokeColor: "#ffffff",
                circleStrokeWidth: 2,
              }}
            />
          </MapLibreGL.ShapeSource>
        )}
      </MapLibreGL.MapView>

      {userPosition && (
        <Pressable style={styles.recenterButton} onPress={handleRecenter}>
          <Ionicons name="locate" size={22} color={GPS_DOT_COLOR} />
        </Pressable>
      )}

      {poisGeoJson && (
        <View style={styles.legend}>
          {POI_COLOR_STOPS.map(([poiType, color]) => (
            <View key={poiType} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: color }]} />
              <Text style={styles.legendLabel}>{t(`poi.${poiType}`)}</Text>
            </View>
          ))}
        </View>
      )}

      {selectedPoi && (
        <View
          style={styles.poiPanel}
          onLayout={(event) => onPoiPanelHeightChange?.(event.nativeEvent.layout.height)}
        >
          <View style={styles.poiPanelHeader}>
            <View style={styles.poiPanelInfo}>
              <Text style={styles.poiPanelName}>{selectedPoi.name}</Text>
              <Text style={styles.poiPanelType}>
                {t(`poi.${selectedPoi.poiType}`)} ·{" "}
                {formatDistance(selectedPoi.distanceKm)} {t("poi.distanceFromStart")}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                setSelectedPoi(null);
                onPoiPanelHeightChange?.(0);
              }}
              hitSlop={8}
            >
              <Ionicons name="close" size={20} color={themeColors.textSecondary} />
            </Pressable>
          </View>
          <Pressable
            style={styles.poiPanelLink}
            onPress={() => Linking.openURL(selectedPoi.url)}
          >
            <Ionicons name="open-outline" size={14} color={themeColors.primary} />
            <Text style={styles.poiPanelLinkText}>
              {selectedPoi.hasDirectUrl ? t("poi.viewLink") : t("poi.findOnMaps")}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
