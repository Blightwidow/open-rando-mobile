import { useEffect, useRef } from "react";
import type { LocationSubscription } from "expo-location";
import { useGpsStore } from "@/stores/gps-store";
import { startLocationWatching, isPositionReliable } from "@/services/location-service";

/**
 * Manages the GPS subscription lifecycle for the active hike screen.
 * Starts watching when the component mounts (and isTracking is true),
 * stops when unmounted or tracking ends.
 */
export function useActiveHike() {
  const isTracking = useGpsStore((state) => state.isTracking);
  const updatePosition = useGpsStore((state) => state.updatePosition);
  const subscriptionRef = useRef<LocationSubscription | null>(null);

  useEffect(() => {
    if (!isTracking) return;

    let cancelled = false;

    startLocationWatching((location) => {
      if (cancelled) return;
      if (!isPositionReliable(location)) return;

      updatePosition(
        location.coords.latitude,
        location.coords.longitude,
        location.coords.accuracy ?? 0,
      );
    }).then((subscription) => {
      if (cancelled) {
        subscription.remove();
      } else {
        subscriptionRef.current = subscription;
      }
    });

    return () => {
      cancelled = true;
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
    };
  }, [isTracking, updatePosition]);
}
