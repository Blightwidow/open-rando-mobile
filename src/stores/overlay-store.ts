import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { defaultVisibleOverlayGroups, type OverlayGroupKey } from "@/lib/overlay";

interface OverlayState {
  /** Master switch: when off, the overlay source is not added to the map at all. */
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  /** Groups drawn on the map. Unknown keys from other versions are ignored on read. */
  visibleGroups: OverlayGroupKey[];
  toggleGroup: (group: OverlayGroupKey) => void;
  /** Bumped when the offline overlay file is downloaded or removed, to refresh readers. */
  offlineRevision: number;
  bumpOfflineRevision: () => void;
}

export const useOverlayStore = create<OverlayState>()(
  persist(
    (set) => ({
      enabled: true,
      setEnabled: (enabled) => set({ enabled }),
      visibleGroups: defaultVisibleOverlayGroups(),
      toggleGroup: (group) =>
        set((state) => {
          const current = state.visibleGroups ?? [];
          return {
            visibleGroups: current.includes(group)
              ? current.filter((key) => key !== group)
              : [...current, group],
          };
        }),
      offlineRevision: 0,
      bumpOfflineRevision: () =>
        set((state) => ({ offlineRevision: state.offlineRevision + 1 })),
    }),
    {
      name: "overlay-storage",
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        enabled: state.enabled,
        visibleGroups: state.visibleGroups,
      }),
    },
  ),
);
