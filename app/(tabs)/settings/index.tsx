import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useDownloadStore } from "@/stores/download-store";
import { useSettingsStore } from "@/stores/settings-store";
import { getStorageUsedBytes } from "@/services/offline-storage";
import { spacing, fontSize, borderRadius } from "@/lib/theme";
import { useColors } from "@/hooks/use-colors";
import { t } from "@/lib/i18n";
import { useLocale } from "@/hooks/use-locale";
import type { Locale } from "@/lib/i18n";
import type { ThemePreference } from "@/stores/settings-store";
import { shareLog } from "@/lib/logger";

export default function SettingsScreen() {
  const locale = useLocale();
  const colors = useColors();
  const setLocale = useSettingsStore((state) => state.setLocale);
  const theme = useSettingsStore((state) => state.theme);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const downloads = useDownloadStore((state) => state.downloads);
  const removeDownload = useDownloadStore((state) => state.removeDownload);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
          padding: spacing.medium,
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

  const [isExportingLog, setIsExportingLog] = useState(false);
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

  return (
    <View style={styles.container}>
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
    </View>
  );
}
