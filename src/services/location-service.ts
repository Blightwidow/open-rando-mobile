import * as Location from "expo-location";
import { logInfo } from "@/lib/logger";

const MAXIMUM_ACCEPTABLE_ACCURACY_METERS = 50;

export type GpsPollingMode = "precise" | "balanced" | "saver";

export const DEFAULT_GPS_POLLING_MODE: GpsPollingMode = "balanced";

interface PollingConfiguration {
  accuracy: Location.Accuracy;
  timeIntervalMilliseconds: number;
  distanceIntervalMeters: number;
}

// Foreground only: background location is disabled in app.json, so nothing polls once the
// app is backgrounded. These values drive the screen-on battery cost.
export const POLLING_CONFIGURATIONS: Record<GpsPollingMode, PollingConfiguration> = {
  precise: {
    accuracy: Location.Accuracy.High,
    timeIntervalMilliseconds: 3000,
    distanceIntervalMeters: 5,
  },
  balanced: {
    accuracy: Location.Accuracy.High,
    timeIntervalMilliseconds: 10000,
    distanceIntervalMeters: 20,
  },
  saver: {
    accuracy: Location.Accuracy.Balanced,
    timeIntervalMilliseconds: 30000,
    distanceIntervalMeters: 50,
  },
};

export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  logInfo("location", `Permission request result: ${status}`);
  return status === "granted";
}

export async function getLocationPermissionStatus(): Promise<Location.PermissionStatus> {
  const { status } = await Location.getForegroundPermissionsAsync();
  return status;
}

export async function startLocationWatching(
  onUpdate: (location: Location.LocationObject) => void,
  pollingMode: GpsPollingMode = DEFAULT_GPS_POLLING_MODE,
): Promise<Location.LocationSubscription> {
  const configuration = POLLING_CONFIGURATIONS[pollingMode];
  logInfo(
    "location",
    `Starting location watching (mode=${pollingMode}, ${configuration.timeIntervalMilliseconds}ms, ${configuration.distanceIntervalMeters}m)`,
  );
  return Location.watchPositionAsync(
    {
      accuracy: configuration.accuracy,
      timeInterval: configuration.timeIntervalMilliseconds,
      distanceInterval: configuration.distanceIntervalMeters,
    },
    onUpdate,
  );
}

export function isPositionReliable(location: Location.LocationObject): boolean {
  const accuracy = location.coords.accuracy;
  if (accuracy === null || accuracy === undefined) return false;
  return accuracy <= MAXIMUM_ACCEPTABLE_ACCURACY_METERS;
}
