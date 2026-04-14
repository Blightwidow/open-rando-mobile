import { useMemo, useState, useRef } from "react";
import { StyleSheet, View, useWindowDimensions, PanResponder, Text } from "react-native";
import Svg, { Path, Line, Rect, G, Text as SvgText } from "react-native-svg";
import { colors, spacing, fontSize as themeFontSize } from "@/lib/theme";
import type { ElevationProfile } from "@/lib/types";

const PADDING_LEFT = 45;
const PADDING_RIGHT = 10;
const PADDING_TOP = 15;
const PADDING_BOTTOM = 30;
const CHART_HEIGHT = 200;
const AXIS_LABEL_COUNT = 5;

interface ElevationChartProps {
  elevation: ElevationProfile;
}

export function ElevationChart({ elevation }: ElevationChartProps) {
  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = screenWidth - 2 * spacing.medium;
  const [cursorIndex, setCursorIndex] = useState<number | null>(null);

  const { distances, elevations, stationPositions } = elevation.distances_km
    ? {
        distances: elevation.distances_km,
        elevations: elevation.elevations_m,
        stationPositions: elevation.station_positions_km,
      }
    : {
        distances: [] as number[],
        elevations: [] as number[],
        stationPositions: [] as number[],
      };

  const { minElevation, maxElevation, maxDistance, plotWidth, plotHeight } =
    useMemo(() => {
      if (distances.length === 0) {
        return {
          minElevation: 0,
          maxElevation: 100,
          maxDistance: 1,
          plotWidth: chartWidth - PADDING_LEFT - PADDING_RIGHT,
          plotHeight: CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM,
        };
      }
      const minElev = Math.min(...elevations);
      const maxElev = Math.max(...elevations);
      const range = maxElev - minElev;
      const buffer = Math.max(range * 0.05, 10);
      return {
        minElevation: minElev - buffer,
        maxElevation: maxElev + buffer,
        maxDistance: distances[distances.length - 1] ?? 1,
        plotWidth: chartWidth - PADDING_LEFT - PADDING_RIGHT,
        plotHeight: CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM,
      };
    }, [distances, elevations, chartWidth]);

  const scaleX = (km: number) => PADDING_LEFT + (km / maxDistance) * plotWidth;
  const scaleY = (meters: number) =>
    PADDING_TOP +
    plotHeight -
    ((meters - minElevation) / (maxElevation - minElevation)) * plotHeight;

  const { linePath, areaPath } = useMemo(() => {
    if (distances.length === 0) return { linePath: "", areaPath: "" };

    const toX = (km: number) => PADDING_LEFT + (km / maxDistance) * plotWidth;
    const toY = (meters: number) =>
      PADDING_TOP +
      plotHeight -
      ((meters - minElevation) / (maxElevation - minElevation)) * plotHeight;

    const points = distances.map((distance, index) => ({
      x: toX(distance),
      y: toY(elevations[index]!),
    }));

    const lineSegments = points
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x},${point.y}`)
      .join(" ");

    const bottomY = PADDING_TOP + plotHeight;
    const areaSegments = `${lineSegments} L ${points[points.length - 1]!.x},${bottomY} L ${points[0]!.x},${bottomY} Z`;

    return { linePath: lineSegments, areaPath: areaSegments };
  }, [
    distances,
    elevations,
    plotWidth,
    plotHeight,
    minElevation,
    maxElevation,
    maxDistance,
  ]);

  const xLabels = useMemo(() => {
    const labels: { value: number; label: string }[] = [];
    const step = maxDistance / (AXIS_LABEL_COUNT - 1);
    for (let index = 0; index < AXIS_LABEL_COUNT; index++) {
      const value = step * index;
      labels.push({ value, label: `${value.toFixed(0)}` });
    }
    return labels;
  }, [maxDistance]);

  const yLabels = useMemo(() => {
    const labels: { value: number; label: string }[] = [];
    const range = maxElevation - minElevation;
    const step = range / (AXIS_LABEL_COUNT - 1);
    for (let index = 0; index < AXIS_LABEL_COUNT; index++) {
      const value = minElevation + step * index;
      labels.push({ value, label: `${Math.round(value)}` });
    }
    return labels;
  }, [minElevation, maxElevation]);

  const findNearestIndex = (pixelX: number): number => {
    const km = ((pixelX - PADDING_LEFT) / plotWidth) * maxDistance;
    let nearest = 0;
    let minDiff = Infinity;
    for (let index = 0; index < distances.length; index++) {
      const diff = Math.abs(distances[index]! - km);
      if (diff < minDiff) {
        minDiff = diff;
        nearest = index;
      }
    }
    return nearest;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => {
        const pixelX = event.nativeEvent.locationX;
        if (pixelX >= PADDING_LEFT && pixelX <= PADDING_LEFT + plotWidth) {
          setCursorIndex(findNearestIndex(pixelX));
        }
      },
      onPanResponderMove: (event) => {
        const pixelX = event.nativeEvent.locationX;
        if (pixelX >= PADDING_LEFT && pixelX <= PADDING_LEFT + plotWidth) {
          setCursorIndex(findNearestIndex(pixelX));
        }
      },
      onPanResponderRelease: () => {
        setCursorIndex(null);
      },
      onPanResponderTerminate: () => {
        setCursorIndex(null);
      },
    }),
  ).current;

  if (distances.length === 0) return null;

  const cursorDistance = cursorIndex != null ? distances[cursorIndex]! : null;
  const cursorElevation = cursorIndex != null ? elevations[cursorIndex]! : null;
  const cursorX = cursorDistance != null ? scaleX(cursorDistance) : null;
  const cursorY = cursorElevation != null ? scaleY(cursorElevation) : null;

  return (
    <View style={styles.container}>
      {cursorIndex != null && cursorDistance != null && cursorElevation != null && (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipText}>
            {cursorDistance.toFixed(1)} km · {Math.round(cursorElevation)} m
          </Text>
        </View>
      )}
      <Svg width={chartWidth} height={CHART_HEIGHT} {...panResponder.panHandlers}>
        {/* Area fill */}
        <Path d={areaPath} fill={colors.primary + "20"} />

        {/* Elevation line */}
        <Path d={linePath} stroke={colors.primary} strokeWidth={2} fill="none" />

        {/* Station position markers */}
        {stationPositions.map((positionKm, index) => {
          const stationX = scaleX(positionKm);
          return (
            <Line
              key={`station-${index}`}
              x1={stationX}
              y1={PADDING_TOP}
              x2={stationX}
              y2={PADDING_TOP + plotHeight}
              stroke={colors.textSecondary}
              strokeWidth={1}
              strokeDasharray="4,4"
              opacity={0.5}
            />
          );
        })}

        {/* X-axis labels */}
        {xLabels.map(({ value, label }) => (
          <SvgText
            key={`x-${value}`}
            x={scaleX(value)}
            y={PADDING_TOP + plotHeight + 18}
            textAnchor="middle"
            fontSize={10}
            fill={colors.textSecondary}
          >
            {label}
          </SvgText>
        ))}

        {/* Y-axis labels */}
        {yLabels.map(({ value, label }) => (
          <SvgText
            key={`y-${value}`}
            x={PADDING_LEFT - 5}
            y={scaleY(value) + 3}
            textAnchor="end"
            fontSize={10}
            fill={colors.textSecondary}
          >
            {label}
          </SvgText>
        ))}

        {/* X-axis unit */}
        <SvgText
          x={PADDING_LEFT + plotWidth}
          y={PADDING_TOP + plotHeight + 18}
          textAnchor="end"
          fontSize={10}
          fill={colors.textSecondary}
        >
          km
        </SvgText>

        {/* Y-axis unit */}
        <SvgText
          x={PADDING_LEFT - 5}
          y={PADDING_TOP - 4}
          textAnchor="end"
          fontSize={10}
          fill={colors.textSecondary}
        >
          m
        </SvgText>

        {/* Cursor */}
        {cursorX != null && cursorY != null && (
          <G>
            <Line
              x1={cursorX}
              y1={PADDING_TOP}
              x2={cursorX}
              y2={PADDING_TOP + plotHeight}
              stroke={colors.text}
              strokeWidth={1}
              opacity={0.6}
            />
            <Rect
              x={cursorX - 4}
              y={cursorY - 4}
              width={8}
              height={8}
              rx={4}
              fill={colors.primary}
              stroke="#fff"
              strokeWidth={2}
            />
          </G>
        )}

        {/* Invisible touch target */}
        <Rect
          x={PADDING_LEFT}
          y={PADDING_TOP}
          width={plotWidth}
          height={plotHeight}
          fill="transparent"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  tooltip: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderRadius: 4,
    paddingHorizontal: spacing.small,
    paddingVertical: 2,
    zIndex: 1,
  },
  tooltipText: {
    fontSize: themeFontSize.small,
    color: colors.text,
    fontWeight: "600",
  },
});
