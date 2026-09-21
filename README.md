# AstroWalk Journey 4.1.0 — Lean Cesium Core

A clean rewrite of the Cesium branch using AstroWalk 3.6.6 as the feature baseline.

## Environment variables

### Required for the advanced 3D experience
- `CESIUM_ION_TOKEN` — Cesium World Terrain and Cesium OSM Buildings.

### Optional
- `GOOGLE_MAPS_API_KEY` — only for Google Street View and Google road directions.

There is **no `PLANET_VOCAB_JSON` environment variable** in this build. Private planet vocabulary is managed at `/?admin=keywords` and stored in the browser. The prediction service has built-in fallback vocabulary when no custom terms are saved.

The core app therefore needs only **one Vercel environment variable** for the intended advanced Cesium experience.

## Location lookup
Birthplace, current-location, destination, map search, and city-center lookup use explicit OpenStreetMap/Nominatim requests through `/api/geocode`. There is no autocomplete. Results are cached server-side where possible and the request path is rate-limited to respect the public Nominatim service policy. Display OpenStreetMap attribution in the application.

For a high-traffic/commercial deployment, replace the public Nominatim endpoint with your own Nominatim instance or a dedicated geocoding provider.

## Main changes from 4.0.1
- Removed the unused legacy `GoogleMissionMap` component.
- Removed Google from all core geocoding and city-center resolution.
- Removed `PLANET_VOCAB_JSON` and its redeploy workflow.
- Private vocabulary now saves locally in the browser and is sent only with interpretation requests.
- Cesium is the primary map renderer.
- Google services fail independently and do not block mission setup or the globe.
- Retains the 3.6.6 prediction/fullscreen/natal/transit structure plus the known 3.6.6 render-order crash fix.

## Install / build
```bash
npm install
npm run build
npm start
```

Cesium static assets are copied to `public/cesium` by the `postinstall` script.

## Private vocabulary
Open:

`/?admin=keywords`

Edit/import the CSV and choose **Save to this browser**. No Vercel setting or redeploy is required.

## Notes
The Cesium ion token is exposed to the browser at runtime because CesiumJS needs it. Restrict the token to your deployed site/domain in Cesium ion.
