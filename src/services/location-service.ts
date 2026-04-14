import * as Location from "expo-location";

const MAXIMUM_ACCEPTABLE_ACCURACY_METERS = 50;
const LOCATION_UPDATE_INTERVAL_MILLISECONDS = 5000;
const MINIMUM_DISTANCE_CHANGE_METERS = 10;

export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === "granted";
}

export async function getLocationPermissionStatus(): Promise<Location.PermissionStatus> {
  const { status } = await Location.getForegroundPermissionsAsync();
  return status;
}

export async function startLocationWatching(
  onUpdate: (location: Location.LocationObject) => void,
): Promise<Location.LocationSubscription> {
  return Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: LOCATION_UPDATE_INTERVAL_MILLISECONDS,
      distanceInterval: MINIMUM_DISTANCE_CHANGE_METERS,
    },
    onUpdate,
  );
}

export function isPositionReliable(location: Location.LocationObject): boolean {
  const accuracy = location.coords.accuracy;
  if (accuracy === null || accuracy === undefined) return false;
  return accuracy <= MAXIMUM_ACCEPTABLE_ACCURACY_METERS;
}
