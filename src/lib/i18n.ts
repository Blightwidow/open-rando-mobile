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
    "download.chooseStyle": "Choisir le style de carte",
    "download.styleLight": "Clair",
    "download.styleDark": "Sombre",

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
    "settings.storageUsed": "Espace utilisé",
    "download.cellularWarning":
      "Vous êtes sur données mobiles. Ce téléchargement peut consommer plusieurs dizaines de Mo.",
    "download.cellularContinue": "Continuer",
    "download.sizeTitle": "Téléchargement hors-ligne",
    "download.sizeMessage":
      "Cette randonnée nécessite {newSize} à télécharger ({totalSize} au total). Continuer ?",
    "download.sizeMessageNoNew":
      "Les fichiers nécessaires sont déjà présents ({totalSize}). Continuer ?",
    "download.sizeContinue": "Télécharger",
    "download.sizeEstimating": "Calcul de la taille…",
    "download.sizeEstimateFailed":
      "Impossible d'estimer la taille du téléchargement.",
    "notification.downloading": "Téléchargement… {progress}%",
    "notification.downloadComplete": "Téléchargement terminé ✓",
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
    "settings.appearance": "Apparence",
    "settings.theme.light": "Clair",
    "settings.theme.dark": "Sombre",
    "settings.theme.system": "Système",

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

    // Filters
    "filters.title": "Filtres",
    "filters.region": "Région",
    "filters.terrain": "Terrain",
    "filters.clear": "Réinitialiser",
    "filters.noResults": "Aucune randonnée ne correspond aux filtres",

    // POI types
    "poi.train_station": "Gare",
    "poi.bus_stop": "Arrêt de bus",
    "poi.camping": "Camping",
    "poi.hotel": "Hébergement",
    "poi.viewLink": "Voir les horaires / infos",
    "poi.findOnMaps": "Rechercher sur Google Maps",
    "poi.distanceFromStart": "depuis le départ",

    // GPS
    "gps.permissionRequired":
      "L'accès à la localisation est nécessaire pour afficher votre position sur la carte.",
    "gps.permissionDenied":
      "L'accès à la localisation a été refusé. Activez-le dans les réglages de votre appareil.",
    "gps.searching": "Recherche du signal GPS…",

    // Follow route
    "tabs.active": "En cours",
    "active.title": "Suivre l'itinéraire",
    "active.stop": "Arrêter",
    "route.followRoute": "Suivre cet itinéraire",

    // Toast
    "toast.catalogSynced": "Catalogue mis à jour",
    "toast.catalogError": "Impossible de charger le catalogue",
    "toast.downloadError": "Échec du téléchargement",
    "toast.sectionDownloadStarted": "Téléchargement lancé",
    "toast.sectionInvalidQr": "QR code invalide",
    "toast.sectionNotFound": "Randonnée introuvable dans le catalogue",
    "toast.sectionAlreadySaved": "Section déjà sauvegardée",

    // QR scan
    "scan.title": "Scanner un QR code",
    "scan.permission":
      "Autorisez l'accès à la caméra pour scanner un QR code de randonnée.",
    "scan.openSettings": "Ouvrir les réglages",
    "scan.instruction": "Pointez vers un QR code de randonnée",
    "scan.notFound":
      "Cette randonnée n'est pas dans le catalogue. Essayez de rafraîchir l'onglet Explorer.",
    "scan.alreadySaved": "Cette section est déjà sauvegardée.",
    "scan.invalidQr": "Ce QR code ne contient pas un lien de randonnée valide.",
    "scan.downloadStarted": "Téléchargement lancé !",

    // Sections
    "saved.sectionLabel": "km {from} → km {to}",

    // Developer
    "settings.developer": "Développeur",
    "settings.exportLog": "Exporter le journal de debug",
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
    "download.chooseStyle": "Choose map style",
    "download.styleLight": "Light",
    "download.styleDark": "Dark",

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
    "settings.storageUsed": "Storage used",
    "download.cellularWarning":
      "You are on mobile data. This download may use several tens of MB.",
    "download.cellularContinue": "Continue",
    "download.sizeTitle": "Offline download",
    "download.sizeMessage":
      "This route needs {newSize} to download ({totalSize} total). Continue?",
    "download.sizeMessageNoNew":
      "All required files are already present ({totalSize}). Continue?",
    "download.sizeContinue": "Download",
    "download.sizeEstimating": "Estimating size…",
    "download.sizeEstimateFailed": "Could not estimate download size.",
    "notification.downloading": "Downloading... {progress}%",
    "notification.downloadComplete": "Download complete ✓",
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
    "settings.appearance": "Appearance",
    "settings.theme.light": "Light",
    "settings.theme.dark": "Dark",
    "settings.theme.system": "System",

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

    // Filters
    "filters.title": "Filters",
    "filters.region": "Region",
    "filters.terrain": "Terrain",
    "filters.clear": "Clear All",
    "filters.noResults": "No routes match the selected filters",

    // POI types
    "poi.train_station": "Train Station",
    "poi.bus_stop": "Bus Stop",
    "poi.camping": "Camping",
    "poi.hotel": "Accommodation",
    "poi.viewLink": "View timetable / info",
    "poi.findOnMaps": "Search on Google Maps",
    "poi.distanceFromStart": "from start",

    // GPS
    "gps.permissionRequired":
      "Location access is needed to show your position on the trail map.",
    "gps.permissionDenied":
      "Location access was denied. Enable it in your device settings.",
    "gps.searching": "Searching for GPS signal…",

    // Follow route
    "tabs.active": "Active",
    "active.title": "Follow Route",
    "active.stop": "Stop",
    "route.followRoute": "Follow this route",

    // Toast
    "toast.catalogSynced": "Catalog updated",
    "toast.catalogError": "Failed to load catalog",
    "toast.downloadError": "Download failed",
    "toast.sectionDownloadStarted": "Download started",
    "toast.sectionInvalidQr": "Invalid QR code",
    "toast.sectionNotFound": "Route not found in catalog",
    "toast.sectionAlreadySaved": "Section already saved",

    // QR scan
    "scan.title": "Scan QR Code",
    "scan.permission": "Allow camera access to scan a hiking route QR code.",
    "scan.openSettings": "Open Settings",
    "scan.instruction": "Point at a hiking route QR code",
    "scan.notFound": "This route is not in the catalog. Try refreshing the Explore tab.",
    "scan.alreadySaved": "This section is already saved.",
    "scan.invalidQr": "This QR code does not contain a valid route link.",
    "scan.downloadStarted": "Download started!",

    // Sections
    "saved.sectionLabel": "km {from} → km {to}",

    // Developer
    "settings.developer": "Developer",
    "settings.exportLog": "Export Debug Log",
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
