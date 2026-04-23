import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DownloadState, Route, SectionEntry } from "@/lib/types";
import type { MapStyle } from "@/lib/constants";
import { buildSectionId } from "@/lib/qr-utils";
import {
  downloadRouteData,
  downloadSectionData,
  deleteRouteData,
  deleteSectionData,
  isRouteDownloaded,
  isSectionDownloaded,
} from "@/services/offline-storage";
import {
  requestNotificationPermission,
  updateDownloadNotification,
  showDownloadCompleteNotification,
  dismissDownloadNotification,
} from "@/lib/download-notifications";
import { logError } from "@/lib/logger";

// Module-level maps: not persisted, reset on app restart
const activeCancellers = new Map<string, AbortController>();
const activeSectionCancellers = new Map<string, AbortController>();

interface DownloadStore {
  downloads: Record<string, DownloadState>;
  sections: Record<string, SectionEntry>;
  sectionDownloads: Record<string, DownloadState>;
  startDownload: (route: Route, mapStyle: MapStyle) => Promise<void>;
  cancelDownload: (routeId: string) => void;
  removeDownload: (routeId: string) => void;
  verifyDownload: (routeId: string) => boolean;
  getDownloadState: (routeId: string) => DownloadState;
  startSectionDownload: (
    route: Route,
    fromKm: number,
    toKm: number,
    mapStyle: MapStyle,
  ) => Promise<void>;
  cancelSectionDownload: (sectionId: string) => void;
  removeSection: (sectionId: string) => void;
  getSectionDownloadState: (sectionId: string) => DownloadState;
  isSectionSaved: (routeId: string, fromKm: number, toKm: number) => boolean;
}

const defaultState: DownloadState = { status: "idle", progress: 0 };

