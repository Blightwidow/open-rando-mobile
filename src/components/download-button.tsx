import { useEffect, useRef } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Toast from "react-native-toast-message";
import * as Network from "expo-network";
import type { Route } from "@/lib/types";
import type { MapStyle } from "@/lib/constants";
import { useDownload } from "@/hooks/use-download";
import { colors, spacing, fontSize, borderRadius } from "@/lib/theme";
import { t } from "@/lib/i18n";
import { formatBytes } from "@/lib/format";
import { estimateRouteDownloadBytes } from "@/services/offline-tiles";
import { logError } from "@/lib/logger";

interface DownloadButtonProps {
  route: Route;
}

export function DownloadButton({ route }: DownloadButtonProps) {
  const { status, progress, error, download, cancel } = useDownload(route);
  const prevStatusRef = useRef(status);

  useEffect(() => {
    if (prevStatusRef.current === "downloading" && status === "error") {
      Toast.show({
        type: "error",
        text1: t("toast.downloadError"),
        text2: error,
        visibilityTime: 4000,
      });
    }
    prevStatusRef.current = status;
  }, [status, error]);

  const showStylePicker = () => {
    Alert.alert(t("download.chooseStyle"), undefined, [
      {
        text: t("download.styleLight"),
        onPress: () => download("light" satisfies MapStyle),
      },
      {
        text: t("download.styleDark"),
        onPress: () => download("dark" satisfies MapStyle),
      },
      { text: t("settings.cancel"), style: "cancel" },
    ]);
  };

  const confirmSizeThenPickStyle = async () => {
    try {
      const estimate = await estimateRouteDownloadBytes(route.id);
      const totalSize = formatBytes(estimate.totalBytes);
      const newSize = formatBytes(estimate.newBytes);
      const message =
        estimate.newBytes === 0
          ? t("download.sizeMessageNoNew", { totalSize })
          : t("download.sizeMessage", { newSize, totalSize });
      Alert.alert(t("download.sizeTitle"), message, [
        { text: t("settings.cancel"), style: "cancel" },
        { text: t("download.sizeContinue"), onPress: showStylePicker },
      ]);
    } catch (error) {
      logError("download-button", `estimate failed: ${String(error)}`);
      Toast.show({
        type: "error",
        text1: t("download.sizeEstimateFailed"),
        visibilityTime: 3000,
      });
    }
  };

  const handlePress = async () => {
    const networkState = await Network.getNetworkStateAsync();
    if (networkState.type === Network.NetworkStateType.CELLULAR) {
      Alert.alert(t("download.chooseStyle"), t("download.cellularWarning"), [
        { text: t("settings.cancel"), style: "cancel" },
        {
          text: t("download.cellularContinue"),
          onPress: () => void confirmSizeThenPickStyle(),
        },
      ]);
    } else {
      void confirmSizeThenPickStyle();
    }
  };

  if (status === "complete") {
    return null;
  }

  if (status === "downloading") {
    return (
      <View style={styles.container}>
        <View style={[styles.button, styles.downloadingButton]}>
          <View style={styles.progressBackground}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <View style={styles.downloadingRow}>
            <Text style={styles.buttonText}>
              {t("download.downloading", { progress: Math.round(progress * 100) })}
            </Text>
            <Pressable onPress={cancel} hitSlop={8} style={styles.cancelButton}>
              <Ionicons name="close-circle" size={20} color="#fff" />
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  if (status === "error") {
    return (
      <View style={styles.container}>
        <Pressable
          style={[styles.button, styles.errorButton]}
          onPress={() => void handlePress()}
        >
          <Text style={[styles.buttonText, styles.errorText]}>{t("download.retry")}</Text>
        </Pressable>
        {error && <Text style={styles.errorMessage}>{error}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable style={styles.button} onPress={() => void handlePress()}>
        <Text style={styles.buttonText}>{t("download.idle")}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.small,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.medium,
    paddingVertical: spacing.medium,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  buttonText: {
    color: "#fff",
    fontSize: fontSize.subtitle,
    fontWeight: "600",
  },
  downloadingButton: {
    backgroundColor: colors.primaryLight,
  },
  errorButton: {
    backgroundColor: colors.error,
  },
  errorText: {
    color: "#fff",
  },
  progressBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
  },
  downloadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.small,
  },
  cancelButton: {
    marginLeft: "auto",
  },
  errorMessage: {
    color: colors.error,
    fontSize: fontSize.small,
    textAlign: "center",
  },
});
