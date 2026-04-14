import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Route } from "@/lib/types";
import { useDownload } from "@/hooks/use-download";
import { colors, spacing, fontSize, borderRadius } from "@/lib/theme";

interface DownloadButtonProps {
  route: Route;
}

export function DownloadButton({ route }: DownloadButtonProps) {
  const { status, progress, error, download, remove } = useDownload(route);

  if (status === "complete") {
    return (
      <View style={styles.container}>
        <View style={[styles.button, styles.downloadedButton]}>
          <Text style={[styles.buttonText, styles.downloadedText]}>✓ Downloaded</Text>
        </View>
        <Pressable onPress={remove} style={styles.removeButton}>
          <Text style={styles.removeText}>Remove</Text>
        </Pressable>
      </View>
    );
  }

  if (status === "downloading") {
    return (
      <View style={styles.container}>
        <View style={[styles.button, styles.downloadingButton]}>
          <View style={styles.progressBackground}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.buttonText}>
            Downloading... {Math.round(progress * 100)}%
          </Text>
        </View>
      </View>
    );
  }

  if (status === "error") {
    return (
      <View style={styles.container}>
        <Pressable style={[styles.button, styles.errorButton]} onPress={download}>
          <Text style={[styles.buttonText, styles.errorText]}>Retry Download</Text>
        </Pressable>
        {error && <Text style={styles.errorMessage}>{error}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable style={styles.button} onPress={download}>
        <Text style={styles.buttonText}>Download for Offline</Text>
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
  downloadedButton: {
    backgroundColor: colors.success,
  },
  downloadedText: {
    color: "#fff",
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
  removeButton: {
    alignItems: "center",
    paddingVertical: spacing.small,
  },
  removeText: {
    color: colors.error,
    fontSize: fontSize.body,
  },
  errorMessage: {
    color: colors.error,
    fontSize: fontSize.small,
    textAlign: "center",
  },
});
