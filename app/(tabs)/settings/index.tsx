import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useDownloadStore } from "@/stores/download-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useOverlayStore } from "@/stores/overlay-store";
import { OverlayGroupRow } from "@/components/overlay-group-row";
import { getOverlayGroups } from "@/lib/overlay";
import {
  downloadOverlay,
  getOverlayLocalSizeBytes,
  isOverlayDownloaded,
  removeOverlay,
} from "@/services/overlay-offline";
import { getStorageUsedBytes } from "@/services/offline-storage";
import { spacing, fontSize, borderRadius, darkColors } from "@/lib/theme";
import { useColors } from "@/hooks/use-colors";
import { t } from "@/lib/i18n";
import { useLocale } from "@/hooks/use-locale";
import type { Locale } from "@/lib/i18n";
import type { ThemePreference } from "@/stores/settings-store";
import type { GpsPollingMode } from "@/services/location-service";
import { shareLog } from "@/lib/logger";

export default function SettingsScreen() {
  const locale = useLocale();
  const colors = useColors();
  const setLocale = useSettingsStore((state) => state.setLocale);
  const theme = useSettingsStore((state) => state.theme);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const gpsPollingMode = useSettingsStore((state) => state.gpsPollingMode);
  const setGpsPollingMode = useSettingsStore((state) => state.setGpsPollingMode);
  const overlayEnabled = useOverlayStore((state) => state.enabled);
  const setOverlayEnabled = useOverlayStore((state) => state.setEnabled);
  const overlayVisibleGroups = useOverlayStore((state) => state.visibleGroups);
  const toggleOverlayGroup = useOverlayStore((state) => state.toggleGroup);
  const bumpOverlayRevision = useOverlayStore((state) => state.bumpOfflineRevision);
  const downloads = useDownloadStore((state) => state.downloads);
  const removeDownload = useDownloadStore((state) => state.removeDownload);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        contentContainer: {
          padding: spacing.medium,
          paddingBottom: spacing.large * 2,
        },
        section: {
          marginBottom: spacing.large,
        },
        sectionTitle: {
          fontSize: fontSize.title,
          fontWeight: "700",
          color: colors.text,
          marginBottom: spacing.medium,
        },
        row: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingVertical: spacing.small,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        label: {
          fontSize: fontSize.body,
          color: colors.text,
        },
        value: {
          fontSize: fontSize.body,
          color: colors.textSecondary,
        },
        deleteButton: {
          marginTop: spacing.medium,
          backgroundColor: colors.error,
          borderRadius: borderRadius.medium,
          paddingVertical: spacing.small,
          alignItems: "center",
        },
        deleteText: {
          color: "#fff",
          fontSize: fontSize.body,
          fontWeight: "600",
        },
        description: {
          fontSize: fontSize.body,
          color: colors.textSecondary,
          marginTop: spacing.small,
          lineHeight: 20,
        },
        link: {
          fontSize: fontSize.body,
          color: colors.primary,
          marginTop: spacing.small,
        },
        toggle: {
          flexDirection: "row",
          borderRadius: borderRadius.medium,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: "hidden",
        },
        toggleButton: {
          flex: 1,
          paddingVertical: spacing.small,
          alignItems: "center",
          backgroundColor: colors.surface,
        },
        toggleButtonActive: {
          backgroundColor: colors.primary,
        },
        toggleButtonText: {
          fontSize: fontSize.body,
          fontWeight: "600",
          color: colors.textSecondary,
        },
        toggleButtonTextActive: {
          color: "#fff",
        },
        exportButton: {
          marginTop: spacing.small,
          backgroundColor: colors.primary,
          borderRadius: borderRadius.medium,
          paddingVertical: spacing.small,
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "center",
          gap: spacing.small,
        },
        exportText: {
          color: "#fff",
          fontSize: fontSize.body,
          fontWeight: "600",
        },
      }),
    [colors],
  );

  const overlayTheme = colors === darkColors ? "dark" : "light";
  const overlayGroups = useMemo(() => getOverlayGroups(overlayTheme), [overlayTheme]);
  const [isExportingLog, setIsExportingLog] = useState(false);
  const [overlaySizeBytes, setOverlaySizeBytes] = useState(0);
  const [overlayProgress, setOverlayProgress] = useState<number | null>(null);
  const [overlayFailed, setOverlayFailed] = useState(false);

  useEffect(() => {
    setOverlaySizeBytes(isOverlayDownloaded() ? getOverlayLocalSizeBytes() : 0);
  }, []);
  const [storageUsedBytes, setStorageUsedBytes] = useState(0);

  useEffect(() => {
    setStorageUsedBytes(getStorageUsedBytes());
  }, [downloads]);

  const downloadedCount = Object.values(downloads).filter(
    (state) => state.status === "complete",
  ).length;

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  const handleDeleteAll = () => {
    Alert.alert(t("settings.deleteConfirmTitle"), t("settings.deleteConfirmMessage"), [
      { text: t("settings.cancel"), style: "cancel" },
      {
        text: t("settings.deleteConfirmAction"),
        style: "destructive",
        onPress: () => {
          const ids = Object.keys(downloads);
          for (const id of ids) {
            removeDownload(id);
          }
        },
      },
    ]);
  };

  const handleOverlayDownload = async () => {
    setOverlayFailed(false);
    setOverlayProgress(0);
    try {
      await downloadOverlay(setOverlayProgress);
      setOverlaySizeBytes(getOverlayLocalSizeBytes());
      bumpOverlayRevision();
    } catch {
      setOverlayFailed(true);
    } finally {
      setOverlayProgress(null);
    }
  };

  const handleOverlayRemove = () => {
    removeOverlay();
    setOverlaySizeBytes(0);
    bumpOverlayRevision();
  };

  const handleExportLog = async () => {
    setIsExportingLog(true);
    try {
      await shareLog();
    } catch (error) {
      Alert.alert("Error", `Failed to export log: ${error}`);
    } finally {
      setIsExportingLog(false);
    }
  };

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale);
  };

  const handleThemeChange = (newTheme: ThemePreference) => {
    setTheme(newTheme);
  };

  const themeOptions: { value: ThemePreference; label: string }[] = [
    { value: "light", label: t("settings.theme.light") },
    { value: "system", label: t("settings.theme.system") },
    { value: "dark", label: t("settings.theme.dark") },
  ];

  const gpsPollingOptions: { value: GpsPollingMode; label: string }[] = [
    { value: "precise", label: t("settings.gpsPolling.precise") },
    { value: "balanced", label: t("settings.gpsPolling.balanced") },
    { value: "saver", label: t("settings.gpsPolling.saver") },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("settings.language")}</Text>
        <View style={styles.toggle}>
          <Pressable
            style={[styles.toggleButton, locale === "fr" && styles.toggleButtonActive]}
            onPress={() => handleLocaleChange("fr")}
          >
            <Text
              style={[
                styles.toggleButtonText,
                locale === "fr" && styles.toggleButtonTextActive,
              ]}
            >
              Français
            </Text>
          </Pressable>
          <Pressable
            style={[styles.toggleButton, locale === "en" && styles.toggleButtonActive]}
            onPress={() => handleLocaleChange("en")}
          >
            <Text
              style={[
                styles.toggleButtonText,
                locale === "en" && styles.toggleButtonTextActive,
              ]}
            >
              English
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("settings.appearance")}</Text>
        <View style={styles.toggle}>
          {themeOptions.map(({ value, label }) => (
            <Pressable
              key={value}
              style={[styles.toggleButton, theme === value && styles.toggleButtonActive]}
              onPress={() => handleThemeChange(value)}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  theme === value && styles.toggleButtonTextActive,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("settings.gps")}</Text>
        <View style={styles.toggle}>
          {gpsPollingOptions.map(({ value, label }) => (
            <Pressable
              key={value}
              style={[
                styles.toggleButton,
                gpsPollingMode === value && styles.toggleButtonActive,
              ]}
              onPress={() => setGpsPollingMode(value)}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  gpsPollingMode === value && styles.toggleButtonTextActive,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.description}>{t("settings.gpsPolling.description")}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("settings.overlay")}</Text>
        <View style={styles.row}>
          <Text style={styles.label}>{t("settings.overlay.enabled")}</Text>
          <Switch value={overlayEnabled} onValueChange={setOverlayEnabled} />
        </View>
        {overlayEnabled &&
          overlayGroups.map((group) => (
            <OverlayGroupRow
              key={group.key}
              group={group}
              theme={overlayTheme}
              value={(overlayVisibleGroups ?? []).includes(group.key)}
              onValueChange={() => toggleOverlayGroup(group.key)}
              textColor={colors.text}
              borderColor={colors.border}
            />
          ))}
        <Text style={styles.description}>{t("settings.overlay.description")}</Text>
        {overlayProgress !== null ? (
          <Text style={styles.description}>
            {t("settings.overlay.downloading", {
              percent: Math.round(overlayProgress * 100),
            })}
          </Text>
        ) : overlaySizeBytes > 0 ? (
          <>
            <Text style={styles.description}>
              {t("settings.overlay.downloaded", { size: formatBytes(overlaySizeBytes) })}
            </Text>
            <Pressable style={styles.exportButton} onPress={handleOverlayDownload}>
              <Text style={styles.exportText}>{t("settings.overlay.update")}</Text>
            </Pressable>
            <Pressable style={styles.deleteButton} onPress={handleOverlayRemove}>
              <Text style={styles.deleteText}>{t("settings.overlay.remove")}</Text>
            </Pressable>
          </>
        ) : (
          <Pressable style={styles.exportButton} onPress={handleOverlayDownload}>
            <Text style={styles.exportText}>
              {t("settings.overlay.download", { size: "≈ 85 MB" })}
            </Text>
          </Pressable>
        )}
        {overlayFailed && (
          <Text style={[styles.description, { color: colors.error }]}>
            {t("settings.overlay.error")}
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("settings.storage")}</Text>
        <View style={styles.row}>
          <Text style={styles.label}>{t("settings.storageUsed")}</Text>
          <Text style={styles.value}>{formatBytes(storageUsedBytes)}</Text>
        </View>
        {downloadedCount > 0 && (
          <Pressable style={styles.deleteButton} onPress={handleDeleteAll}>
            <Text style={styles.deleteText}>{t("settings.deleteAll")}</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("settings.about")}</Text>
        <View style={styles.row}>
          <Text style={styles.label}>{t("settings.version")}</Text>
          <Text style={styles.value}>1.0.0</Text>
        </View>
        <Text style={styles.description}>{t("settings.description")}</Text>
        <Text style={styles.link}>rando.dammaretz.fr</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("settings.developer")}</Text>
        <Pressable
          style={styles.exportButton}
          onPress={handleExportLog}
          disabled={isExportingLog}
        >
          {isExportingLog ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.exportText}>{t("settings.exportLog")}</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}
