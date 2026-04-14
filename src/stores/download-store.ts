import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DownloadState, Route } from "@/lib/types";
import {
  downloadRouteData,
  deleteRouteData,
  isRouteDownloaded,
} from "@/services/offline-storage";

interface DownloadStore {
  downloads: Record<string, DownloadState>;
  startDownload: (route: Route) => Promise<void>;
  removeDownload: (routeId: string) => void;
  verifyDownload: (routeId: string) => boolean;
  getDownloadState: (routeId: string) => DownloadState;
}

const defaultState: DownloadState = { status: "idle", progress: 0 };

export const useDownloadStore = create<DownloadStore>()(
  persist(
    (set, get) => ({
      downloads: {},

      getDownloadState: (routeId: string): DownloadState => {
        return get().downloads[routeId] ?? defaultState;
      },

      startDownload: async (route: Route) => {
        set((state) => ({
          downloads: {
            ...state.downloads,
            [route.id]: { status: "downloading", progress: 0 },
          },
        }));

        try {
          await downloadRouteData(route, (progress) => {
            set((state) => ({
              downloads: {
                ...state.downloads,
                [route.id]: { status: "downloading", progress },
              },
            }));
          });

          set((state) => ({
            downloads: {
              ...state.downloads,
              [route.id]: { status: "complete", progress: 1 },
            },
          }));
        } catch (error) {
          set((state) => ({
            downloads: {
              ...state.downloads,
              [route.id]: {
                status: "error",
                progress: 0,
                error: error instanceof Error ? error.message : "Download failed",
              },
            },
          }));
        }
      },

      removeDownload: (routeId: string) => {
        deleteRouteData(routeId);
        set((state) => {
          const { [routeId]: _, ...remaining } = state.downloads;
          return { downloads: remaining };
        });
      },

      verifyDownload: (routeId: string): boolean => {
        const stored = get().downloads[routeId];
        if (stored?.status !== "complete") return false;

        const exists = isRouteDownloaded(routeId);
        if (!exists) {
          set((state) => {
            const { [routeId]: _, ...remaining } = state.downloads;
            return { downloads: remaining };
          });
        }
        return exists;
      },
    }),
    {
      name: "download-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ downloads: state.downloads }),
    },
  ),
);
