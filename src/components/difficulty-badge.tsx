import { StyleSheet, Text, View } from "react-native";
import type { Difficulty } from "@/lib/types";
import { colors, fontSize, borderRadius } from "@/lib/theme";
import { t } from "@/lib/i18n";

interface DifficultyBadgeProps {
  difficulty: Difficulty;
}

const difficultyColors: Record<Difficulty, string> = {
  easy: colors.easy,
  moderate: colors.moderate,
  difficult: colors.difficult,
  very_difficult: colors.veryDifficult,
};

export function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  return (
    <View
      style={[styles.badge, { backgroundColor: difficultyColors[difficulty] + "20" }]}
    >
      <Text style={[styles.text, { color: difficultyColors[difficulty] }]}>
        {t(`difficulty.${difficulty}`)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: borderRadius.small,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  text: {
    fontSize: fontSize.small,
    fontWeight: "600",
  },
});