export const useDownloadStore = create<DownloadStore>()(
  persist(
    (set, get) => ({
      downloads: {},
      sections: {},
      sectionDownloads: {},

      getDownloadState: (routeId: string): DownloadState => {
        return get().downloads[routeId] ?? defaultState;
      },

      getSectionDownloadState: (sectionId: string): DownloadState => {
        return get().sectionDownloads[sectionId] ?? defaultState;
      },

      startDownload: async (route: Route, mapStyle: MapStyle) => {
        const controller = new AbortController();
        activeCancellers.set(route.id, controller);

        set((state) => ({
          downloads: {
            ...state.downloads,
            [route.id]: {
              status: "downloading",
              progress: 0,
              mapStyle,
              routeName: route.path_name,
            },
          },
        }));

        void requestNotificationPermission();

        try {
          await downloadRouteData(
            route,
            mapStyle,
            (progress) => {
              if (controller.signal.aborted) return;
              set((state) => ({
                downloads: {
                  ...state.downloads,
                  [route.id]: {
                    status: "downloading",
                    progress,
                    mapStyle,
                    routeName: route.path_name,
                  },
                },
              }));
              void updateDownloadNotification(route.id, route.path_name, progress);
            },
            controller.signal,
          );

          activeCancellers.delete(route.id);

          if (controller.signal.aborted) return;

          set((state) => ({
            downloads: {
              ...state.downloads,
              [route.id]: {
                status: "complete",
                progress: 1,
                mapStyle,
                routeName: route.path_name,
              },
            },
          }));

          void showDownloadCompleteNotification(route.id, route.path_name);
        } catch (error) {
          activeCancellers.delete(route.id);

          if (controller.signal.aborted) return;

          logError(
            "download-store",
            `route ${route.id} failed: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`,
          );

          set((state) => ({
            downloads: {
              ...state.downloads,
              [route.id]: {
                status: "error",
                progress: 0,
                mapStyle,
                routeName: route.path_name,
                error: error instanceof Error ? error.message : "Download failed",
              },
            },
          }));

          void dismissDownloadNotification(route.id);
        }
      },

      cancelDownload: (routeId: string) => {
        const controller = activeCancellers.get(routeId);
        if (controller) {
          controller.abort();
          activeCancellers.delete(routeId);
        }
        void dismissDownloadNotification(routeId);
        set((state) => {
          const current = state.downloads[routeId];
          if (!current || current.status !== "downloading") return state;
          return {
            downloads: {
              ...state.downloads,
              [routeId]: {
                status: "idle",
                progress: 0,
                mapStyle: current.mapStyle,
                routeName: current.routeName,
              },
            },
          };
        });
      },

      removeDownload: (routeId: string) => {
        deleteRouteData(routeId);
        set((state) => {
          const { [routeId]: _removed, ...remainingDownloads } = state.downloads;
          return { downloads: remainingDownloads };
        });
      },

      verifyDownload: (routeId: string): boolean => {
        const stored = get().downloads[routeId];
        if (stored?.status !== "complete") return false;

        const exists = isRouteDownloaded(routeId);
        if (!exists) {
          set((state) => {
            const { [routeId]: _removed, ...remaining } = state.downloads;
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
        const controller = new AbortController();
        activeSectionCancellers.set(sectionId, controller);

        set((state) => ({
          sectionDownloads: {
            ...state.sectionDownloads,
            [sectionId]: {
              status: "downloading",
              progress: 0,
              mapStyle,
              routeName: route.path_name,
            },
          },
          sections: {
            ...state.sections,
            [sectionId]: {
              sectionId,
              routeId: route.id,
              slug: route.slug,
              fromKm,
              toKm,
              savedAt: new Date().toISOString(),
              mapStyle,
              routeName: route.path_name,
            },
          },
        }));

        void requestNotificationPermission();

        try {
          const result = await downloadSectionData(
            route,
            sectionId,
            fromKm,
            toKm,
            mapStyle,
            (progress) => {
              if (controller.signal.aborted) return;
              set((state) => ({
                sectionDownloads: {
                  ...state.sectionDownloads,
                  [sectionId]: {
                    status: "downloading",
                    progress,
                    mapStyle,
                    routeName: route.path_name,
                  },
                },
              }));
              void updateDownloadNotification(sectionId, route.path_name, progress);
            },
            controller.signal,
          );

          activeSectionCancellers.delete(sectionId);
          if (controller.signal.aborted) return;

          set((state) => ({
            sectionDownloads: {
              ...state.sectionDownloads,
              [sectionId]: {
                status: "complete",
                progress: 1,
                mapStyle,
                routeName: route.path_name,
              },
            },
            sections: {
              ...state.sections,
              [sectionId]: {
                sectionId,
                routeId: route.id,
                slug: route.slug,
                fromKm,
                toKm,
                savedAt: new Date().toISOString(),
                bbox: result.bbox,
                mapStyle,
                routeName: route.path_name,
              },
            },
          }));

          void showDownloadCompleteNotification(sectionId, route.path_name);
        } catch (error) {
          activeSectionCancellers.delete(sectionId);
          if (controller.signal.aborted) return;

          logError(
            "download-store",
            `section ${sectionId} failed: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`,
          );

          set((state) => ({
            sectionDownloads: {
              ...state.sectionDownloads,
              [sectionId]: {
                status: "error",
                progress: 0,
                mapStyle,
                routeName: route.path_name,
                error: error instanceof Error ? error.message : "Download failed",
              },
            },
          }));

          void dismissDownloadNotification(sectionId);
        }
      },

      cancelSectionDownload: (sectionId: string) => {
        const controller = activeSectionCancellers.get(sectionId);
        if (controller) {
          controller.abort();
          activeSectionCancellers.delete(sectionId);
        }
        void dismissDownloadNotification(sectionId);
        const section = get().sections[sectionId];
        if (section) {
          try {
            deleteSectionData(section.routeId, sectionId);
          } catch {
            // best-effort
          }
        }
        set((state) => {
          const { [sectionId]: _dropped, ...restDownloads } = state.sectionDownloads;
          const { [sectionId]: _sec, ...restSections } = state.sections;
          return { sectionDownloads: restDownloads, sections: restSections };
        });
      },

      removeSection: (sectionId: string) => {
        const section = get().sections[sectionId];
        if (!section) {
          // still clean download state if any
          set((state) => {
            const { [sectionId]: _d, ...rest } = state.sectionDownloads;
            return { sectionDownloads: rest };
          });
          return;
        }

        deleteSectionData(section.routeId, sectionId);

        set((state) => {
          const { [sectionId]: _sec, ...remainingSections } = state.sections;
          const { [sectionId]: _dl, ...remainingSectionDownloads } =
            state.sectionDownloads;
          return {
            sections: remainingSections,
            sectionDownloads: remainingSectionDownloads,
          };
        });
      },

      isSectionSaved: (routeId: string, fromKm: number, toKm: number): boolean => {
        const sectionId = buildSectionId(routeId, fromKm, toKm);
        if (!(sectionId in get().sections)) return false;
        const dl = get().sectionDownloads[sectionId];
        if (dl?.status === "downloading") return true;
        return isSectionDownloaded(routeId, sectionId);
      },
    }),
    {
      name: "download-store",
      version: 4,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        downloads: state.downloads,
        sections: state.sections,
        sectionDownloads: state.sectionDownloads,
      }),
      migrate: (persistedState, version) => {
        // v4: section downloads are independent from full route downloads;
        // on-disk layout changed. Wipe to force re-download (app not released).
        if (version < 4) {
          return {
            downloads: {},
            sections: {},
            sectionDownloads: {},
          };
        }
        const state = (persistedState ?? {}) as {
          downloads?: Record<string, DownloadState>;
          sections?: Record<string, SectionEntry>;
          sectionDownloads?: Record<string, DownloadState>;
        };
        return {
          downloads: state.downloads ?? {},
          sections: state.sections ?? {},
          sectionDownloads: state.sectionDownloads ?? {},
        };
      },
    },
  ),
);
