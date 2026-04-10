export function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  if (hours === 0) return `${minutes}min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h${String(minutes).padStart(2, "0")}`;
}

export function formatDistance(kilometers: number): string {
  return `${kilometers.toFixed(1)} km`;
}

export function formatElevation(meters: number): string {
  return `${Math.round(meters)} m`;
}
