import { haversineDistance, progressAlongTrail } from "@/lib/geo";
import { extractLineStrings } from "@/lib/geometry";

type Coordinate = [number, number];

export interface TrailModel {
  /** Position on the elevation chart's distance axis, in km. */
  chartKmOfPosition: (position: { latitude: number; longitude: number }) => number;
  /** Map coordinate [longitude, latitude] at a given chart distance, in km. */
  coordinateAtChartKm: (chartKm: number) => Coordinate | null;
}

/**
 * Links the track geometry to the elevation chart. The chart's distance axis may be
 * sampled slightly differently from the geometry, so both are rescaled to the same total.
 */
export function buildTrailModel(
  geoJson: unknown,
  chartTotalKm: number,
): TrailModel | null {
  const coordinates = extractLineStrings(geoJson).flat();
  if (coordinates.length < 2) return null;

  const cumulativeMeters: number[] = [0];
  for (let index = 1; index < coordinates.length; index += 1) {
    const previous = coordinates[index - 1]!;
    const current = coordinates[index]!;
    cumulativeMeters.push(
      cumulativeMeters[index - 1]! +
        haversineDistance(previous[1], previous[0], current[1], current[0]),
    );
  }
  const geometryTotalKm = cumulativeMeters[cumulativeMeters.length - 1]! / 1000;
  if (geometryTotalKm === 0) return null;
  const geometryKmPerChartKm = chartTotalKm > 0 ? geometryTotalKm / chartTotalKm : 1;

  return {
    chartKmOfPosition: (position) =>
      progressAlongTrail(position, coordinates) / geometryKmPerChartKm,
    coordinateAtChartKm: (chartKm) => {
      const targetMeters =
        Math.max(0, Math.min(chartKm * geometryKmPerChartKm, geometryTotalKm)) * 1000;
      let upperIndex = 1;
      while (
        upperIndex < cumulativeMeters.length - 1 &&
        cumulativeMeters[upperIndex]! < targetMeters
      ) {
        upperIndex += 1;
      }
      const lowerMeters = cumulativeMeters[upperIndex - 1]!;
      const segmentMeters = cumulativeMeters[upperIndex]! - lowerMeters;
      const fraction =
        segmentMeters === 0 ? 0 : (targetMeters - lowerMeters) / segmentMeters;
      const lower = coordinates[upperIndex - 1]!;
      const upper = coordinates[upperIndex]!;
      return [
        lower[0] + (upper[0] - lower[0]) * fraction,
        lower[1] + (upper[1] - lower[1]) * fraction,
      ];
    },
  };
}

/**
 * Linear interpolation of a series sampled at ascending distances. Null when the series is
 * empty or does not match the distances (e.g. GPX without elevation has no times).
 */
export function interpolateAtKm(
  distancesKm: number[],
  values: number[],
  km: number,
): number | null {
  if (distancesKm.length === 0 || values.length !== distancesKm.length) return null;
  if (km <= distancesKm[0]!) return values[0]!;
  const lastIndex = distancesKm.length - 1;
  if (km >= distancesKm[lastIndex]!) return values[lastIndex]!;

  let upperIndex = 1;
  while (distancesKm[upperIndex]! < km) upperIndex += 1;
  const lowerKm = distancesKm[upperIndex - 1]!;
  const spanKm = distancesKm[upperIndex]! - lowerKm;
  const fraction = spanKm === 0 ? 0 : (km - lowerKm) / spanKm;
  return (
    values[upperIndex - 1]! + (values[upperIndex]! - values[upperIndex - 1]!) * fraction
  );
}
