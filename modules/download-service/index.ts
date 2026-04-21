import { Platform, requireOptionalNativeModule } from "expo-modules-core";

interface DownloadServiceNativeModule {
  startDownloadNotification(id: string, title: string, progressText: string): Promise<void>;
  updateDownloadProgress(id: string, progress: number, progressText: string): Promise<void>;
  completeDownloadNotification(id: string, completeText: string): Promise<void>;
  cancelDownloadNotification(id: string): Promise<void>;
}

const nativeModule =
  requireOptionalNativeModule<DownloadServiceNativeModule>("DownloadService");

function isSupported(): boolean {
  return Platform.OS === "android" && nativeModule !== null;
}

export async function startDownloadNotification(
  id: string,
  title: string,
  progressText: string,
): Promise<void> {
  if (!isSupported() || !nativeModule) return;
  await nativeModule.startDownloadNotification(id, title, progressText);
}

export async function updateDownloadProgress(
  id: string,
  progress: number,
  progressText: string,
): Promise<void> {
  if (!isSupported() || !nativeModule) return;
  await nativeModule.updateDownloadProgress(id, progress, progressText);
}

export async function completeDownloadNotification(
  id: string,
  completeText: string,
): Promise<void> {
  if (!isSupported() || !nativeModule) return;
  await nativeModule.completeDownloadNotification(id, completeText);
}

export async function cancelDownloadNotification(id: string): Promise<void> {
  if (!isSupported() || !nativeModule) return;
  await nativeModule.cancelDownloadNotification(id);
}

export const isNativeDownloadServiceSupported = isSupported;
