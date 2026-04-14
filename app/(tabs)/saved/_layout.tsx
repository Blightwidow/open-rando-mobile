import { Stack } from "expo-router";
import { t } from "@/lib/i18n";
import { useLocale } from "@/hooks/use-locale";

export default function SavedLayout() {
  useLocale();

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: t("saved.title") }} />
      <Stack.Screen name="[slug]" options={{ title: t("saved.offlineRoute") }} />
    </Stack>
  );
}
