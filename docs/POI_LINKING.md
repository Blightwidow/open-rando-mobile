# POI data and custom-GPX linking

Tracks and POIs are separate static files (`https://rando.dammaretz.fr/data/`). Contract and
schemas live in the backend repo (`docs/SPLIT_PIPELINE.md`, `docs/MOBILE_OFFLINE.md`,
`pipeline/src/open_rando/data/*.schema.json`).

| File                    | Used for                                                                                                                                                    |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `catalog.json`          | Tracks only. `poi_counts`, and `geojson_path` / `gpx_path` / `elevation_path` under `tracks/<id>/`                                                          |
| `links/<routeId>.json`  | POIs of a curated track, ordered along it. `distance_km` only for train stations                                                                            |
| `pois/index.json`       | Grid definition (12x8 over `[-5.5, 41.0, 10.0, 51.5]`) and every built square. A square absent from the list is an error, a square with `count: 0` is empty |
| `pois/<col>_<row>.json` | Every POI of one square (0.2 to 3 MB): stable OSM id, kind, `rail_service`, `transit_lines`                                                                 |

## Curated routes

`services/poi-data.buildRoutePois`: fetch the links file, load the squares touching the route bbox
(+0.07°), join on `poi_id` (`lib/route-pois.joinRoutePois`). A link whose POI is missing throws.

The join runs at download time and the result is saved as `pois.json` next to the route's
`geojson.json` (`sections/<id>/pois.json` for sections, filtered by `poisForSection`). We save the
joined POIs rather than the raw links file and squares: a few hundred POIs instead of several MB
of squares, and nothing to garbage-collect or revalidate offline. `elevation.json` has no station
positions any more; `use-offline-route` fills them from the train stations' `distance_km`
(imported tracks too).

Routes saved before the split have no `pois.json` and show no POIs until downloaded again.

## Custom GPX

`lib/poi-linking.linkPoisToTrack` ports `processors/link.py` and `processors/match.py`:

- Pre-filter: POIs within 0.07° of the track simplified at 0.001°.
- Train stations within 5 km, bus stops 2 km, hotels and campings 3 km.
- Stations and stops: duplicates removed (same name within `500 / 111320` of the trail fraction,
  or within `0.001` of it), then stations that are never the closest to any track vertex within
  5 km are dropped. Hotels and campings only need to be in range.
- Position along the track: walked haversine distance up to the nearest point (train stations).
- Custom tracks keep an elevation profile built from the GPX elevations. The backend brief says
  none (product decision); restored on request. Station ticks come from the linked stations.

Linking runs when importing (`app/(tabs)/saved/import.tsx`, needs the network like the tile
download) and the result is saved as `pois.json` with the imported track. Importing fails with a
message if the squares cannot be loaded.

### Differences from the backend, on purpose

- Real haversine distances. The backend's `degrees_to_meters` averages the latitude and longitude
  scales: north-south distances read about 14% short, east-west about 23% long at 47°N.
- Nearest point measured in a local metric projection, not in degree space.
- OSRM junction refinement is not available offline: the junction is the nearest point.
- The 500 m dedup distance is compared with the fraction along the trail like the backend does
  (`500 / 111320`), so its reach in meters scales with the track length (about 2 m per km of
  track): negligible on a day hike, ~460 m on a 460 km GR.

### Parity on GR 13 (`94cfc52e7d9d`, 13,685 vertices, 24,979 candidate POIs, 134 ms on a laptop)

| Kind          | Backend | App | Only in backend / only in app |
| ------------- | ------- | --- | ----------------------------- |
| train_station | 15      | 15  | 1 / 1                         |
| bus_stop      | 91      | 92  | 16 / 17                       |
| hotel         | 110     | 114 | 2 / 6                         |
| camping       | 27      | 29  | 0 / 2                         |

Every difference was checked against the distance each metric gives:

- Luzy (station): 4979 m for the backend, 5122 m haversine, so it falls outside 5 km here.
- The 4 extra hotels and campings are within their limit by haversine (2.5 to 2.9 km) but read
  longer than 3 km with the backend's averaged scale.
- Most bus stop differences are borderline picks of the greedy dedup, which depends on the exact
  fractions; the totals agree.
- Station `distance_km`: 14 compared, median 1.5% and at most 2.7% longer than the backend. Likely
  causes: the backend measures per mapped piece (the stored GeoJSON joins its 7 gaps of 0.5 to
  0.86 km with straight lines, which we count) and takes its fraction in degree space. Not
  verified.

Reproduce with `OPEN_RANDO_PARITY_DIR=<dir> bun run test` (see the header of
`src/lib/__tests__/poi-linking-parity.test.ts` for the files to copy). The test skips without it.

## For the backend team

- Production returned 404 for `grid.json` and `routes/<id>/pmtiles.json` (checked for GR 13 and
  `0fbbaf4616b4`), while `catalog.json`, `links/`, `pois/` and `tracks/` were live. The offline
  tile download needs both.
- Dedup thresholds in fraction units make results depend on the track length (see above).
- `website/src/lib/poi-grid.ts` `squaresForBoundingBox` returns no square for a bbox on the
  outer edge of the grid with a margin of 0 (first column clamps only from below).
- The route manifest does not need POI squares for this app: they are computed from
  `pois/index.json`.
