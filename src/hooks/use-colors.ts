import { useColorScheme } from "react-native";
import { useSettingsStore } from "@/stores/settings-store";
import { lightColors, darkColors } from "@/lib/theme";

export function useColors() {
  const theme = useSettingsStore((state) => state.theme);
  const systemScheme = useColorScheme();
  const isDark = theme === "dark" || (theme === "system" && systemScheme === "dark");
  return isDark ? darkColors : lightColors;
}
