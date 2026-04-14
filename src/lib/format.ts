export function formatDistance(kilometers: number): string {
  return `${kilometers.toFixed(1)} km`;
}

export function formatElevation(meters: number): string {
  return `${Math.round(meters)} m`;
}

export function formatElapsedTime(startTimestamp: number): string {
  const elapsedMilliseconds = Date.now() - startTimestamp;
  const totalSeconds = Math.floor(elapsedMilliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  }
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}
