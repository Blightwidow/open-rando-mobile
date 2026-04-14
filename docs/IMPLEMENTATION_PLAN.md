# Implementation Plan

## Current Progress

As of 2026-04-14, Phase 1 MVP is feature-complete. The app builds and runs on iOS simulator. Type-checks cleanly (`bunx tsc --noEmit` passes with zero errors). 58 unit tests pass. Below is the status of each sprint item.

### What is done

- Expo SDK 54 project bootstrapped with TypeScript strict mode
- Expo Router file-based routing with bottom tab navigation (Explore / Saved / Settings / Active)
- Default landing on Explore tab via `app/index.tsx` redirect
- TypeScript types ported from the web project (`Route`, `PointOfInterest`, `ElevationProfile`)
- Catalog sync service: fetches `catalog.json` on launch, compares `generated_at`, upserts into SQLite
- SQLite database layer: `routes` table with full JSON `data` column + denormalized columns for filtering
- TanStack Query hooks wrapping SQLite reads (`useRoutes`, `useRoute`, `useFilteredRoutes`, `useDistinctRegions`)
- Hike list screen with `FlatList`, pull-to-refresh catalog sync, loading/error/empty states
- Route card component (path ref badge, difficulty badge, distance/elevation stats)
- Route detail screen with stats grid, terrain tags
- Download service: fetches GeoJSON + elevation JSON per route, writes to `documentDirectory/hikes/{id}/`
- Zustand download store persisted to AsyncStorage (tracks per-route download status across app restarts)
- Download button with progress states (idle / downloading / complete / error / retry)
- MapLibre React Native integration with GeoJSON trail overlay (`ShapeSource` + `LineLayer`) and POI markers
- Trail map appears on route detail after download completes, supports GPS blue dot overlay
- Saved routes screen listing downloads with remove/delete functionality
- Offline route detail screen reading route data from local files
- Settings screen with download count, delete-all, and language selector
- Theme system (colors, spacing, typography, border radius)
- Formatting utilities (`formatDistance`, `formatElevation`, `formatElapsedTime`)
- `@/` path alias resolving to `src/`
- Builds and runs on iOS simulator (`bun run ios`)
- ESLint with eslint-config-expo (flat config) — `bun run lint` passes clean
- Prettier code formatting — `bun run format:check` passes clean
- Vitest unit tests — `bun run test` passes (58 tests across 9 test files)
- GitHub Actions CI: lint + typecheck + format check + tests on push to main and PRs
- i18n FR/EN with language selector in Settings (ported from web project)
- Explore Map view with route markers (bbox center, difficulty-colored circles, list/map toggle)
- Elevation chart component (react-native-svg, area fill, station markers, touch cursor)
- Filter bottom sheet (region + terrain, matching web project, real-time filtering)
- Filter store (Zustand, non-persisted) with region/terrain toggles
- SQL filter queries for region with JS post-filtering for terrain
- expo-location foreground GPS integration with noise filtering
- GPS store (Zustand) with position, distance-from-trail, progress-along-trail
- Geo utilities: haversine distance, point-to-segment distance, distance-from-trail, progress-along-trail
- Active Hike screen with full-screen map, GPS blue dot, live stats overlay, off-trail warning
- Conditional 4th "Active" tab visible only during tracking
- "Start Hike" button on both explore and saved route detail screens
- Location permission request flow with user-friendly error messages

### What is not done yet (deferred to Phase 2 or separate PRs)

- MapLibre offline tile packs (base map requires network currently)
- GPX file download (only GeoJSON + elevation are downloaded)
- Accommodation icons + station timetable links on detail screen
- Dark mode theming (system setting is respected but no dark color palette)
- Component / integration tests (unit test infrastructure is ready, component tests need RNTL setup)
- Field testing on a real trail
- FDroid / sideloading distribution setup

## Phase 1 Sprint Plan

### Week 1-2: Bootstrap

