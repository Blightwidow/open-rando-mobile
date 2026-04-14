import { StyleSheet, Text, View } from "react-native";
import type { Difficulty } from "@/lib/types";
import { colors, fontSize, borderRadius } from "@/lib/theme";

interface DifficultyBadgeProps {
  difficulty: Difficulty;
}

const difficultyColors: Record<Difficulty, string> = {
  easy: colors.easy,
  moderate: colors.moderate,
  difficult: colors.difficult,
  very_difficult: colors.veryDifficult,
};

const difficultyLabels: Record<Difficulty, string> = {
  easy: "Easy",
  moderate: "Moderate",
  difficult: "Difficult",
  very_difficult: "Very Difficult",
};

export function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  return (
    <View
      style={[styles.badge, { backgroundColor: difficultyColors[difficulty] + "20" }]}
    >
      <Text style={[styles.text, { color: difficultyColors[difficulty] }]}>
        {difficultyLabels[difficulty]}
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
