# Implementation Plan

## Current Progress

As of 2026-04-10, the initial scaffold is in place. The app builds and runs on iOS simulator. Type-checks cleanly (`bunx tsc --noEmit` passes with zero errors). Below is the status of each sprint item.

### What is done

- Expo SDK 54 project bootstrapped with TypeScript strict mode
- Expo Router file-based routing with bottom tab navigation (Explore / Saved / Settings)
- Default landing on Explore tab via `app/index.tsx` redirect
- TypeScript types ported from the web project (`Hike`, `StationInfo`, `HikeStep`, `ElevationProfile`)
- Catalog sync service: fetches `catalog.json` on launch, compares `generated_at`, upserts into SQLite
- SQLite database layer: `hikes` table with full JSON `data` column + denormalized columns for filtering
- TanStack Query hooks wrapping SQLite reads (`useHikes`, `useHike`)
- Hike list screen with `FlatList`, pull-to-refresh catalog sync, loading/error/empty states
- Hike card component (path ref badge, difficulty badge, stations, distance/duration/elevation stats)
- Hike detail screen with stats grid, terrain tags, steps timeline
- Download service: fetches GeoJSON + elevation JSON per hike, writes to `documentDirectory/hikes/{id}/`
- Zustand download store persisted to AsyncStorage (tracks per-hike download status across app restarts)
- Download button with progress states (idle / downloading / complete / error / retry)
- MapLibre React Native integration with GeoJSON trail overlay (`ShapeSource` + `LineLayer`) and station markers
- Trail map appears on hike detail after download completes
- Saved hikes screen listing downloads with remove/delete functionality
- Offline hike detail screen reading route data from local files
- Settings screen with download count and delete-all
- Theme system (colors, spacing, typography, border radius)
- Formatting utilities (`formatDuration`, `formatDistance`, `formatElevation`)
- `@/` path alias resolving to `src/`
- Builds and runs on iOS simulator (`bun run ios`)

### What is not done yet

- ESLint, Prettier, Vitest setup
- i18n (FR/EN translation dictionary)
- Filter queries in SQL + filter bottom sheet + search
- Explore Map view (all trails on a France-wide map)
- Elevation chart component (react-native-svg)
- MapLibre offline tile packs (base map requires network currently)
- GPX file download (only GeoJSON + elevation are downloaded)
- expo-location GPS integration + active hike screen
- Accommodation icons + station timetable links on detail screen
- Dark mode theming (system setting is respected but no dark color palette)
- Unit / component / integration tests
- Field testing
- FDroid / sideloading distribution setup

## Phase 1 Sprint Plan

### Week 1-2: Bootstrap

- [x] Expo SDK 54 project with TypeScript strict mode
- [x] Expo Router + bottom tab navigation skeleton
- [x] Local iOS build working (`bun run ios`)
- [x] MapLibre config plugin integrated
- [ ] ESLint, Prettier, Vitest setup
- [x] Port TS interfaces from web project
- [ ] Port i18n dictionary from `../open-rando/website/src/lib/i18n.ts`

### Week 3-4: Data Layer

- [x] Catalog fetch service (TanStack Query)
- [x] SQLite schema + seed from catalog.json
- [ ] Filter queries in SQL (difficulty, distance range, step count, region, trail type, terrain, accommodation)
- [x] Hike List screen (without filter bottom sheet)
- [x] Hike Card component

### Week 5-6: Maps & Detail

- [x] MapLibre React Native integration
- [ ] Explore Map view with trail GeoJSON rendering
- [x] Hike Detail screen (stats, steps, map)
- [ ] Elevation Chart component with react-native-svg

### Week 7-8: Offline & GPS

- [x] "Save for offline" flow (file download only, no MapLibre offline packs yet)
- [x] Saved Hikes screen with storage management
- [ ] expo-location foreground GPS integration
- [ ] Active Hike screen with GPS position overlay

### Week 9-10: Polish & Launch Prep

- [ ] Dark mode support
- [x] Settings screen (storage, about) — minimal version
- [ ] Unit + component tests
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
