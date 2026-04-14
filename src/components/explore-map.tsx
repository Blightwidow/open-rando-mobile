import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import MapLibreGL, { type OnPressEvent } from "@maplibre/maplibre-react-native";
import { TILE_STYLE_URL } from "@/lib/constants";
import { colors } from "@/lib/theme";
import { bboxCenter } from "@/lib/geo";
import type { Route } from "@/lib/types";

const difficultyColorStops: [string, string][] = [
  ["easy", colors.easy],
  ["moderate", colors.moderate],
  ["difficult", colors.difficult],
  ["very_difficult", colors.veryDifficult],
];

const FRANCE_CENTER: [number, number] = [2.2, 46.6];
const FRANCE_ZOOM = 5;

interface ExploreMapProps {
  routes: Route[];
}

export function ExploreMap({ routes }: ExploreMapProps) {
  const router = useRouter();

  const geoJson = useMemo(() => {
    const features = routes.map((route) => {
      const center = bboxCenter(route.bbox);
      return {
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: center,
        },
        properties: {
          slug: route.slug,
          pathRef: route.path_ref,
          pathName: route.path_name,
          difficulty: route.difficulty,
        },
      };
    });
    return {
      type: "FeatureCollection" as const,
      features,
    };
  }, [routes]);

  const handleMarkerPress = (event: OnPressEvent) => {
    const slug = event.features[0]?.properties?.slug as string | undefined;
    if (slug) {
      router.push(`/explore/${slug}`);
    }
  };

  return (
    <View style={styles.container}>
      <MapLibreGL.MapView
        style={styles.map}
        mapStyle={TILE_STYLE_URL}
        logoEnabled={false}
        attributionEnabled={true}
        attributionPosition={{ bottom: 8, right: 8 }}
      >
        <MapLibreGL.Camera
          defaultSettings={{
            centerCoordinate: FRANCE_CENTER,
            zoomLevel: FRANCE_ZOOM,
          }}
        />

        <MapLibreGL.ShapeSource
          id="routes-source"
          shape={geoJson}
          onPress={handleMarkerPress}
        >
          <MapLibreGL.CircleLayer
            id="routes-circles"
            style={{
              circleRadius: 6,
              circleColor: [
                "match",
                ["get", "difficulty"],
                ...difficultyColorStops.flat(),
                colors.primary,
              ] as unknown as string,
              circleStrokeColor: "#ffffff",
              circleStrokeWidth: 2,
              circleOpacity: 0.9,
            }}
          />
        </MapLibreGL.ShapeSource>
      </MapLibreGL.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});
