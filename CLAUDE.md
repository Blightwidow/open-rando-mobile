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
- **Linting**: ESLint with eslint-config-expo (flat config)
- **Testing**: Vitest (unit) + React Native Testing Library (components) — not yet configured
- **CI**: GitHub Actions — lint + typecheck on push/PR to main
- **Builds**: local only (`bunx expo run:ios` / `bunx expo run:android`), no EAS

## Documentation

- `docs/PRODUCT_ROADMAP.md` — feature phases, screen descriptions
- `docs/TECHNICAL_ARCHITECTURE.md` — stack details, data flow, offline strategy, navigation, GPS architecture, files to port from web
- `docs/IMPLEMENTATION_PLAN.md` — sprint plan with checkbox progress, current status summary
- `docs/RISKS_AND_DECISIONS.md` — risks, mitigations, open decisions (tile source, crash reporting, distribution)

## Code Conventions

- TypeScript strict mode — zero errors required (`bun run typecheck`)
- ESLint must pass — zero warnings/errors (`bun run lint`)
- CI runs lint + typecheck on every push to main and on PRs
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

# Linting
bun run lint                 # run ESLint
bun run lint --fix           # auto-fix lint errors

# Type checking
bun run typecheck            # tsc --noEmit

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
  +native-intent.tsx     -- Routes opened GPX files to saved/import
  _layout.tsx            -- Root: QueryClientProvider, GestureHandler, catalog sync
  (tabs)/
    _layout.tsx          -- Bottom tabs: Explore, Saved, Settings
    explore/
      _layout.tsx        -- Stack navigator
      index.tsx          -- Hike list (FlatList, pull-to-refresh)
      [slug].tsx         -- Hike detail + download button + trail map
    saved/
      _layout.tsx        -- Stack navigator
      index.tsx          -- Downloaded hikes list (+ GPX picker, QR scan buttons)
      [slug].tsx         -- Offline hike detail + trail map
      import.tsx         -- GPX import (parse, pick map style, start download)
      scan.tsx           -- QR scan for hike sections
    settings/
      index.tsx          -- Storage management, about
src/
  components/            -- HikeCard, TrailMap, DownloadButton, DifficultyBadge, etc.
  hooks/                 -- use-catalog, use-download, use-offline-hike
  lib/                   -- types, constants, format utilities, theme, gpx, poi-grid, poi-linking, route-pois
  services/              -- api, database (SQLite), catalog-sync, offline-storage, gpx-import, poi-data, route-lookup
  stores/                -- download-store, imported-route-store (Zustand, persisted)
```

## Data Flow

1. **Launch**: `app/_layout.tsx` triggers catalog sync
2. **Sync**: `catalog-sync.ts` fetches `catalog.json`, compares `generated_at` with SQLite metadata, upserts if newer
3. **Browse**: `useHikes()` reads from SQLite via TanStack Query
4. **Download**: `download-store` orchestrates fetching GeoJSON + elevation (paths from the catalog: `tracks/{id}/…`) + POIs (`links/{id}.json` joined with the `pois/{col}_{row}.json` squares) → writes to `documentDirectory/hikes/{id}/` (`geojson.json`, `elevation.json`, `pois.json`)
5. **Offline view**: `use-offline-hike` reads local files, `TrailMap` renders GeoJSON on MapLibre

## GPX Import

User-provided GPX files become saved hikes, stored as a single "section" of a synthetic route.

1. **Entry**: file icon in Saved header (`expo-document-picker`) or OS "Open with" (`app/+native-intent.tsx` redirects `file://`/`content://` URIs; iOS `CFBundleDocumentTypes` + Android `intentFilters` in `app.json`). Both land on `app/(tabs)/saved/import.tsx`
2. **Parse**: `services/gpx-import.ts` reads the file, `lib/gpx.ts` parses (regex, no XML dep) and builds a `Route` (id `gpx-<coordinate hash>`, `path_ref` "GPX") GeoJSON and elevation profile (times via Naismith; none when the file has no elevation)
3. **POIs**: `services/poi-data.buildTrackPois` loads the POI squares around the track and `lib/poi-linking` links stations, stops, hotels and campings on the device (needs network; import fails otherwise). See `docs/POI_LINKING.md`
4. **Style**: import screen asks light/dark map style, then `download-store.startSectionDownload(..., importedTrack)`
5. **Storage**: `offline-storage.saveImportedSectionData` writes `hikes/{id}/sections/{sectionId}/` (incl. `pois.json`), then reuses `downloadSectionTiles` (French grid only)
6. **Lookup**: `imported-route-store` (Zustand, persisted) holds the `Route`; `services/route-lookup.ts` resolves catalog routes from SQLite, `gpx-` ids from the store. Removing the section also removes the imported route
7. **Follow**: `gps-store.startFollowing(routeId, slug, sectionId)` — active screen loads section files

Native config changed (`app.json`, `expo-document-picker`): rebuild native after pulling.
