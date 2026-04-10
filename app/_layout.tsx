import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native";
import { useCatalogSync } from "@/hooks/use-catalog";
import { ensureHikesDirectory } from "@/services/offline-storage";

const queryClient = new QueryClient();

function CatalogSyncProvider({ children }: { children: React.ReactNode }) {
  const { mutate: syncCatalog } = useCatalogSync();

  useEffect(() => {
    ensureHikesDirectory();
    syncCatalog();
  }, [syncCatalog]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <CatalogSyncProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
          </Stack>
          <StatusBar style="auto" />
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
