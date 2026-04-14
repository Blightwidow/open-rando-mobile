# Technical Architecture

## Stack

| Layer        | Choice                                                    | Why                                                                                                  |
| ------------ | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Framework    | React Native + Expo (SDK 52+)                             | TypeScript overlap with web project; Expo eliminates native build maintenance; solo dev productivity |
| Router       | Expo Router (file-based)                                  | Convention over configuration; deep linking for free                                                 |
| Maps         | MapLibre React Native (`@maplibre/maplibre-react-native`) | Free/open source (BSD); offline tile packs; vector+raster support; aligns with GPLv3                 |
| State        | Zustand (global) + TanStack Query (data fetching)         | Lightweight, TS-first, no boilerplate; Query handles cache/stale/offline                             |
| Offline DB   | expo-sqlite (SQLite)                                      | Catalog indexed for filter queries; survives app backgrounding                                       |
| File storage | expo-file-system                                          | GPX, GeoJSON, elevation JSON per hike                                                                |
| GPS          | expo-location                                             | Foreground + background (Phase 2)                                                                    |
| Charts       | react-native-svg                                          | Port web's SVG elevation chart directly                                                              |
| i18n         | Custom (port from web)                                    | Reuse existing FR/EN dictionary; 100+ keys already translated                                        |
| Testing      | Vitest (unit) + React Native Testing Library (components) | Fast, TS-native                                                                                      |
| CI           | GitHub Actions — lint + typecheck on push/PR to main      | Catches errors before merge; no EAS yet                                                              |

**Rejected alternatives**: Flutter (Dart learning curve, no type sharing), Capacitor (WebView maps too slow for GPS), native Swift/Kotlin (two codebases for solo dev).

## Data Flow

```
rando.dammaretz.fr/data/catalog.json  (228KB, all hike metadata)
         |  fetch on app launch (if online)
         v
    SQLite (expo-sqlite)
         |  indexed for filter queries
         v
    TanStack Query cache -> Zustand store -> UI

rando.dammaretz.fr/data/{gpx,geojson,elevation}/{id}.*
         |  fetch on "Save for offline"
         v
    expo-file-system (flat files on device)
         +
    MapLibre offline pack (tiles for hike bbox, z10-15)
```

## Data Sources

The backend is fully static (no API). The app consumes pre-generated files:

| File                    | URL Pattern                                   | Size       | When Fetched               |
| ----------------------- | --------------------------------------------- | ---------- | -------------------------- |
| `catalog.json`          | `rando.dammaretz.fr/data/catalog.json`        | ~228KB     | On app launch (background) |
| `{id}.gpx`              | `rando.dammaretz.fr/data/gpx/{id}.gpx`        | ~167KB avg | On "Save offline"          |
| `{id}.json` (GeoJSON)   | `rando.dammaretz.fr/data/geojson/{id}.json`   | ~42KB avg  | On "Save offline"          |
| `{id}.json` (elevation) | `rando.dammaretz.fr/data/elevation/{id}.json` | ~29KB avg  | On "Save offline"          |

## Catalog Sync Strategy

1. On launch (if online): fetch `catalog.json`, compare `generated_at` with local version
2. If newer: parse JSON, upsert into SQLite (~218 hikes, <1s)
3. If offline: use local SQLite (always available after first launch)
4. Route files (GPX/GeoJSON/elevation) are immutable per hike ID — download once, never re-fetch
5. If hike's `last_updated` changes in catalog: mark local files stale, re-download on next view
6. No build-time bundling — app ships empty, fetches on first launch

## Offline Storage

Three storage layers:

| Layer       | Technology                    | Content                                                        |
| ----------- | ----------------------------- | -------------------------------------------------------------- |
| Catalog     | expo-sqlite (SQLite)          | All hike metadata from catalog.json, indexed for search/filter |
| Route files | expo-file-system (flat files) | GPX, GeoJSON, elevation JSON per hike                          |
| Map tiles   | MapLibre offline packs        | Raster/vector tiles for downloaded hike areas                  |

### Storage Budget

| Content                                | Per Hike | Full Catalog |
| -------------------------------------- | -------- | ------------ |
| Route data (GPX + GeoJSON + elevation) | ~238KB   | ~52MB        |
| Map tiles (bbox z10-15)                | ~5-15MB  | ~1-3GB       |
| Catalog metadata (SQLite)              | —        | ~1MB         |

### Map Tile Strategy

- **Online default**: OpenTopoMap raster tiles (same as web)
- **Offline**: when user downloads a hike, also download raster tiles for hike's `bbox` at zoom levels 10-15 via MapLibre offline pack API
- Show download progress with estimated size
- Show storage usage in settings, allow per-hike deletion

## Navigation Structure

```
(tabs)/
  explore/           -- Browse & search hikes
    index.tsx        -- Hike list + filter bottom sheet
    map.tsx          -- Map view with all trails
    [slug].tsx       -- Hike detail
  saved/             -- Downloaded hikes
    index.tsx        -- Offline library
    [slug].tsx       -- Offline hike detail
  active/            -- GPS tracking (visible only during active hike)
    index.tsx        -- Full-screen map + progress + elevation
  settings/
    index.tsx        -- Language, storage, about, legal
```

Three primary tabs. A 4th "Active" tab appears only when a hike is in progress.

## GPS Architecture

### Phase 1: Foreground Only

```
expo-location (foreground subscription, every 5s)
  -> LocationService (filter noise, compute distance-from-trail)
    -> Zustand GPS store { position, isOnTrail, distanceFromTrail, progressAlongTrail }
      -> Map blue dot + stats overlay
```

### Phase 2: Background Location

- `expo-location` `startLocationUpdatesAsync` with `TaskManager`
- Required for off-trail alerts when screen is locked
- Battery-conscious: reduce update frequency to every 15s when screen is off
- Clear user messaging about battery impact and permission rationale

## Critical Source Files to Port from Web Project

| File                                          | What to Port                                                                                                           |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `website/src/lib/catalog.ts`                  | `Hike`, `StationInfo`, `HikeStep`, `ElevationProfile` interfaces; `formatDuration`, `getStationTimetableUrl` utilities |
| `website/src/lib/i18n.ts`                     | Full FR/EN translation dictionary (100+ keys) + `t()` function                                                         |
| `website/src/components/ElevationChart.astro` | SVG elevation chart logic (slope coloring, timeline, step boundaries) -> react-native-svg                              |
| `website/src/components/HikeFilters.astro`    | Filter dimensions + logic -> SQLite WHERE clauses                                                                      |
| `website/src/pages/app/hike/[slug].astro`     | Detail screen layout, section selector, stats grid                                                                     |
