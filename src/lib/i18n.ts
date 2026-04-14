import { getLocales } from "expo-localization";

export type Locale = "fr" | "en";

const translations: Record<Locale, Record<string, string>> = {
  fr: {
    // Tabs
    "tabs.explore": "Explorer",
    "tabs.saved": "Sauvegardés",
    "tabs.settings": "Réglages",

    // Explore
    "explore.title": "Explorer les randonnées",
    "explore.routeDetails": "Détails de la randonnée",
    "explore.loading": "Chargement du catalogue…",
    "explore.error": "Impossible de charger les randonnées",
    "explore.empty": "Aucune randonnée disponible",
    "explore.emptyDetail":
      "Tirez vers le bas pour actualiser ou vérifiez votre connexion",
    "explore.list": "Liste",
    "explore.map": "Carte",
    "explore.mapLoading": "Chargement des sentiers…",

    // Route detail
    "route.notFound": "Randonnée introuvable",
    "route.distance": "Distance",
    "route.elevationGain": "Dénivelé ↑",
    "route.elevationLoss": "Dénivelé ↓",
    "route.maxAltitude": "Altitude max",
    "route.trailMap": "Carte du sentier",
    "route.elevationProfile": "Profil altimétrique",

    // Download
    "download.idle": "Télécharger hors-ligne",
    "download.downloading": "Téléchargement… {progress}%",
    "download.complete": "✓ Téléchargé",
    "download.retry": "Réessayer le téléchargement",
    "download.remove": "Supprimer",

    // Saved
    "saved.title": "Randonnées sauvegardées",
    "saved.offlineRoute": "Randonnée hors-ligne",
    "saved.empty": "Aucune randonnée sauvegardée",
    "saved.emptyDetail":
      "Téléchargez des randonnées depuis l'onglet Explorer pour les utiliser hors-ligne",
    "saved.removeTitle": "Supprimer le téléchargement",
    "saved.removeMessage": "Supprimer les données hors-ligne de « {name} » ?",
    "saved.failedLoad": "Impossible de charger la randonnée",

    // Settings
    "settings.title": "Réglages",
    "settings.storage": "Stockage",
    "settings.downloadedRoutes": "Randonnées téléchargées",
    "settings.deleteAll": "Supprimer tous les téléchargements",
    "settings.deleteConfirmTitle": "Supprimer tous les téléchargements",
    "settings.deleteConfirmMessage":
      "Supprimer toutes les données de randonnées téléchargées ? Cette action est irréversible.",
    "settings.deleteConfirmAction": "Tout supprimer",
    "settings.cancel": "Annuler",
    "settings.about": "À propos",
    "settings.version": "Version",
    "settings.description":
      "Application compagnon pour TrainRando — randonnées hors-ligne entre gares sur les sentiers GR français.",
    "settings.language": "Langue",

    // Difficulty
    "difficulty.easy": "Facile",
    "difficulty.moderate": "Modéré",
    "difficulty.difficult": "Difficile",
    "difficulty.very_difficult": "Très difficile",

    // Terrain
    "terrain.coastal": "Littoral",
    "terrain.hills": "Collines",
    "terrain.mountain": "Montagne",
    "terrain.plains": "Plaines",
    "terrain.forest": "Forêt",
  },
  en: {
    // Tabs
    "tabs.explore": "Explore",
    "tabs.saved": "Saved",
    "tabs.settings": "Settings",

    // Explore
    "explore.title": "Explore Routes",
    "explore.routeDetails": "Route Details",
    "explore.loading": "Loading catalog...",
    "explore.error": "Failed to load routes",
    "explore.empty": "No routes available",
    "explore.emptyDetail": "Pull to refresh or check your connection",
    "explore.list": "List",
    "explore.map": "Map",
    "explore.mapLoading": "Loading trails…",

    // Route detail
    "route.notFound": "Route not found",
    "route.distance": "Distance",
    "route.elevationGain": "Elevation ↑",
    "route.elevationLoss": "Elevation ↓",
    "route.maxAltitude": "Max altitude",
    "route.trailMap": "Trail Map",
    "route.elevationProfile": "Elevation Profile",

    // Download
    "download.idle": "Download for Offline",
    "download.downloading": "Downloading... {progress}%",
    "download.complete": "✓ Downloaded",
    "download.retry": "Retry Download",
    "download.remove": "Remove",

    // Saved
    "saved.title": "Saved Routes",
    "saved.offlineRoute": "Offline Route",
    "saved.empty": "No saved routes",
    "saved.emptyDetail": "Download routes from the Explore tab to use offline",
    "saved.removeTitle": "Remove Download",
    "saved.removeMessage": 'Remove offline data for "{name}"?',
    "saved.failedLoad": "Failed to load route",

    // Settings
    "settings.title": "Settings",
    "settings.storage": "Storage",
    "settings.downloadedRoutes": "Downloaded routes",
    "settings.deleteAll": "Delete All Downloads",
    "settings.deleteConfirmTitle": "Delete All Downloads",
    "settings.deleteConfirmMessage":
      "Remove all downloaded route data? This cannot be undone.",
    "settings.deleteConfirmAction": "Delete All",
    "settings.cancel": "Cancel",
    "settings.about": "About",
    "settings.version": "Version",
    "settings.description":
      "Companion app for TrainRando — offline hiking between train stations on French GR trails.",
    "settings.language": "Language",

    // Difficulty
    "difficulty.easy": "Easy",
    "difficulty.moderate": "Moderate",
    "difficulty.difficult": "Difficult",
    "difficulty.very_difficult": "Very Difficult",

    // Terrain
    "terrain.coastal": "Coastal",
    "terrain.hills": "Hills",
    "terrain.mountain": "Mountain",
    "terrain.plains": "Plains",
    "terrain.forest": "Forest",
  },
};

let currentLocale: Locale = getSystemLocale();

export function getSystemLocale(): Locale {
  const deviceLocale = getLocales()[0]?.languageCode ?? "en";
  return deviceLocale === "fr" ? "fr" : "en";
}

export function setLocale(locale: Locale): void {
  currentLocale = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

export function t(key: string, params?: Record<string, string | number>): string {
  const value = translations[currentLocale]?.[key] ?? translations.en[key] ?? key;
  if (!params) return value;
  return Object.entries(params).reduce(
    (result, [placeholder, replacement]) =>
      result.replace(`{${placeholder}}`, String(replacement)),
    value,
  );
}
