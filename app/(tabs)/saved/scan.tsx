import { useRef, useMemo, useCallback } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";
import { useDownloadStore } from "@/stores/download-store";
import { getRouteBySlug } from "@/services/database";
import { extractSlugAndSection } from "@/lib/qr-utils";
import { spacing, fontSize, borderRadius } from "@/lib/theme";
import { useColors } from "@/hooks/use-colors";
import { t } from "@/lib/i18n";
import { useLocale } from "@/hooks/use-locale";

export default function ScanScreen() {
  useLocale();
  const colors = useColors();
  const router = useRouter();
  const scannedRef = useRef(false);
  const [permission, requestPermission] = useCameraPermissions();
  const startSectionDownload = useDownloadStore((state) => state.startSectionDownload);
  const isSectionSaved = useDownloadStore((state) => state.isSectionSaved);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        camera: {
          flex: 1,
        },
        overlay: {
          ...StyleSheet.absoluteFillObject,
          justifyContent: "center",
          alignItems: "center",
        },
        viewfinder: {
          width: 250,
          height: 250,
          borderWidth: 3,
          borderColor: colors.primary,
          borderRadius: borderRadius.large,
        },
        instructionContainer: {
          position: "absolute",
          bottom: 120,
          left: spacing.large,
          right: spacing.large,
          alignItems: "center",
        },
        instruction: {
          fontSize: fontSize.subtitle,
          color: "#ffffff",
          textAlign: "center",
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          paddingHorizontal: spacing.medium,
          paddingVertical: spacing.small,
          borderRadius: borderRadius.medium,
          overflow: "hidden",
        },
        permissionContainer: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: spacing.large,
        },
        permissionText: {
          fontSize: fontSize.body,
          color: colors.textSecondary,
          textAlign: "center",
          marginBottom: spacing.medium,
        },
        settingsButton: {
          backgroundColor: colors.primary,
          paddingHorizontal: spacing.large,
          paddingVertical: spacing.small,
          borderRadius: borderRadius.medium,
        },
        settingsButtonText: {
          color: "#ffffff",
          fontSize: fontSize.body,
          fontWeight: "600",
        },
      }),
    [colors],
  );

  const handleBarCodeScanned = useCallback(
    async ({ data }: { data: string }) => {
      if (scannedRef.current) return;
      scannedRef.current = true;

      const parsed = extractSlugAndSection(data);
      if (!parsed) {
        Toast.show({
          type: "error",
          text1: t("toast.sectionInvalidQr"),
          visibilityTime: 3000,
          onHide: () => {
            scannedRef.current = false;
          },
        });
        return;
      }

      const route = await getRouteBySlug(parsed.slug);
      if (!route) {
        Toast.show({
          type: "error",
          text1: t("toast.sectionNotFound"),
          visibilityTime: 3000,
          onHide: () => {
            scannedRef.current = false;
          },
        });
        return;
      }

      if (
        parsed.fromKm !== undefined &&
        parsed.toKm !== undefined &&
        isSectionSaved(route.id, parsed.fromKm, parsed.toKm)
      ) {
        Toast.show({
          type: "info",
          text1: t("toast.sectionAlreadySaved"),
          visibilityTime: 3000,
          onHide: () => {
            scannedRef.current = false;
          },
        });
        return;
      }

      const fromKm = parsed.fromKm ?? 0;
      const toKm = parsed.toKm ?? route.distance_km;

      try {
        await startSectionDownload(route, fromKm, toKm, "liberty");
        Toast.show({
          type: "success",
          text1: t("toast.sectionDownloadStarted"),
          visibilityTime: 2000,
        });
        router.back();
      } catch {
        Toast.show({
          type: "error",
          text1: t("toast.downloadError"),
          visibilityTime: 3000,
          onHide: () => {
            scannedRef.current = false;
          },
        });
      }
    },
    [isSectionSaved, startSectionDownload, router],
  );

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>{t("scan.permission")}</Text>
        {permission.canAskAgain ? (
          <Pressable style={styles.settingsButton} onPress={requestPermission}>
            <Text style={styles.settingsButtonText}>{t("scan.openSettings")}</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.settingsButton} onPress={() => Linking.openSettings()}>
            <Text style={styles.settingsButtonText}>{t("scan.openSettings")}</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={handleBarCodeScanned}
      >
        <View style={styles.overlay}>
          <View style={styles.viewfinder} />
        </View>
        <View style={styles.instructionContainer}>
          <Text style={styles.instruction}>{t("scan.instruction")}</Text>
        </View>
      </CameraView>
    </View>
  );
}
