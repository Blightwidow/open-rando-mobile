# open-rando-mobile

Companion mobile app for open-rando (rando.dammaretz.fr) — offline hiking between train stations on French GR/GRP/PR trails.

## Project Context

- **Web project**: `../open-rando` (Python pipeline + Astro static site)
- **This app**: React Native + Expo field companion — offline routes, GPS on trail, real-time progress
- **Data source**: static files at `rando.dammaretz.fr/data/` (catalog.json, GPX, GeoJSON, elevation profiles)
- **No backend API** — the app fetches pre-generated static files
- **Philosophy**: open source (GPLv3), privacy-first (no accounts, no analytics, no cookies), bilingual FR/EN

## Stack

- **Framework**: React Native + Expo (SDK 52+), TypeScript
- **Router**: Expo Router (file-based)
- **Maps**: MapLibre React Native (`@maplibre/maplibre-react-native`)
- **State**: Zustand (global) + TanStack Query (data fetching/caching)
- **Offline DB**: expo-sqlite for catalog, expo-file-system for route files
- **GPS**: expo-location
- **Charts**: react-native-svg
- **i18n**: custom, ported from `../open-rando/website/src/lib/i18n.ts`
- **Testing**: Vitest (unit) + React Native Testing Library (components)
- **CI/CD**: EAS Build + EAS Submit via GitHub Actions

## Documentation

- `docs/PRODUCT_ROADMAP.md` — feature phases, screen descriptions
- `docs/TECHNICAL_ARCHITECTURE.md` — stack details, data flow, offline strategy, navigation, GPS architecture, files to port from web
- `docs/IMPLEMENTATION_PLAN.md` — week-by-week sprint plan, CI/CD, testing strategy, definition of done
- `docs/RISKS_AND_DECISIONS.md` — risks, mitigations, open decisions (tile source, crash reporting, repo structure)

## Code Conventions

- TypeScript strict mode
- No abbreviated variable names — spell everything out
- Descriptive names even in loops
- Follow Expo Router file-based routing conventions
- Port types from `../open-rando/website/src/lib/catalog.ts` (Hike, StationInfo, HikeStep, ElevationProfile)
- Port translations from `../open-rando/website/src/lib/i18n.ts`
- Test behavior not implementation

## Key Commands

```bash
# Development
npx expo start              # start dev server
npx expo start --clear      # clear cache and start

# Testing
npx vitest run              # unit tests
npx vitest --watch          # unit tests in watch mode

# Building
eas build --profile development --platform ios
eas build --profile preview --platform all
eas build --profile production --platform all

# Linting
npx eslint .
npx tsc --noEmit
```

## Architecture Overview

```
app/
  (tabs)/
    explore/         -- Browse & search hikes (list + map)
    saved/           -- Downloaded offline hikes
    active/          -- GPS tracking during hike
    settings/        -- Language, storage, about
src/
  components/        -- Reusable UI components
  lib/               -- Business logic, types, i18n
  services/          -- Data fetching, SQLite, GPS, offline storage
  stores/            -- Zustand stores
```
