import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import {
  cancelDownloadNotification as nativeCancel,
  completeDownloadNotification as nativeComplete,
  isNativeDownloadServiceSupported,
  startDownloadNotification as nativeStart,
  updateDownloadProgress as nativeUpdate,
} from "../../modules/download-service";
import { logDebug } from "@/lib/logger";
import { t } from "@/lib/i18n";

const IOS_CHANNEL_ID = "downloads";
const THROTTLE_PERCENT = 10;

const lastPercent = new Map<string, number>();
const startedIds = new Set<string>();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function ensureIosSetup(): Promise<void> {
  if (Platform.OS === "android") {
    // Native module handles channel creation.
    return;
  }
  await Notifications.setNotificationChannelAsync(IOS_CHANNEL_ID, {
    name: "Downloads",
    importance: Notifications.AndroidImportance.LOW,
    sound: null,
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  await ensureIosSetup();
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function updateDownloadNotification(
  id: string,
  title: string,
  progress: number,
): Promise<void> {
  const percent = Math.max(0, Math.min(100, Math.round(progress * 100)));
  const last = lastPercent.get(id) ?? -1;
  if (percent < last + THROTTLE_PERCENT && percent < 100) return;
  lastPercent.set(id, percent);

  const progressText = t("notification.downloading", { progress: percent });

  if (isNativeDownloadServiceSupported()) {
    try {
      if (!startedIds.has(id)) {
        startedIds.add(id);
        await nativeStart(id, title, progressText);
      }
      await nativeUpdate(id, progress, progressText);
    } catch (error) {
      logDebug("notifications", `native update failed: ${String(error)}`);
    }
    return;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      identifier: `download-${id}`,
      content: {
        title,
        body: progressText,
        data: { id },
      },
      trigger: null,
    });
  } catch (error) {
    logDebug("notifications", `ios schedule failed: ${String(error)}`);
  }
}

export async function showDownloadCompleteNotification(
  id: string,
  title: string,
): Promise<void> {
  lastPercent.delete(id);
  const completeText = t("notification.downloadComplete");

  if (isNativeDownloadServiceSupported()) {
    startedIds.delete(id);
    try {
      await nativeComplete(id, completeText);
    } catch (error) {
      logDebug("notifications", `native complete failed: ${String(error)}`);
    }
    return;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      identifier: `download-${id}`,
      content: {
        title,
        body: completeText,
        data: { id },
      },
      trigger: null,
    });
  } catch {}
}

export async function dismissDownloadNotification(id: string): Promise<void> {
  lastPercent.delete(id);

  if (isNativeDownloadServiceSupported()) {
    startedIds.delete(id);
    try {
      await nativeCancel(id);
    } catch (error) {
      logDebug("notifications", `native cancel failed: ${String(error)}`);
    }
    return;
  }

  try {
    await Notifications.dismissNotificationAsync(`download-${id}`);
  } catch {}
}
