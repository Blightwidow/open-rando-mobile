import { Stack } from "expo-router";
import { t } from "@/lib/i18n";
import { useLocale } from "@/hooks/use-locale";
import { useColors } from "@/hooks/use-colors";

export default function SavedLayout() {
  useLocale();
  const colors = useColors();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
      }}
    >
      <Stack.Screen name="index" options={{ title: t("saved.title") }} />
      <Stack.Screen name="[slug]" options={{ title: t("saved.offlineRoute") }} />
      <Stack.Screen name="scan" options={{ title: t("scan.title") }} />
    </Stack>
  );
}
