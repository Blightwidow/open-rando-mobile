import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useDownloadStore } from "@/stores/download-store";
import { useSettingsStore } from "@/stores/settings-store";
import { colors, spacing, fontSize, borderRadius } from "@/lib/theme";
import { t } from "@/lib/i18n";
import { useLocale } from "@/hooks/use-locale";
import type { Locale } from "@/lib/i18n";

export default function SettingsScreen() {
  const locale = useLocale();
  const setLocale = useSettingsStore((state) => state.setLocale);
  const downloads = useDownloadStore((state) => state.downloads);
  const removeDownload = useDownloadStore((state) => state.removeDownload);

  const downloadedCount = Object.values(downloads).filter(
    (state) => state.status === "complete",
  ).length;

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

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale);
  };

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("settings.language")}</Text>
        <View style={styles.localeToggle}>
          <Pressable
            style={[styles.localeButton, locale === "fr" && styles.localeButtonActive]}
            onPress={() => handleLocaleChange("fr")}
          >
            <Text
              style={[
                styles.localeButtonText,
                locale === "fr" && styles.localeButtonTextActive,
              ]}
            >
              Français
            </Text>
          </Pressable>
          <Pressable
            style={[styles.localeButton, locale === "en" && styles.localeButtonActive]}
            onPress={() => handleLocaleChange("en")}
          >
            <Text
              style={[
                styles.localeButtonText,
                locale === "en" && styles.localeButtonTextActive,
              ]}
            >
              English
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("settings.storage")}</Text>
        <View style={styles.row}>
          <Text style={styles.label}>{t("settings.downloadedRoutes")}</Text>
          <Text style={styles.value}>{downloadedCount}</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
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
  localeToggle: {
    flexDirection: "row",
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  localeButton: {
    flex: 1,
    paddingVertical: spacing.small,
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  localeButtonActive: {
    backgroundColor: colors.primary,
  },
  localeButtonText: {
    fontSize: fontSize.body,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  localeButtonTextActive: {
    color: "#fff",
  },
});
