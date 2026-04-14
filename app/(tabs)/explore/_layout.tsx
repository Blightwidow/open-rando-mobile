import { Stack } from "expo-router";
import { t } from "@/lib/i18n";
import { useLocale } from "@/hooks/use-locale";

export default function ExploreLayout() {
  useLocale();

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: t("explore.title") }} />
      <Stack.Screen name="[slug]" options={{ title: t("explore.routeDetails") }} />
    </Stack>
  );
}
