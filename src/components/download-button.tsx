import { useEffect, useRef } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import type { Route } from "@/lib/types";
import type { MapStyle } from "@/lib/constants";
import { useDownload } from "@/hooks/use-download";
import { colors, spacing, fontSize, borderRadius } from "@/lib/theme";
import { t } from "@/lib/i18n";

interface DownloadButtonProps {
  route: Route;
}

export function DownloadButton({ route }: DownloadButtonProps) {
  const { status, progress, error, download } = useDownload(route);
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

  const handlePress = () => {
    Alert.alert(t("download.chooseStyle"), undefined, [
      {
        text: t("download.stylePlan"),
        onPress: () => download("bright" as MapStyle),
      },
      {
        text: t("download.styleTopo"),
        onPress: () => download("liberty" as MapStyle),
      },
      { text: t("settings.cancel"), style: "cancel" },
    ]);
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
          <Text style={styles.buttonText}>
            {t("download.downloading", { progress: Math.round(progress * 100) })}
          </Text>
        </View>
      </View>
    );
  }

  if (status === "error") {
    return (
      <View style={styles.container}>
        <Pressable style={[styles.button, styles.errorButton]} onPress={handlePress}>
          <Text style={[styles.buttonText, styles.errorText]}>{t("download.retry")}</Text>
        </Pressable>
        {error && <Text style={styles.errorMessage}>{error}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable style={styles.button} onPress={handlePress}>
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
  errorMessage: {
    color: colors.error,
    fontSize: fontSize.small,
    textAlign: "center",
  },
});
