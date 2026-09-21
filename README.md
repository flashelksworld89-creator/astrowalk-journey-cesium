# AstroWalk Journey 4.2.0 — Route Synthesis + Map Restore

This rebuild restores the Cesium/OpenStreetMap mission map and replaces the simplified prediction layer with a route-centered natal/transit synthesis engine.

## Environment variables
None are required for the core application.

Optional enhancements:
- `CESIUM_ION_TOKEN` — Cesium World Terrain and Cesium OSM Buildings.
- `GOOGLE_MAPS_API_KEY` — Google Street View and Google street-by-street routing.

Private vocabulary is stored in the browser from `/?admin=keywords`; there is no `PLANET_VOCAB_JSON` environment variable.

## Prediction method
For every transit AstroWalk now checks:
- conjunction, sextile, square, trine, quincunx/inconjunction, and opposition contacts;
- all natal house cusps, including each cusp sign and nakshatra/pada;
- natal planets occupying each house;
- the natal lord of each house;
- the present transit placement of each natal house lord;
- special two-way route-lord analysis for Houses 1, 3, 7, and 9;
- planetary aspects to current-location and destination geographic fields;
- route house and nakshatra sequences and gandanta crossings;
- natal Moon vs. transiting Moon for mindset/reaction analysis;
- transiting Moon contacts to the current and destination fields for encounter emphasis.

The interface presents three synthesis channels: Self / mindset, Journey / movement, and Encounters / others. Each planet also receives its own transit interpretation.

## Map behavior
The base mission map starts with Cesium + OpenStreetMap and does not wait for any token. If a Cesium ion token exists, terrain/buildings are added afterward. If Google is not configured, Street View and road directions fall back without taking down the globe.

## Install
```bash
npm install
npm run dev
```

For Vercel, import the repository normally. Start with no environment variables if you want to verify the zero-secret core first.
