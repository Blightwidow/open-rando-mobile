import { useCallback, useEffect, useState } from "react";
import { type PermissionStatus } from "expo-location";
import {
  getLocationPermissionStatus,
  requestLocationPermission,
} from "@/services/location-service";

type LocationPermissionStatus = "undetermined" | "granted" | "denied";

function mapStatus(status: PermissionStatus): LocationPermissionStatus {
  if (status === "granted") return "granted";
  if (status === "denied") return "denied";
  return "undetermined";
}

export function useLocationPermission() {
  const [status, setStatus] = useState<LocationPermissionStatus>("undetermined");

  useEffect(() => {
    getLocationPermissionStatus().then((permissionStatus) => {
      setStatus(mapStatus(permissionStatus));
    });
  }, []);

  const request = useCallback(async (): Promise<boolean> => {
    const granted = await requestLocationPermission();
    setStatus(granted ? "granted" : "denied");
    return granted;
  }, []);

  return { status, request };
}
