import { useMemo, useLayoutEffect } from "react";
import { FlatList, Pressable, StyleSheet, Text, View, Alert } from "react-native";
import { useRouter, useNavigation } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useDownloadStore } from "@/stores/download-store";
import { getRouteById } from "@/services/database";
import { formatDistance, formatElevation } from "@/lib/format";
import { spacing, fontSize, borderRadius } from "@/lib/theme";
import { useColors } from "@/hooks/use-colors";
import { t } from "@/lib/i18n";
import { useLocale } from "@/hooks/use-locale";
import type { Route, SectionEntry } from "@/lib/types";

type SavedItem =
  | { type: "download"; route: Route }
  | { type: "section"; route: Route; section: SectionEntry };

export default function SavedScreen() {
  useLocale();
  const colors = useColors();
  const router = useRouter();
  const navigation = useNavigation();
  const downloads = useDownloadStore((state) => state.downloads);
  const sections = useDownloadStore((state) => state.sections);
  const removeDownload = useDownloadStore((state) => state.removeDownload);
  const removeSection = useDownloadStore((state) => state.removeSection);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => router.push("/saved/scan")}
          style={{ padding: spacing.small }}
        >
          <Ionicons name="add" size={28} color={colors.primary} />
        </Pressable>
      ),
    });
  }, [navigation, colors, router]);

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
        sectionLabel: {
          fontSize: fontSize.small,
          color: colors.primary,
          marginBottom: 2,
        },
      }),
    [colors],
  );

  const downloadedIds = Object.entries(downloads)
    .filter(([, state]) => state.status === "complete")
    .map(([id]) => id);

  const sectionEntries = Object.values(sections);

  // Collect all route IDs we need (from full downloads + sections)
  const allRouteIds = useMemo(() => {
    const ids = new Set(downloadedIds);
    for (const section of sectionEntries) {
      ids.add(section.routeId);
    }
    return [...ids];
  }, [downloadedIds, sectionEntries]);

  const { data: routeMap } = useQuery({
    queryKey: ["saved-routes", allRouteIds],
    queryFn: async () => {
      const map: Record<string, Route> = {};
      for (const id of allRouteIds) {
        const route = await getRouteById(id);
        if (route) map[id] = route;
      }
      return map;
    },
    enabled: allRouteIds.length > 0,
  });

  // Build unified list: full downloads + sections
  const savedItems: SavedItem[] = useMemo(() => {
    if (!routeMap) return [];
    const items: SavedItem[] = [];

    // Full route downloads (exclude routes that only exist because of sections)
    for (const routeId of downloadedIds) {
      const route = routeMap[routeId];
      if (route) {
        items.push({ type: "download", route });
      }
    }

    // Section entries
    for (const section of sectionEntries) {
      const route = routeMap[section.routeId];
      if (route) {
        items.push({ type: "section", route, section });
      }
    }

    return items;
  }, [routeMap, downloadedIds, sectionEntries]);

  const handleRemoveDownload = (route: Route) => {
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

  const handleRemoveSection = (route: Route, sectionId: string) => {
    Alert.alert(
      t("saved.removeTitle"),
      t("saved.removeMessage", { name: route.path_name }),
      [
        { text: t("settings.cancel"), style: "cancel" },
        {
          text: t("download.remove"),
          style: "destructive",
          onPress: () => removeSection(sectionId),
        },
      ],
    );
  };

  if (savedItems.length === 0 && allRouteIds.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>{t("saved.empty")}</Text>
        <Text style={styles.emptyDetail}>{t("saved.emptyDetail")}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={savedItems}
      keyExtractor={(item) =>
        item.type === "section" ? item.section.sectionId : item.route.id
      }
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <Pressable
          style={styles.card}
          onPress={() => router.push(`/saved/${item.route.slug}`)}
        >
          <View style={styles.cardHeader}>
            <View style={styles.pathBadge}>
              <Text style={styles.pathBadgeText}>{item.route.path_ref}</Text>
            </View>
          </View>
          <Text style={styles.pathName} numberOfLines={1}>
            {item.route.path_name}
          </Text>
          {item.type === "section" && (
            <Text style={styles.sectionLabel}>
              {t("saved.sectionLabel", {
                from: item.section.fromKm.toFixed(1),
                to: item.section.toKm.toFixed(1),
              })}
            </Text>
          )}
          <View style={styles.stats}>
            <Text style={styles.stat}>
              {item.type === "section"
                ? formatDistance(item.section.toKm - item.section.fromKm)
                : formatDistance(item.route.distance_km)}
            </Text>
            <Text style={styles.statSeparator}>·</Text>
            <Text style={styles.stat}>
              ↑ {formatElevation(item.route.elevation_gain_m)}
            </Text>
          </View>
          <Pressable
            style={styles.removeButton}
            onPress={() =>
              item.type === "section"
                ? handleRemoveSection(item.route, item.section.sectionId)
                : handleRemoveDownload(item.route)
            }
          >
            <Text style={styles.removeText}>{t("download.remove")}</Text>
          </Pressable>
        </Pressable>
      )}
    />
  );
}
