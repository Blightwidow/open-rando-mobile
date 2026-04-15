# TrainRando Deeplinks

The TrainRando mobile app supports deeplinks to open routes directly from the website, QR codes, or other apps.

## URL Schemes

### Web URL (recommended)

```
https://rando.dammaretz.fr/routes/{slug}
https://rando.dammaretz.fr/routes/{slug}?from={km}&to={km}
```

### Custom scheme

```
trainrando://route/{slug}
trainrando://route/{slug}?from={km}&to={km}
```

## Parameters

| Parameter | Type   | Required | Description                                       |
| --------- | ------ | -------- | ------------------------------------------------- |
| `slug`    | string | yes      | Route identifier (e.g. `gr-137`, `gr-10-etape-3`) |
| `from`    | number | no       | Section start in kilometers along the route       |
| `to`      | number | no       | Section end in kilometers along the route         |

When `from` and `to` are provided, the app downloads and displays only that section of the route. When omitted, the full route is used.

## Examples

| Use case                | URL                                                              |
| ----------------------- | ---------------------------------------------------------------- |
| Open full route         | `https://rando.dammaretz.fr/routes/gr-137`                       |
| Open route section      | `https://rando.dammaretz.fr/routes/gr-10-etape-3?from=0&to=15.5` |
| Custom scheme (full)    | `trainrando://route/gr-137`                                      |
| Custom scheme (section) | `trainrando://route/gr-137?from=26.86&to=34.28`                  |

## QR Code Integration

The app includes a built-in QR scanner. Any QR code containing a valid deeplink URL (web or custom scheme) or a bare route slug (e.g. `gr-137`) will be recognized.

Accepted QR code content:

- `https://rando.dammaretz.fr/routes/gr-137?from=5&to=12`
- `trainrando://route/gr-137`
- `gr-137` (bare slug, must match pattern `[a-z0-9][a-z0-9-]*[a-z0-9]`)

## Behavior

1. **Route exists locally** -- opens the saved route detail screen
2. **Route exists in catalog but not downloaded** -- triggers download, then opens
3. **Route not found** -- shows an error toast
4. **Section bounds provided** -- downloads only the specified km range as a section

## Website Integration

To link to the app from the website, use standard HTML links with the web URL format:

```html
<a href="https://rando.dammaretz.fr/routes/gr-137">Open in TrainRando</a>
```

For section-specific links (e.g. from a route detail page):

```html
<a href="https://rando.dammaretz.fr/routes/gr-10-etape-3?from=0&to=15.5">
  Download this section in the app
</a>
```

> **Note:** Universal links (iOS) and Android App Links are not yet configured. Currently, the `trainrando://` custom scheme works when the app is installed. Web URLs will open in the browser until universal link support is added.

## Generating QR Codes

For trailhead signposts or printed materials, generate QR codes encoding either format:

- **Preferred**: `https://rando.dammaretz.fr/routes/{slug}?from={km}&to={km}` (works in browser too)
- **App-only**: `trainrando://route/{slug}?from={km}&to={km}`

The web URL format is recommended because it degrades gracefully to the website when the app is not installed.
