import { interpolateAtKm } from "@/lib/trail-progress";

// Same rules as the backend (open-rando pipeline/processors/elevation.py)
const SAMPLE_INTERVAL_KM = 0.05;
const FLAT_SPEED_KM_PER_HOUR = 4;
const SLOPE_THRESHOLD = 0.1;
const ASCENT_METERS_PER_HOUR = 300;
const DESCENT_METERS_PER_HOUR = 450;

/** Elevation sampled every 50 m along the track, plus the last point (as the backend does). */
export function resampleEvery50Meters(
  distancesKm: number[],
  elevationsMeters: number[],
): { distancesKm: number[]; elevationsMeters: number[] } {
  const totalKm = distancesKm[distancesKm.length - 1] ?? 0;
  const sampleDistances: number[] = [];
  for (let sampleKm = 0; sampleKm <= totalKm; sampleKm += SAMPLE_INTERVAL_KM) {
    sampleDistances.push(sampleKm);
  }
  if (totalKm - (sampleDistances[sampleDistances.length - 1] ?? 0) >= 0.001) {
    sampleDistances.push(totalKm);
  }
  return {
    distancesKm: sampleDistances,
    elevationsMeters: sampleDistances.map(
      (sampleKm) => interpolateAtKm(distancesKm, elevationsMeters, sampleKm) ?? 0,
    ),
  };
}

function cumulativeMinutes(distancesKm: number[], elevationsMeters: number[]): number[] {
  const cumulative: number[] = [0];
  for (let index = 1; index < distancesKm.length; index += 1) {
    const horizontalKm = distancesKm[index] - distancesKm[index - 1];
    const elevationDelta = elevationsMeters[index] - elevationsMeters[index - 1];
    const slope = horizontalKm > 0 ? Math.abs(elevationDelta) / (horizontalKm * 1000) : 0;

    let segmentHours: number;
    if (slope >= SLOPE_THRESHOLD && elevationDelta > 0) {
      segmentHours = elevationDelta / ASCENT_METERS_PER_HOUR;
    } else if (slope >= SLOPE_THRESHOLD && elevationDelta < 0) {
      segmentHours = Math.abs(elevationDelta) / DESCENT_METERS_PER_HOUR;
    } else {
      segmentHours = horizontalKm / FLAT_SPEED_KM_PER_HOUR;
    }
    cumulative.push(cumulative[index - 1] + segmentHours * 60);
  }
  return cumulative;
}

/**
 * Cumulative walking time in minutes at each point, using the backend's rule on 50 m
 * samples: flat (slope < 10%) 4 km/h, steeper uphill 300 m/h, steeper downhill 450 m/h.
 * Returned at the input points, so it lines up with the profile it is stored beside.
 */
export function computeWalkingTimesMinutes(
  distancesKm: number[],
  elevationsMeters: number[],
): number[] {
  if (distancesKm.length < 2) return distancesKm.map(() => 0);
  const samples = resampleEvery50Meters(distancesKm, elevationsMeters);
  const sampleMinutes = cumulativeMinutes(samples.distancesKm, samples.elevationsMeters);
  return distancesKm.map(
    (pointKm) => interpolateAtKm(samples.distancesKm, sampleMinutes, pointKm) ?? 0,
  );
}
