import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet, useColorScheme } from "react-native";
import Toast from "react-native-toast-message";
import { useCatalogSync } from "@/hooks/use-catalog";
import { ensureRoutesDirectory } from "@/services/offline-storage";
import { useSettingsStore } from "@/stores/settings-store";
import { t } from "@/lib/i18n";
import { logInfo } from "@/lib/logger";

const queryClient = new QueryClient();

function CatalogSyncProvider({ children }: { children: React.ReactNode }) {
  const { mutate: syncCatalog } = useCatalogSync();

  useEffect(() => {
    logInfo("app", "Initializing: ensuring routes directory and starting catalog sync");
    ensureRoutesDirectory();
    syncCatalog(undefined, {
      onSuccess: (result) => {
        if (result.synced) {
          Toast.show({
            type: "success",
            text1: t("toast.catalogSynced"),
            visibilityTime: 2000,
          });
        }
      },
      onError: () => {
        Toast.show({
          type: "error",
          text1: t("toast.catalogError"),
          visibilityTime: 4000,
        });
      },
    });
  }, [syncCatalog]);

  return <>{children}</>;
}

export default function RootLayout() {
  const theme = useSettingsStore((state) => state.theme);
  const systemScheme = useColorScheme();
  const isDark = theme === "dark" || (theme === "system" && systemScheme === "dark");

  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <CatalogSyncProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
          </Stack>
          <StatusBar style={isDark ? "light" : "dark"} />
        </CatalogSyncProvider>
        <Toast />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
