import { Stack } from "expo-router";
import { t } from "@/lib/i18n";
import { useLocale } from "@/hooks/use-locale";

export default function SettingsLayout() {
  useLocale();

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: t("settings.title") }} />
    </Stack>
  );
}
