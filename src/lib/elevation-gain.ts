// Same rule as the backend (open-rando pipeline/processors/elevation.py, _compute_gain_loss)
const ELEVATION_NOISE_THRESHOLD_METERS = 5;

/**
 * Cumulative ascent and descent, with sampling oscillation filtered out.
 * Elevations are walked as monotone runs: consecutive deltas of the same sign accumulate,
 * and a run is committed when the direction reverses, but only once it reaches the noise
 * threshold. A smaller run is absorbed into the new direction.
 * Meant for 50 m samples (see `resampleEvery50Meters`).
 */
export function computeGainLoss(elevationsMeters: number[]): {
  gain: number;
  loss: number;
} {
  if (elevationsMeters.length < 2) return { gain: 0, loss: 0 };

  let totalGain = 0;
  let totalLoss = 0;
  let run = 0;

  for (let index = 1; index < elevationsMeters.length; index += 1) {
    const delta = elevationsMeters[index] - elevationsMeters[index - 1];
    if (delta === 0) continue;

    const sameDirection = run === 0 || run > 0 === delta > 0;
    if (sameDirection) {
      run += delta;
      continue;
    }

    if (Math.abs(run) >= ELEVATION_NOISE_THRESHOLD_METERS) {
      if (run > 0) totalGain += run;
      else totalLoss += -run;
      run = delta;
    } else {
      run += delta;
    }
  }

  if (run >= ELEVATION_NOISE_THRESHOLD_METERS) totalGain += run;
  else if (run <= -ELEVATION_NOISE_THRESHOLD_METERS) totalLoss += -run;

  return { gain: Math.round(totalGain), loss: Math.round(totalLoss) };
}
