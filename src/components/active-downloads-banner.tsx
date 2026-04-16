import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDownloadStore } from "@/stores/download-store";
import { useColors } from "@/hooks/use-colors";
import { spacing, fontSize } from "@/lib/theme";
import { t } from "@/lib/i18n";

const TAB_BAR_HEIGHT = 56;

export function ActiveDownloadsBanner() {
  const themeColors = useColors();
  const insets = useSafeAreaInsets();
  const downloads = useDownloadStore((state) => state.downloads);
  const cancelDownload = useDownloadStore((state) => state.cancelDownload);

  const activeDownloads = Object.entries(downloads).filter(
    ([, downloadState]) => downloadState.status === "downloading",
  );

  if (activeDownloads.length === 0) return null;

  return (
    <View
      style={[
        styles.container,
        { bottom: insets.bottom + TAB_BAR_HEIGHT, backgroundColor: themeColors.surface },
      ]}
    >
      {activeDownloads.map(([routeId, downloadState]) => {
        const percent = Math.round((downloadState.progress ?? 0) * 100);
        const routeName = downloadState.routeName ?? routeId;
        return (
          <View key={routeId} style={styles.item}>
            <View
              style={[
                styles.progressFill,
                { width: `${percent}%`, backgroundColor: themeColors.primary },
              ]}
            />
            <View style={styles.row}>
              <View style={styles.info}>
                <Text
                  style={[styles.name, { color: themeColors.text }]}
                  numberOfLines={1}
                >
                  {routeName}
                </Text>
                <Text style={[styles.progress, { color: themeColors.textSecondary }]}>
                  {t("download.downloading", { progress: percent })}
                </Text>
              </View>
              <Pressable
                onPress={() => cancelDownload(routeId)}
                hitSlop={8}
                style={styles.cancelButton}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={themeColors.textSecondary}
                />
              </Pressable>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  item: {
    overflow: "hidden",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  progressFill: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    opacity: 0.12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    gap: spacing.small,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: fontSize.body,
    fontWeight: "600",
  },
  progress: {
    fontSize: fontSize.small,
    marginTop: 1,
  },
  cancelButton: {
    padding: 4,
  },
});
