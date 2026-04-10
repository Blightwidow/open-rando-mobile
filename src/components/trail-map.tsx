import { StyleSheet, View } from "react-native";
import MapLibreGL from "@maplibre/maplibre-react-native";
import { TILE_STYLE_URL } from "@/lib/constants";
import { colors } from "@/lib/theme";

interface TrailMapProps {
  geoJson: unknown;
  bbox: [number, number, number, number];
  startStation?: { lat: number; lon: number; name: string };
  endStation?: { lat: number; lon: number; name: string };
}

export function TrailMap({
  geoJson,
  bbox,
  startStation,
  endStation,
}: TrailMapProps) {
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
        <MapLibreGL.Camera
          bounds={bounds}
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

        {startStation && (
          <MapLibreGL.PointAnnotation
            id="start-station"
            coordinate={[startStation.lon, startStation.lat]}
            title={startStation.name}
          >
            <View style={[styles.marker, styles.startMarker]} />
          </MapLibreGL.PointAnnotation>
        )}

        {endStation && (
          <MapLibreGL.PointAnnotation
            id="end-station"
            coordinate={[endStation.lon, endStation.lat]}
            title={endStation.name}
          >
            <View style={[styles.marker, styles.endMarker]} />
          </MapLibreGL.PointAnnotation>
        )}
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
  startMarker: {
    backgroundColor: colors.startMarker,
  },
  endMarker: {
    backgroundColor: colors.endMarker,
  },
});
