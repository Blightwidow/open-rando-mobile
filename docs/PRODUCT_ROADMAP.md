# Product Roadmap

## Vision

open-rando-mobile is a **field companion** for open-rando (rando.dammaretz.fr). The website is for discovery and planning at home. The app is for **during the hike**: offline access, GPS position on trail, real-time progress tracking. Hikers plan at home, then need route data accessible where there's no cellular signal.

## Phase 1 — MVP: "Useful in the Field"

Target: 8-10 weeks. Ship to TestFlight / internal testing.

| #   | Feature                       | Details                                                                                     |
| --- | ----------------------------- | ------------------------------------------------------------------------------------------- |
| 1   | **Browse catalog**            | List all hikes, filter by difficulty/distance/steps/region/trail type/terrain/accommodation |
| 2   | **Hike detail**               | Summary stats, steps list, accommodation icons, station timetable links                     |
| 3   | **Download hike for offline** | One-tap saves GPX + GeoJSON + elevation + map tiles for hike bbox                           |
| 4   | **Offline map with trail**    | Render GeoJSON trail on MapLibre with offline tiles + station markers                       |
| 5   | **GPS position overlay**      | Live blue dot on trail map (foreground only, no recording)                                  |
| 6   | **Elevation profile**         | Interactive SVG chart with step boundaries                                                  |
| 7   | **i18n (FR/EN)**              | Port full translation dictionary from web project                                           |
| 8   | **Dark mode**                 | Respect system setting                                                                      |

## Phase 2 — Enhanced Experience

Target: 6-8 weeks post-MVP.

| #   | Feature                         | Details                                                                                |
| --- | ------------------------------- | -------------------------------------------------------------------------------------- |
| 9   | **GPS track recording**         | Record path walked, save as GPX. Background location via TaskManager                   |
| 10  | **Off-trail alerts**            | Notify if >200m from trail (requires background location + "Always" permission on iOS) |
| 11  | **Section selector**            | Pick start/end stations for multi-step hikes, show sub-stats                           |
| 12  | **Weather integration**         | Meteo-France open API forecast for hike bbox. Cache for offline, 6h TTL                |
| 13  | **Station timetable deep link** | Open SNCF Gares & Connexions for each station                                          |
| 14  | **Saved hikes library**         | Organized by upcoming/past trips                                                       |
| 15  | **Real-time progress**          | Distance walked, time elapsed vs estimated on elevation chart                          |

## Phase 3 — Community & Advanced

Future, post-launch.

| #   | Feature                                | Notes                                                  |
| --- | -------------------------------------- | ------------------------------------------------------ |
| 16  | Hike completion log                    | Date, personal notes, photos                           |
| 17  | Trail condition reports (crowdsourced) | **First feature requiring a backend**                  |
| 18  | Home screen widget                     | Next saved hike + weather                              |
| 19  | Apple Watch / Wear OS companion        | Distance remaining, elevation, next station            |
| 20  | Push notifications                     | "Weather looks great for your saved hike this weekend" |

## Key Screens

1. **Explore List** — scrollable hike cards (path_ref, stations, distance, duration, D+, difficulty badge, terrain tags, accommodation icons) + filter bottom sheet + search by station name
2. **Explore Map** — MapLibre centered on France, all trails as GeoJSON layers, tap trail -> detail
3. **Hike Detail** — header (path_ref, station names), summary stats card, steps list with per-step stats, elevation chart, trail map, "Save offline" + "Start hike" buttons
4. **Active Hike** — full-screen map with GPS dot + accuracy circle, bottom sheet with live stats (distance walked/remaining, time elapsed/estimated), elevation profile with position marker, next station info, off-trail warning banner
5. **Saved Hikes** — downloaded hikes list, storage per hike, swipe to delete
6. **Settings** — FR/EN toggle, storage usage + clear, map style preference, about/legal
