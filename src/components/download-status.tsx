import { useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { spacing, fontSize, borderRadius } from "@/lib/theme";
import { t } from "@/lib/i18n";
import { INTERRUPTED_ERROR } from "@/stores/download-store";
import type { DownloadState } from "@/lib/types";

interface DownloadStatusProps {
  state: DownloadState | undefined;
}

/** Shows progress while downloading, or the failure and its reason. Nothing once complete. */
export function DownloadStatus({ state }: DownloadStatusProps) {
  const colors = useColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: colors.surface,
          borderRadius: borderRadius.medium,
          padding: spacing.small,
          marginVertical: spacing.small,
          gap: 4,
        },
        titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.small },
        title: { fontSize: fontSize.body, fontWeight: "600", color: colors.text },
        errorTitle: { fontSize: fontSize.body, fontWeight: "600", color: colors.error },
        reason: { fontSize: fontSize.small, color: colors.textSecondary },
        track: {
          height: 4,
          borderRadius: 2,
          backgroundColor: colors.border,
          overflow: "hidden",
        },
        bar: { height: 4, backgroundColor: colors.primary },
      }),
    [colors],
  );

  if (!state || state.status === "complete" || state.status === "idle") return null;

  if (state.status === "downloading") {
    const percent = Math.round(state.progress * 100);
    return (
      <View style={styles.container}>
        <View style={styles.titleRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.title}>
            {t("download.downloading", { progress: percent })}
          </Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.bar, { width: `${percent}%` }]} />
        </View>
      </View>
    );
  }

  const reason =
    state.error === INTERRUPTED_ERROR
      ? t("download.interrupted")
      : t("download.failedReason", { reason: state.error ?? "unknown" });
  return (
    <View style={styles.container}>
      <Text style={styles.errorTitle}>{t("download.failed")}</Text>
      <Text style={styles.reason}>{reason}</Text>
    </View>
  );
}
