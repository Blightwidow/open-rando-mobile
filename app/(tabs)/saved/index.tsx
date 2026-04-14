import { useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useDownloadStore } from "@/stores/download-store";
import { getRouteById } from "@/services/database";
import { formatDistance, formatElevation } from "@/lib/format";
import { spacing, fontSize, borderRadius } from "@/lib/theme";
import { useColors } from "@/hooks/use-colors";
import { t } from "@/lib/i18n";
import { useLocale } from "@/hooks/use-locale";
import type { Route } from "@/lib/types";

export default function SavedScreen() {
  useLocale();
  const colors = useColors();
  const router = useRouter();
  const downloads = useDownloadStore((state) => state.downloads);
  const removeDownload = useDownloadStore((state) => state.removeDownload);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        list: {
          paddingVertical: spacing.small,
          backgroundColor: colors.background,
          flexGrow: 1,
        },
        centered: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: spacing.large,
        },
        emptyText: {
          fontSize: fontSize.title,
          fontWeight: "600",
          color: colors.text,
        },
        emptyDetail: {
          marginTop: spacing.small,
          fontSize: fontSize.body,
          color: colors.textSecondary,
          textAlign: "center",
        },
        card: {
          backgroundColor: colors.background,
          borderRadius: borderRadius.large,
          padding: spacing.medium,
          marginHorizontal: spacing.medium,
          marginVertical: spacing.small / 2,
          borderWidth: 1,
          borderColor: colors.border,
        },
        cardHeader: {
          flexDirection: "row",
          alignItems: "center",
          marginBottom: spacing.small,
        },
        pathBadge: {
          backgroundColor: colors.primary,
          borderRadius: borderRadius.small,
          paddingHorizontal: spacing.small,
          paddingVertical: 2,
        },
        pathBadgeText: {
          color: "#fff",
          fontSize: fontSize.small,
          fontWeight: "700",
        },
        pathName: {
          fontSize: fontSize.subtitle,
          fontWeight: "600",
          color: colors.text,
          marginBottom: 2,
        },
        stats: {
          flexDirection: "row",
          alignItems: "center",
          marginBottom: spacing.small,
        },
        stat: {
          fontSize: fontSize.body,
          color: colors.textSecondary,
        },
        statSeparator: {
          fontSize: fontSize.body,
          color: colors.border,
          marginHorizontal: spacing.extraSmall,
        },
        removeButton: {
          alignSelf: "flex-start",
        },
        removeText: {
          color: colors.error,
          fontSize: fontSize.small,
        },
      }),
    [colors],
  );

  const downloadedIds = Object.entries(downloads)
    .filter(([, state]) => state.status === "complete")
    .map(([id]) => id);

  const { data: routes } = useQuery({
    queryKey: ["saved-routes", downloadedIds],
    queryFn: async () => {
      const results: Route[] = [];
      for (const id of downloadedIds) {
        const route = await getRouteById(id);
        if (route) results.push(route);
      }
      return results;
    },
    enabled: downloadedIds.length > 0,
  });

  const handleRemove = (route: Route) => {
    Alert.alert(
      t("saved.removeTitle"),
      t("saved.removeMessage", { name: route.path_name }),
      [
        { text: t("settings.cancel"), style: "cancel" },
        {
          text: t("download.remove"),
          style: "destructive",
          onPress: () => removeDownload(route.id),
        },
      ],
    );
  };

  if (downloadedIds.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>{t("saved.empty")}</Text>
        <Text style={styles.emptyDetail}>{t("saved.emptyDetail")}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={routes ?? []}
      keyExtractor={(item) => item.id}
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <Pressable style={styles.card} onPress={() => router.push(`/saved/${item.slug}`)}>
          <View style={styles.cardHeader}>
            <View style={styles.pathBadge}>
              <Text style={styles.pathBadgeText}>{item.path_ref}</Text>
            </View>
          </View>
          <Text style={styles.pathName} numberOfLines={1}>
            {item.path_name}
          </Text>
          <View style={styles.stats}>
            <Text style={styles.stat}>{formatDistance(item.distance_km)}</Text>
            <Text style={styles.statSeparator}>·</Text>
            <Text style={styles.stat}>↑ {formatElevation(item.elevation_gain_m)}</Text>
          </View>
          <Pressable style={styles.removeButton} onPress={() => handleRemove(item)}>
            <Text style={styles.removeText}>{t("download.remove")}</Text>
          </Pressable>
        </Pressable>
      )}
    />
  );
}
