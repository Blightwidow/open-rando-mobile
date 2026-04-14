import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useDownloadStore } from "@/stores/download-store";
import { colors, spacing, fontSize, borderRadius } from "@/lib/theme";

export default function SettingsScreen() {
  const downloads = useDownloadStore((state) => state.downloads);
  const removeDownload = useDownloadStore((state) => state.removeDownload);

  const downloadedCount = Object.values(downloads).filter(
    (state) => state.status === "complete",
  ).length;

  const handleDeleteAll = () => {
    Alert.alert(
      "Delete All Downloads",
      "Remove all downloaded route data? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: () => {
            const ids = Object.keys(downloads);
            for (const id of ids) {
              removeDownload(id);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Storage</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Downloaded routes</Text>
          <Text style={styles.value}>{downloadedCount}</Text>
        </View>
        {downloadedCount > 0 && (
          <Pressable style={styles.deleteButton} onPress={handleDeleteAll}>
            <Text style={styles.deleteText}>Delete All Downloads</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Version</Text>
          <Text style={styles.value}>1.0.0</Text>
        </View>
        <Text style={styles.description}>
          Companion app for open-rando — offline hiking between train stations on
          French GR trails.
        </Text>
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
});
