import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet, useColorScheme } from "react-native";
import { useCatalogSync } from "@/hooks/use-catalog";
import { ensureRoutesDirectory } from "@/services/offline-storage";
import { useSettingsStore } from "@/stores/settings-store";

const queryClient = new QueryClient();

function CatalogSyncProvider({ children }: { children: React.ReactNode }) {
  const { mutate: syncCatalog } = useCatalogSync();

  useEffect(() => {
    ensureRoutesDirectory();
    syncCatalog();
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
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
