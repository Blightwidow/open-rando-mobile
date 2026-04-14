import { Stack } from "expo-router";
import { t } from "@/lib/i18n";
import { useLocale } from "@/hooks/use-locale";
import { useColors } from "@/hooks/use-colors";

export default function ExploreLayout() {
  useLocale();
  const colors = useColors();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
      }}
    >
      <Stack.Screen name="index" options={{ title: t("explore.title") }} />
      <Stack.Screen name="[slug]" options={{ title: t("explore.routeDetails") }} />
    </Stack>
  );
}
