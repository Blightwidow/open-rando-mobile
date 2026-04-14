import { StyleSheet, View } from "react-native";
import MapLibreGL from "@maplibre/maplibre-react-native";
import { TILE_STYLE_URL } from "@/lib/constants";
import { colors } from "@/lib/theme";
import type { PointOfInterest } from "@/lib/types";

const poiMarkerColors: Record<string, string> = {
  train_station: colors.primary,
  bus_stop: colors.primaryLight,
  camping: colors.success,
  hotel: "#6c757d",
};

interface TrailMapProps {
  geoJson: unknown;
  bbox: [number, number, number, number];
  pois?: PointOfInterest[];
}

export function TrailMap({ geoJson, bbox, pois }: TrailMapProps) {
  const bounds = {
    ne: [bbox[2], bbox[3]] as [number, number],
    sw: [bbox[0], bbox[1]] as [number, number],
    paddingTop: 40,
    paddingBottom: 40,
    paddingLeft: 40,
    paddingRight: 40,
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
        <MapLibreGL.Camera bounds={bounds} animationDuration={0} />

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

        {pois?.map((poi, index) => (
          <MapLibreGL.PointAnnotation
            key={`poi-${index}`}
            id={`poi-${index}`}
            coordinate={[poi.lon, poi.lat]}
            title={poi.name}
          >
            <View
              style={[
                styles.marker,
                { backgroundColor: poiMarkerColors[poi.poi_type] ?? colors.primary },
              ]}
            />
          </MapLibreGL.PointAnnotation>
        ))}
      </MapLibreGL.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 300,
    borderRadius: 12,
    overflow: "hidden",
  },
  map: {
    flex: 1,
  },
  marker: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#fff",
  },
});
