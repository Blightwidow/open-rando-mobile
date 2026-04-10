# Risks & Open Decisions

## Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Map tile storage bloat | Users run out of device storage | Show estimated size before download; per-hike deletion; cap at z15 |
| GPS battery drain | Phone dies mid-hike | Updates every 10-15s; battery warning in UI; document expected drain |
| OpenTopoMap rate limiting | Tile downloads throttled | Retry with backoff; consider IGN Geoplateforme as alternative |
| MapLibre offline pack reliability | Tile download fails silently | Verify pack completeness; show "partially downloaded" state; allow re-download |
| iOS background location restrictions | Apple rejects or limits background GPS | "Always" permission only Phase 2; clear Info.plist justification; Phase 1 foreground only |
| App Store rejection | Apple considers it a web wrapper | Offline-first GPS tracking is clear native value; not a WebView app |
| Catalog growth (228KB -> 1MB+) | Slow launch on poor connections | ETag conditional fetch; consider lightweight metadata-only endpoint |
| FFRP trademark concerns | Same risk as web project | Use "hiking between train stations"; no GR logos |

## Open Decisions

### 1. Offline Tile Source

**Options**:
- **OpenTopoMap**: hiking-oriented styling, great for trail visibility, but no official offline/bulk download API
- **IGN Geoplateforme**: better France coverage, official API with reasonable limits, less hiking-styled

**Recommendation**: Start with OpenTopoMap (matches web). Switch to IGN if rate limiting becomes an issue. Can support both as a user preference in settings.

### 2. Crash Reporting

Per project philosophy: no analytics, no cookies, no accounts.

**Recommendation**: No crash reporting in v1. Consider opt-in Sentry (self-hostable, open source) in Phase 2 if debugging blind becomes painful.

### 3. Distribution Strategy

**Decision**: Target unofficial/alternative stores first (FDroid for Android, sideloading for iOS).

**Why**: Avoids Apple Developer Program ($99/year) and Google Play ($25) costs. Aligns with open-source philosophy. FDroid is a natural fit for a GPLv3 privacy-first app with no tracking.

**Implications**:
- No EAS Build dependency — local builds with `bunx expo run:android` / `bunx expo run:ios`
- Android APK built locally with Gradle after `bunx expo prebuild`
- iOS distribution via AltStore or TestFlight later if needed
- May revisit official stores post-MVP

### 4. Repository Structure

**Decision**: Separate repo (`open-rando-mobile`), not monorepo with web project.

**Why**: Toolchains are too different (Bun/Astro vs Expo/React Native). Shared TypeScript types copied directly (5 interfaces + 2 utility functions — not worth a shared package for this volume).

### 5. GPX Import from External Sources

Users may want to view their own GPX files (not from open-rando) on the map.

**Recommendation**: Defer to Phase 3. Scope creep for MVP. The app's value is the curated station-to-station experience, not being a generic GPX viewer.

### 6. Multi-Device Sync

Saved hikes, completion log, trip planning — syncing across devices requires a backend.

**Recommendation**: Phase 3 at earliest. No backend until trail condition reports (Phase 3, feature #17) force the issue.
