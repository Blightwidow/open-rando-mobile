# TrainRando

Offline field companion for [open-rando](https://rando.dammaretz.fr): hike between train stations on French GR/GRP/PR trails, with maps and routes available without network.

- **Browse** the open-rando catalog (routes, difficulty, distance, elevation, stations)
- **Save offline**: full routes or sections (via QR code from the website), with offline map tiles
- **Import GPX**: open a GPX file from the file picker or from any app ("Open with"), saved like any other hike
- **Follow on trail**: live GPS position on the map, pan freely and recenter on demand
- Bilingual FR/EN, light and dark theme

Privacy first: no accounts, no analytics, no cookies, no backend. The app only fetches static files from `rando.dammaretz.fr/data/`.

## Stack

React Native + Expo (SDK 54), TypeScript strict, Expo Router, MapLibre React Native (OpenFreeMap + PMTiles), Zustand, TanStack Query, expo-sqlite, expo-file-system.

## Getting started

Requirements: [Bun](https://bun.sh), Xcode (iOS) and/or Android Studio with JDK 17 (Android). The app uses native modules, so it runs in a development build, not Expo Go.

```bash
bun install
bun run ios        # or: bun run android
bun start          # dev server for an installed dev build
```

After changing `app.json` plugins or native dependencies, rebuild native code:

```bash
rm -rf ios && bun run ios
rm -rf android && bun run android
```

## Scripts

| Command                 | Purpose                                          |
| ----------------------- | ------------------------------------------------ |
| `bun run lint`          | ESLint                                           |
| `bun run typecheck`     | `tsc --noEmit`                                   |
| `bun run format:check`  | Prettier check (`bun run format` to fix)         |
| `bun run test`          | Vitest unit tests                                |
| `bun run build:android` | Prebuild + `gradlew assembleRelease` (local APK) |

CI (GitHub Actions) runs lint, typecheck, format check and tests, and builds a release APK on every push and PR. Download it from the run's artifacts (`trainrando-apk-<sha>`).

## Deep links

Routes and sections open from `https://rando.dammaretz.fr/routes/{slug}` or `trainrando://route/{slug}`, with optional `?from=<km>&to=<km>`. See [docs/DEEPLINKS.md](docs/DEEPLINKS.md).

## Documentation

- [CLAUDE.md](CLAUDE.md): architecture, data flow, GPX import flow, code conventions
- [docs/TECHNICAL_ARCHITECTURE.md](docs/TECHNICAL_ARCHITECTURE.md): stack details and offline strategy
- [docs/TODOS.md](docs/TODOS.md): open items

## Distribution

Android APK via CI artifacts and sideloading; F-Droid and AltStore are planned. No official app store releases for now.

## Related

- [open-rando](https://github.com/Blightwidow/open-rando): data pipeline and website that produce the catalog this app consumes

## License

[GPLv3](LICENSE)
