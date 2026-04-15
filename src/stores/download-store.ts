import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DownloadState, Route, SectionEntry } from "@/lib/types";
import type { MapStyle } from "@/lib/constants";
import { buildSectionId } from "@/lib/qr-utils";
import {
  downloadRouteData,
  deleteRouteData,
  isRouteDownloaded,
} from "@/services/offline-storage";

interface DownloadStore {
  downloads: Record<string, DownloadState>;
  sections: Record<string, SectionEntry>;
  startDownload: (route: Route, mapStyle: MapStyle) => Promise<void>;
  removeDownload: (routeId: string) => void;
  verifyDownload: (routeId: string) => boolean;
  getDownloadState: (routeId: string) => DownloadState;
  startSectionDownload: (
    route: Route,
    fromKm: number,
    toKm: number,
    mapStyle: MapStyle,
  ) => Promise<void>;
  removeSection: (sectionId: string) => void;
  isSectionSaved: (routeId: string, fromKm: number, toKm: number) => boolean;
}

const defaultState: DownloadState = { status: "idle", progress: 0 };

export const useDownloadStore = create<DownloadStore>()(
  persist(
    (set, get) => ({
      downloads: {},
      sections: {},

      getDownloadState: (routeId: string): DownloadState => {
        return get().downloads[routeId] ?? defaultState;
      },

      startDownload: async (route: Route, mapStyle: MapStyle) => {
        set((state) => ({
          downloads: {
            ...state.downloads,
            [route.id]: { status: "downloading", progress: 0, mapStyle },
          },
        }));

        try {
          await downloadRouteData(route, mapStyle, (progress) => {
            set((state) => ({
              downloads: {
                ...state.downloads,
                [route.id]: { status: "downloading", progress, mapStyle },
              },
            }));
          });

          set((state) => ({
            downloads: {
              ...state.downloads,
              [route.id]: { status: "complete", progress: 1, mapStyle },
            },
          }));
        } catch (error) {
          set((state) => ({
            downloads: {
              ...state.downloads,
              [route.id]: {
                status: "error",
                progress: 0,
                mapStyle,
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

      startSectionDownload: async (
        route: Route,
        fromKm: number,
        toKm: number,
        mapStyle: MapStyle,
      ) => {
        const sectionId = buildSectionId(route.id, fromKm, toKm);

        // Download route data if not already on disk
        const downloadState = get().downloads[route.id];
        if (downloadState?.status !== "complete") {
          await get().startDownload(route, mapStyle);
        }

        // Add section entry
        set((state) => ({
          sections: {
            ...state.sections,
            [sectionId]: {
              sectionId,
              routeId: route.id,
              slug: route.slug,
              fromKm,
              toKm,
              savedAt: new Date().toISOString(),
            },
          },
        }));
      },

      removeSection: (sectionId: string) => {
        const section = get().sections[sectionId];
        if (!section) return;

        const { routeId } = section;

        set((state) => {
          const { [sectionId]: _, ...remainingSections } = state.sections;
          return { sections: remainingSections };
        });

        // Clean up route data if no other sections or full downloads reference it
        const hasOtherSections = Object.values(get().sections).some(
          (entry) => entry.routeId === routeId,
        );
        const hasFullDownload = get().downloads[routeId]?.status === "complete";

        if (!hasOtherSections && !hasFullDownload) {
          deleteRouteData(routeId);
          set((state) => {
            const { [routeId]: _, ...remainingDownloads } = state.downloads;
            return { downloads: remainingDownloads };
          });
        }
      },

      isSectionSaved: (routeId: string, fromKm: number, toKm: number): boolean => {
        const sectionId = buildSectionId(routeId, fromKm, toKm);
        return sectionId in get().sections;
      },
    }),
    {
      name: "download-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        downloads: state.downloads,
        sections: state.sections,
      }),
    },
  ),
);
