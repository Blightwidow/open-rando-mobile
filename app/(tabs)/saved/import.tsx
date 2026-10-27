import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { useLocalSearchParams, useRouter } from "expo-router";
import { GpxParseError } from "@/lib/gpx";
import type { MapStyle } from "@/lib/constants";
import { readGpxRoute } from "@/services/gpx-import";
import { useDownloadStore } from "@/stores/download-store";
import { useImportedRouteStore } from "@/stores/imported-route-store";
import { buildSectionId } from "@/lib/qr-utils";
import { logError } from "@/lib/logger";
import { spacing, fontSize, borderRadius } from "@/lib/theme";
import { useColors } from "@/hooks/use-colors";
import { t } from "@/lib/i18n";
import { useLocale } from "@/hooks/use-locale";

export default function ImportGpxScreen() {
  useLocale();
  const colors = useColors();
  const router = useRouter();
  const { uri } = useLocalSearchParams<{ uri?: string }>();
  const startedRef = useRef(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const startSectionDownload = useDownloadStore((state) => state.startSectionDownload);
  const addImportedRoute = useImportedRouteStore((state) => state.addRoute);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        centered: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: spacing.large,
          backgroundColor: colors.background,
        },
        text: {
          marginTop: spacing.medium,
          fontSize: fontSize.body,
          color: colors.textSecondary,
          textAlign: "center",
        },
        errorText: {
          fontSize: fontSize.body,
          color: colors.error,
          textAlign: "center",
          marginBottom: spacing.medium,
        },
        closeButton: {
          backgroundColor: colors.primary,
          paddingHorizontal: spacing.large,
          paddingVertical: spacing.small,
          borderRadius: borderRadius.medium,
        },
        closeButtonText: {
          color: "#ffffff",
          fontSize: fontSize.body,
          fontWeight: "600",
        },
      }),
    [colors],
  );

  useEffect(() => {
    if (startedRef.current || typeof uri !== "string" || !uri) return;
    startedRef.current = true;

    void (async () => {
      try {
        const { route, geoJson, elevation, bbox } = await readGpxRoute(uri);
        const sectionId = buildSectionId(route.id, 0, route.distance_km);

        if (useDownloadStore.getState().sections[sectionId]) {
          Toast.show({
            type: "info",
            text1: t("gpx.alreadyImported"),
            visibilityTime: 3000,
          });
          router.replace("/saved");
          return;
        }

        const startImport = (mapStyle: MapStyle) => {
          addImportedRoute(route);
          void startSectionDownload(route, 0, route.distance_km, mapStyle, {
            geoJson,
            elevation,
            bbox,
          }).catch(() => {
            Toast.show({
              type: "error",
              text1: t("toast.downloadError"),
              visibilityTime: 3000,
            });
          });
          Toast.show({
            type: "success",
            text1: t("gpx.imported"),
            visibilityTime: 2000,
          });
          router.replace("/saved");
        };

        Alert.alert(
          t("download.chooseStyle"),
          undefined,
          [
            { text: t("download.styleLight"), onPress: () => startImport("light") },
            { text: t("download.styleDark"), onPress: () => startImport("dark") },
            {
              text: t("settings.cancel"),
              style: "cancel",
              onPress: () => router.replace("/saved"),
            },
          ],
          { cancelable: true, onDismiss: () => router.replace("/saved") },
        );
      } catch (error) {
        logError("gpx-import", `import failed: ${String(error)}`);
        setErrorMessage(
          error instanceof GpxParseError ? t("gpx.invalidFile") : t("gpx.importFailed"),
        );
      }
    })();
  }, [uri, router, startSectionDownload, addImportedRoute]);

  if (errorMessage) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{errorMessage}</Text>
        <Pressable style={styles.closeButton} onPress={() => router.replace("/saved")}>
          <Text style={styles.closeButtonText}>{t("gpx.close")}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.text}>{t("gpx.importing")}</Text>
    </View>
  );
}
