import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFilterStore } from "@/stores/filter-store";
import { useDistinctRegions } from "@/hooks/use-catalog";
import { colors, spacing, fontSize, borderRadius } from "@/lib/theme";
import { t } from "@/lib/i18n";
import type { Terrain } from "@/lib/types";

const TERRAIN_OPTIONS: { value: Terrain; color: string; backgroundColor: string }[] = [
  { value: "coastal", color: "#0e7490", backgroundColor: "#cffafe" },
  { value: "mountain", color: "#475569", backgroundColor: "#e2e8f0" },
  { value: "hills", color: "#92400e", backgroundColor: "#fef3c7" },
  { value: "forest", color: "#065f46", backgroundColor: "#d1fae5" },
  { value: "plains", color: "#3f6212", backgroundColor: "#ecfccb" },
];

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function FilterSheet({ visible, onClose }: FilterSheetProps) {
  const regions = useFilterStore((state) => state.regions);
  const terrains = useFilterStore((state) => state.terrains);
  const toggleRegion = useFilterStore((state) => state.toggleRegion);
  const toggleTerrain = useFilterStore((state) => state.toggleTerrain);
  const clearAll = useFilterStore((state) => state.clearAll);
  const activeFilterCount = useFilterStore((state) => state.activeFilterCount);
  const { data: availableRegions } = useDistinctRegions();

  const hasActiveFilters = activeFilterCount() > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t("filters.title")}</Text>
          <View style={styles.headerActions}>
            {hasActiveFilters && (
              <Pressable onPress={clearAll} style={styles.clearButton}>
                <Text style={styles.clearButtonText}>{t("filters.clear")}</Text>
              </Pressable>
            )}
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("filters.terrain")}</Text>
            <View style={styles.chipRow}>
              {TERRAIN_OPTIONS.map((option) => {
                const isSelected = terrains.includes(option.value);
                return (
                  <Pressable
                    key={option.value}
                    style={[
                      styles.terrainChip,
                      {
                        backgroundColor: isSelected
                          ? option.backgroundColor
                          : colors.surface,
                        borderColor: isSelected ? option.color : colors.border,
                      },
                    ]}
                    onPress={() => toggleTerrain(option.value)}
                  >
                    <Text
                      style={[
                        styles.terrainChipText,
                        { color: isSelected ? option.color : colors.textSecondary },
                      ]}
                    >
                      {t(`terrain.${option.value}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("filters.region")}</Text>
            <View style={styles.chipRow}>
              {availableRegions?.map((region) => {
                const isSelected = regions.includes(region);
                return (
                  <Pressable
                    key={region}
                    style={[styles.regionChip, isSelected && styles.regionChipSelected]}
                    onPress={() => toggleRegion(region)}
                  >
                    {isSelected && (
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color="#fff"
                        style={styles.checkIcon}
                      />
                    )}
                    <Text
                      style={[
                        styles.regionChipText,
                        isSelected && styles.regionChipTextSelected,
                      ]}
                    >
                      {region}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: fontSize.title,
    fontWeight: "700",
    color: colors.text,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.small,
  },
  clearButton: {
    paddingHorizontal: spacing.small,
    paddingVertical: spacing.extraSmall,
  },
  clearButtonText: {
    fontSize: fontSize.body,
    color: colors.primary,
    fontWeight: "600",
  },
  closeButton: {
    padding: spacing.extraSmall,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.medium,
  },
  section: {
    marginBottom: spacing.large,
  },
  sectionTitle: {
    fontSize: fontSize.subtitle,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.small,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.small,
  },
  terrainChip: {
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    borderRadius: 999,
    borderWidth: 1,
  },
  terrainChipText: {
    fontSize: fontSize.body,
    fontWeight: "500",
  },
  regionChip: {
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
  },
  regionChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  regionChipText: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
  },
  regionChipTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  checkIcon: {
    marginRight: spacing.extraSmall,
  },
});
