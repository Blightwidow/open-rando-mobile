# open-rando-mobile

Companion mobile app for open-rando (rando.dammaretz.fr) — offline hiking between train stations on French GR/GRP/PR trails.

## Project Context

- **Web project**: `../open-rando` (Python pipeline + Astro static site)
- **This app**: React Native + Expo field companion — offline routes, GPS on trail, real-time progress
- **Data source**: static files at `rando.dammaretz.fr/data/` (catalog.json, GPX, GeoJSON, elevation profiles)
- **No backend API** — the app fetches pre-generated static files
- **Philosophy**: open source (GPLv3), privacy-first (no accounts, no analytics, no cookies), bilingual FR/EN
- **Distribution**: FDroid (Android) + sideloading — no official app stores for now

## Stack

- **Framework**: React Native + Expo (SDK 54), TypeScript strict mode
- **Router**: Expo Router (file-based)
- **Maps**: MapLibre React Native (`@maplibre/maplibre-react-native`) with OpenFreeMap tiles
- **State**: Zustand (global, persisted to AsyncStorage) + TanStack Query (data fetching/caching)
- **Offline DB**: expo-sqlite for catalog metadata, expo-file-system for route files (GeoJSON, elevation)
- **GPS**: expo-location (not yet implemented)
- **Charts**: react-native-svg (not yet implemented)
- **Package manager**: bun (not npm)
- **Testing**: Vitest (unit) + React Native Testing Library (components) — not yet configured
- **Builds**: local only (`bunx expo run:ios` / `bunx expo run:android`), no EAS

## Documentation

- `docs/PRODUCT_ROADMAP.md` — feature phases, screen descriptions
- `docs/TECHNICAL_ARCHITECTURE.md` — stack details, data flow, offline strategy, navigation, GPS architecture, files to port from web
- `docs/IMPLEMENTATION_PLAN.md` — sprint plan with checkbox progress, current status summary
- `docs/RISKS_AND_DECISIONS.md` — risks, mitigations, open decisions (tile source, crash reporting, distribution)

## Code Conventions

- TypeScript strict mode — zero errors required (`bunx tsc --noEmit`)
- No abbreviated variable names — spell everything out
- Descriptive names even in loops
- Follow Expo Router file-based routing conventions
- `@/` path alias resolves to `src/`
- Types ported from web project in `src/lib/types.ts`
- Test behavior not implementation

## Key Commands

```bash
# Development
bun start                    # expo start (dev server)
bun run ios                  # build + run on iOS simulator
bun run android              # build + run on Android emulator/device

# Type checking
bunx tsc --noEmit

# Dependencies
bun install                  # install dependencies
bun add <package>            # add a dependency

# Rebuild native (after changing app.json plugins or native deps)
rm -rf ios && bun run ios    # clean rebuild iOS
rm -rf android && bun run android  # clean rebuild Android
```

## Architecture

```
app/
  index.tsx              -- Redirects to /explore on launch
  _layout.tsx            -- Root: QueryClientProvider, GestureHandler, catalog sync
  (tabs)/
    _layout.tsx          -- Bottom tabs: Explore, Saved, Settings
    explore/
      _layout.tsx        -- Stack navigator
      index.tsx          -- Hike list (FlatList, pull-to-refresh)
      [slug].tsx         -- Hike detail + download button + trail map
    saved/
      _layout.tsx        -- Stack navigator
      index.tsx          -- Downloaded hikes list
      [slug].tsx         -- Offline hike detail + trail map
    settings/
      index.tsx          -- Storage management, about
src/
  components/            -- HikeCard, TrailMap, DownloadButton, DifficultyBadge, etc.
  hooks/                 -- use-catalog, use-download, use-offline-hike
  lib/                   -- types, constants, format utilities, theme
  services/              -- api, database (SQLite), catalog-sync, offline-storage
  stores/                -- download-store (Zustand, persisted)
```

## Data Flow

1. **Launch**: `app/_layout.tsx` triggers catalog sync
2. **Sync**: `catalog-sync.ts` fetches `catalog.json`, compares `generated_at` with SQLite metadata, upserts if newer
3. **Browse**: `useHikes()` reads from SQLite via TanStack Query
4. **Download**: `download-store` orchestrates fetching GeoJSON + elevation → writes to `documentDirectory/hikes/{id}/`
5. **Offline view**: `use-offline-hike` reads local files, `TrailMap` renders GeoJSON on MapLibre
