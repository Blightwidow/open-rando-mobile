# Implementation Plan

## Phase 1 Sprint Plan

### Week 1-2: Bootstrap

- `npx create-expo-app` with TypeScript template
- Expo Router + bottom tab navigation skeleton
- ESLint, Prettier, Vitest setup
- Port TS interfaces from `../open-rando/website/src/lib/catalog.ts`
- Port i18n dictionary from `../open-rando/website/src/lib/i18n.ts`
- EAS Build config (`eas.json`) + first dev client build

### Week 3-4: Data Layer

- Catalog fetch service (TanStack Query)
- SQLite schema + seed from catalog.json
- Filter queries in SQL (difficulty, distance range, step count, region, trail type, terrain, accommodation)
- Hike List screen + filter bottom sheet
- Hike Card component

### Week 5-6: Maps & Detail

- MapLibre React Native integration
- Explore Map view with trail GeoJSON rendering
- Hike Detail screen (stats, steps, map)
- Elevation Chart component with react-native-svg

### Week 7-8: Offline & GPS

- "Save for offline" flow (file download + MapLibre offline packs)
- Saved Hikes screen with storage management
- expo-location foreground GPS integration
- Active Hike screen with GPS position overlay

### Week 9-10: Polish & Launch Prep

- Dark mode support
- Settings screen (language, storage, about, legal)
- Unit + component tests
- Field test on a real GR trail
- App Store / Play Store listing preparation
- First TestFlight / internal testing build

## CI/CD Pipeline

```
Push to any branch  -> GitHub Actions: lint + typecheck + tests
Push to main        -> EAS Build (preview) -> TestFlight + Play Internal
Git tag v*          -> EAS Build (production) -> App Store + Play Store submission
```

### EAS Build Profiles (eas.json)

- `development`: Development client builds for local testing with `expo-dev-client`
- `preview`: Internal distribution builds (TestFlight + Google Play internal track)
- `production`: App Store + Play Store release builds

### OTA Updates

- JS-only changes (UI tweaks, bug fixes, translations): ship via EAS Update without store review
- Native dependency changes: require full EAS Build
- Catalog data updates: no app update needed (fetched at runtime from static site)

### App Store Requirements

- Apple Developer Program: $99/year
- Google Play Developer: $25 one-time
- Privacy nutrition labels: "Data Not Collected" (no tracking, no accounts)
- Location permission justification: "Shows your position on the hiking trail map"

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
