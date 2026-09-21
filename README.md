# AstroWalk Journey 4.0.1 — Cesium Globe Rewrite

This is a fresh CesiumJS rewrite using AstroWalk 3.6.6 as the feature baseline. It preserves the 3.6.6 transit/natal/prediction/fullscreen forecast experience while replacing the main map renderer with a world-scale Cesium globe.

## Rendering modes
- Cesium globe with smooth camera flight, city-scale nakshatra ground wedges, user/destination markers, and route line.
- With `CESIUM_ION_TOKEN`, Cesium World Terrain and Cesium OSM Buildings are enabled when available.
- Without a Cesium token, the app falls back to a smooth Cesium globe with OpenStreetMap imagery and still remains usable.
- Google Street View remains available as the photographic street mode.

## Environment variables
- `GOOGLE_MAPS_API_KEY` — retained for geocoding, directions, and Street View.
- `PLANET_VOCAB_JSON` — existing private interpretation vocabulary.
- `CESIUM_ION_TOKEN` — recommended for terrain and 3D buildings. Create a Cesium ion account/token and add the token to Vercel.

## Important
The known 3.6.6 `followedPlanet` render-order crash is corrected in this rewrite while the 3.6.6 feature set is retained.


This build keeps the 3.5.2 map/compass/HUD baseline and adds:

## 3.6.6 navigation additions

- Live current date/time widget, separate from the selectable Journey Time.
- Collapsible Wheel Radius control moved to the left rail above Nakshatra Explorer.
- Street View automatically opens in Flat mode; the pavement plane follows Street View road links and camera pitch so it remains aligned to street level while moving/looking around.
- Selecting a planet generates a Google road-route report to the destination with street-by-street steps, distance, duration, ETA from the selected Journey Time, start/end house-sign-nakshatra fields, house/nakshatra crossings, and emphasized gandanta crossings.
- Route field analysis samples the actual road path through the city-centered sidereal wheel.


- Date-sensitive Transit Positions panel. Past/future Journey Time selections recalculate the displayed sidereal transits automatically.
- Default interpretation emphasis on the natal 1st lord (self), 3rd lord (communication / short travel), and 7th lord (others / contracts / business relationships).
- Prediction Focus selector after natal verification. The default 1st/3rd/7th lord focus remains pinned; users can add other houses and house lords.
- Relocation/astrocartography evidence at the current and destination locations using natal planets near relocated ASC/DSC/MC/IC.
- Separate Western tropical angularity and sidereal relocation angularity evidence.
- Local Space route comparison: natal planetary azimuths at the selected location are compared with the journey bearing.
- Location Astrology panel showing the strongest current-location, destination, and route contacts used by the interpretation engine.

## Existing systems retained

- Lahiri sidereal transit/natal calculations
- live GPS/static location modes
- city-centered 27-nakshatra compass
- Street View flat/upright modes and 1-mile nakshatra pavement field
- planet-follow guidance
- Nakshatra Street Explorer
- full-screen map/HUD layout
- private PLANET_VOCAB_JSON terminology

## Environment variables

No new Vercel variables are required. Keep the existing:

- `GOOGLE_MAPS_API_KEY`
- `PLANET_VOCAB_JSON` (optional private terminology)

See `ASTROCARTOGRAPHY_METHOD.md` for the research/implementation model and thresholds.


## 3.6.6 deployment repair
- Rebased on the stable 3.6.6 project.
- Keeps the 3.6.6 context-synthesis interpretation engine.
- Fixes the routeAnalysis declaration order so it is never referenced before initialization.
- Keeps route/street/gandanta context in prediction requests.


### v3.6.6
Fullscreen predictions are now organized into separate Planet Prediction and House Prediction narrative sections with paragraph-style explanations and expandable astrological basis.

## Google-optional behavior (4.0.1)
The Cesium globe and core astrology no longer require Google Maps to initialize. `CESIUM_ION_TOKEN` powers Cesium terrain/buildings. `GOOGLE_MAPS_API_KEY` is optional for the main globe, but still required for Google address lookup, Street View, and Google turn-by-turn routing. If Google is unavailable, use GPS or latitude/longitude for birth/current/destination inputs.
