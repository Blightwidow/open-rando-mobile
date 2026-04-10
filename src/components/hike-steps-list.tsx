import { StyleSheet, Text, View } from "react-native";
import type { HikeStep } from "@/lib/types";
import { formatDistance, formatDuration, formatElevation } from "@/lib/format";
import { colors, spacing, fontSize } from "@/lib/theme";

interface HikeStepsListProps {
  steps: HikeStep[];
}

export function HikeStepsList({ steps }: HikeStepsListProps) {
  if (steps.length <= 1) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Steps</Text>
      {steps.map((step, index) => (
        <View key={index} style={styles.step}>
          <View style={styles.stepIndicator}>
            <View style={styles.dot} />
            {index < steps.length - 1 && <View style={styles.line} />}
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepStations}>
              {step.start_station.name} → {step.end_station.name}
            </Text>
            <View style={styles.stepStats}>
              <Text style={styles.stepStat}>
                {formatDistance(step.distance_km)}
              </Text>
              <Text style={styles.statSeparator}>·</Text>
              <Text style={styles.stepStat}>
                {formatDuration(step.estimated_duration_min)}
              </Text>
              <Text style={styles.statSeparator}>·</Text>
              <Text style={styles.stepStat}>
                ↑ {formatElevation(step.elevation_gain_m)}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.medium,
  },
  sectionTitle: {
    fontSize: fontSize.title,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.medium,
  },
  step: {
    flexDirection: "row",
    marginBottom: spacing.medium,
  },
  stepIndicator: {
    alignItems: "center",
    width: 20,
    marginRight: spacing.small,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
    marginTop: 4,
  },
  stepContent: {
    flex: 1,
  },
  stepStations: {
    fontSize: fontSize.body,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 2,
  },
  stepStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepStat: {
    fontSize: fontSize.small,
    color: colors.textSecondary,
  },
  statSeparator: {
    fontSize: fontSize.small,
    color: colors.border,
    marginHorizontal: spacing.extraSmall,
  },
});