- [x] Expo SDK 54 project with TypeScript strict mode
- [x] Expo Router + bottom tab navigation skeleton
- [x] Local iOS build working (`bun run ios`)
- [x] MapLibre config plugin integrated
- [x] ESLint setup with eslint-config-expo + GitHub Actions CI
- [x] Prettier, Vitest setup
- [x] Port TS interfaces from web project
- [x] Port i18n dictionary from web project (FR/EN, language selector in Settings)

### Week 3-4: Data Layer

- [x] Catalog fetch service (TanStack Query)
- [x] SQLite schema + seed from catalog.json
- [x] Hike List screen (without filter bottom sheet)
- [x] Hike Card component

### Week 5-6: Maps & Detail

- [x] MapLibre React Native integration
- [x] Explore Map view with route markers (bbox center, difficulty-colored, list/map toggle)
- [x] Hike Detail screen (stats, steps, map)
- [x] Elevation Chart component with react-native-svg (touch cursor, station markers)

### Week 7-8: Offline & GPS

- [x] "Save for offline" flow (file download only, no MapLibre offline packs yet)
- [x] Saved Hikes screen with storage management
- [x] expo-location foreground GPS integration
- [x] Active Hike screen with GPS position overlay
- [x] Filter bottom sheet (region + terrain, matching web project)

### Week 9-10: Polish & Launch Prep

- [ ] Dark mode support (deferred to separate PR)
- [x] Settings screen (storage, about) — minimal version
- [x] Unit tests (58 tests: geo, filters, stores, i18n, format, location)
- [ ] Field test on a real GR trail
- [ ] FDroid metadata + sideloading distribution

## CI/CD Pipeline

```
Push to any branch  -> GitHub Actions: lint + typecheck + tests
```

Builds are local only for now. No EAS, no cloud builds.

### Build Commands

- `bun run ios` — build + run on iOS simulator (requires Xcode)
- `bun run android` — build + run on Android emulator/device
- `bunx expo prebuild` — eject native projects for manual Gradle/Xcode builds
- Clean rebuild after native changes: `rm -rf ios && bun run ios`

### Distribution

- **Android**: FDroid + sideloading (signed APK via Gradle)
- **iOS**: sideloading / AltStore (may revisit TestFlight later)
- Catalog data updates require no app update (fetched at runtime)

## Testing Strategy

### Unit Tests (Vitest)

- Data parsing: catalog JSON -> SQLite insert, GPX parsing, GeoJSON validation
- Distance calculations: point-to-trail distance, progress along trail
- Filter logic: replicate filter behavior from web
- i18n: translation key coverage, placeholder substitution
- Duration formatting: `formatDuration` from catalog.ts

### Component Tests (React Native Testing Library)

- HikeCard renders correct stats
- Filter sheet applies and clears correctly
- Elevation chart renders data points
- Offline indicator shows correct state

### Integration Tests

- Catalog fetch + SQLite storage roundtrip
- Download hike for offline -> verify files exist -> render detail screen offline
- GPS mock -> verify position appears on map

### E2E Tests (Detox, critical paths only)

- App launch -> catalog loads -> browse list -> open detail -> save offline
- Save hike -> airplane mode -> open saved hike -> verify trail renders
- GPS tracking: mock location updates -> verify progress on elevation chart

### Manual Testing Checklist

- Walk an actual hike with the app (field test on real GR trail)
- Test offline by enabling airplane mode mid-hike
- Battery consumption during 4-hour GPS tracking session
- Test on both iOS and Android physical devices

## Verification (Phase 1 Definition of Done)

1. Unit tests pass: catalog parsing, filter logic, distance calculations, duration formatting, i18n key coverage
2. Component tests pass: HikeCard renders, filters apply/clear, elevation chart renders
3. Manual flow: launch -> catalog loads -> browse -> filter -> detail -> save offline -> airplane mode -> saved hike -> trail renders
4. GPS test: open saved hike -> start hike -> walk outside -> blue dot appears and moves
5. Field test: complete a real GR trail step with the app (offline + GPS + elevation)
6. Both platforms: test on iOS physical device + Android physical device
