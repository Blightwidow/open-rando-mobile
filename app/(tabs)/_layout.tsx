import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useGpsStore } from "@/stores/gps-store";
import { t } from "@/lib/i18n";
import { useLocale } from "@/hooks/use-locale";
import { useColors } from "@/hooks/use-colors";

export default function TabLayout() {
  useLocale();
  const colors = useColors();
  const isTracking = useGpsStore((state) => state.isTracking);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarStyle: { backgroundColor: colors.background },
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="explore"
        options={{
          title: t("tabs.explore"),
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="compass-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: t("tabs.saved"),
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="download-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="active"
        options={{
          title: t("tabs.active"),
          headerShown: false,
          href: isTracking ? "/active" : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="navigate" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t("tabs.settings"),
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
