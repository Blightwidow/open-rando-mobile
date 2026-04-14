import { Stack } from "expo-router";
import { t } from "@/lib/i18n";
import { useLocale } from "@/hooks/use-locale";
import { useColors } from "@/hooks/use-colors";

export default function SettingsLayout() {
  useLocale();
  const colors = useColors();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
      }}
    >
      <Stack.Screen name="index" options={{ title: t("settings.title") }} />
    </Stack>
  );
}
