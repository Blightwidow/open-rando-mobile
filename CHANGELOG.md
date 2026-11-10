# Changelog

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Release notes of each GitHub release are taken from the matching section.

## [1.0.0] - 2026-11-10

First release. Android APK attached to the GitHub release.

### Added

- Explore hikes between train stations on French GR/GRP/PR trails: list, filters, map, difficulty badges, elevation profile.
- Offline hikes: download GeoJSON, elevation, POIs (stations, stops, hotels, campings) and map tiles (PMTiles base + grid, light or dark style). Section-only downloads, foreground service and single progress notification on Android.
- Saved hikes: QR code scan to download a hike section.
- GPX import: open a GPX file (file picker or "Open with") as a saved hike, with elevation profile, Naismith times and POIs linked on the device.
- Follow a hike with GPS: position and accuracy on the trail map, first-fix recenter, recenter button.
- Active hike panel: elevation chart with your position, remaining distance and time, tap or drag to pick a point shown on the map with the distance and time to reach it.
- Settings: French/English, light/dark/system theme, GPS update rate (Precise 3 s, Balanced 10 s by default, Saver 30 s), storage management, log export.
- Deep links for the website integration (see `docs/DEEPLINKS.md`).

### Changed

- Scale bar sits next to the stop button on the followed hike, with higher contrast.

### Infrastructure

- CI: lint, typecheck, format check, tests on every push and PR. APK built on PRs (test download with QR code) and attached to published releases only.
