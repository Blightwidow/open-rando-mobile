import { Image, StyleSheet, Switch, Text, View } from "react-native";
import type { MapStyle } from "@/lib/map-style";
import type { OverlayGroup } from "@/lib/overlay";
import { fontSize, spacing } from "@/lib/theme";
import { t } from "@/lib/i18n";
import { overlayIconSource } from "./overlay-icon-assets";

interface OverlayGroupRowProps {
  group: OverlayGroup;
  theme: MapStyle;
  value: boolean;
  onValueChange: () => void;
  textColor: string;
  borderColor: string;
}

/** One overlay group in the settings list: its icon or stroke, its name and a switch. */
export function OverlayGroupRow({
  group,
  theme,
  value,
  onValueChange,
  textColor,
  borderColor,
}: OverlayGroupRowProps) {
  return (
    <View style={[styles.row, { borderBottomColor: borderColor }]}>
      <View style={styles.swatch}>
        {group.swatch === "icon" && group.icon ? (
          <Image source={overlayIconSource(theme, group.icon)} style={styles.icon} />
        ) : (
          <View style={[styles.line, { backgroundColor: group.color }]} />
        )}
      </View>
      <Text style={[styles.label, { color: textColor }]}>{t(group.labelKey)}</Text>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.small,
    paddingVertical: spacing.small,
    borderBottomWidth: 1,
  },
  swatch: { width: 28, alignItems: "center", justifyContent: "center" },
  icon: { width: 24, height: 24 },
  line: { width: 20, height: 3, borderRadius: 1.5 },
  label: { flex: 1, fontSize: fontSize.body },
});
