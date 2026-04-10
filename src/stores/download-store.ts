import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DownloadState, Hike } from "@/lib/types";
import {
  downloadHikeData,
  deleteHikeData,
  isHikeDownloaded,
} from "@/services/offline-storage";

interface DownloadStore {
  downloads: Record<string, DownloadState>;
  startDownload: (hike: Hike) => Promise<void>;
  removeDownload: (hikeId: string) => void;
  verifyDownload: (hikeId: string) => boolean;
  getDownloadState: (hikeId: string) => DownloadState;
}

const defaultState: DownloadState = { status: "idle", progress: 0 };

export const useDownloadStore = create<DownloadStore>()(
  persist(
    (set, get) => ({
      downloads: {},

      getDownloadState: (hikeId: string): DownloadState => {
        return get().downloads[hikeId] ?? defaultState;
      },

      startDownload: async (hike: Hike) => {
        set((state) => ({
          downloads: {
            ...state.downloads,
            [hike.id]: { status: "downloading", progress: 0 },
          },
        }));

        try {
          await downloadHikeData(hike, (progress) => {
            set((state) => ({
              downloads: {
                ...state.downloads,
                [hike.id]: { status: "downloading", progress },
              },
            }));
          });

          set((state) => ({
            downloads: {
              ...state.downloads,
              [hike.id]: { status: "complete", progress: 1 },
            },
          }));
        } catch (error) {
          set((state) => ({
            downloads: {
              ...state.downloads,
              [hike.id]: {
                status: "error",
                progress: 0,
                error:
                  error instanceof Error
                    ? error.message
                    : "Download failed",
              },
            },
          }));
        }
      },

      removeDownload: (hikeId: string) => {
        deleteHikeData(hikeId);
        set((state) => {
          const { [hikeId]: _, ...remaining } = state.downloads;
          return { downloads: remaining };
        });
      },

      verifyDownload: (hikeId: string): boolean => {
        const stored = get().downloads[hikeId];
        if (stored?.status !== "complete") return false;

        const exists = isHikeDownloaded(hikeId);
        if (!exists) {
          set((state) => {
            const { [hikeId]: _, ...remaining } = state.downloads;
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
