import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { logDebug } from "@/lib/logger";
import { t } from "@/lib/i18n";

const CHANNEL_ID = "downloads";
const THROTTLE_PERCENT = 10;

// Module-level tracking (in-memory, not persisted)
const activeNotifIds = new Map<string, string>();
const lastNotifPercent = new Map<string, number>();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "Downloads",
    importance: Notifications.AndroidImportance.LOW,
    sound: null,
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  await ensureAndroidChannel();
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function updateDownloadNotification(
  routeId: string,
  routeName: string,
  progress: number,
): Promise<void> {
  const percent = Math.round(progress * 100);
  const lastPercent = lastNotifPercent.get(routeId) ?? -1;

  // Throttle: only update every THROTTLE_PERCENT points
  if (percent < lastPercent + THROTTLE_PERCENT && percent < 100) return;
  lastNotifPercent.set(routeId, percent);

  // Dismiss previous notification for this route
  const oldId = activeNotifIds.get(routeId);
  if (oldId) {
    try {
      await Notifications.dismissNotificationAsync(oldId);
    } catch {}
  }

  try {
    const notifId = await Notifications.scheduleNotificationAsync({
      content: {
        title: routeName,
        body: t("notification.downloading", { progress: percent }),
        data: { routeId },
      },
      trigger: null,
    });
    activeNotifIds.set(routeId, notifId);
    logDebug("notifications", `Download notification updated: ${routeId} ${percent}%`);
  } catch (error) {
    logDebug("notifications", `Failed to show notification: ${String(error)}`);
  }
}

export async function showDownloadCompleteNotification(
  routeId: string,
  routeName: string,
): Promise<void> {
  await dismissDownloadNotification(routeId);
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: routeName,
        body: t("notification.downloadComplete"),
        data: { routeId },
      },
      trigger: null,
    });
  } catch {}
}

export async function dismissDownloadNotification(routeId: string): Promise<void> {
  const notifId = activeNotifIds.get(routeId);
  if (notifId) {
    try {
      await Notifications.dismissNotificationAsync(notifId);
    } catch {}
    activeNotifIds.delete(routeId);
  }
  lastNotifPercent.delete(routeId);
}
