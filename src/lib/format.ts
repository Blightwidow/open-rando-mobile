export function formatDistance(kilometers: number): string {
  return `${kilometers.toFixed(1)} km`;
}

export function formatElevation(meters: number): string {
  return `${Math.round(meters)} m`;
}
