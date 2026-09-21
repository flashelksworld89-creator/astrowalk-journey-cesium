import { NextResponse } from 'next/server';

const cache = new Map();
let lastRequestAt = 0;
const NOMINATIM = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'AstroWalkJourney/4.1 (personal navigation app; contact via deployed site)';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const toRad = d => d * Math.PI / 180;
function distanceMeters(a, b) {
  const R = 6371008.8;
  const dLat = toRad(Number(b.lat) - Number(a.lat));
  const dLon = toRad(Number(b.lng) - Number(a.lng));
  const p1 = toRad(Number(a.lat)), p2 = toRad(Number(b.lat));
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function pointFromResult(result) {
  const lat = Number(result?.lat), lng = Number(result?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const box = Array.isArray(result.boundingbox) ? result.boundingbox.map(Number) : null;
  let radiusMeters;
  if (box?.length === 4 && box.every(Number.isFinite)) {
    const [south, north, west, east] = box;
    const center = { lat: (south + north) / 2, lng: (west + east) / 2 };
    radiusMeters = Math.max(
      1609.344,
      distanceMeters(center, { lat: north, lng: east }),
      distanceMeters(center, { lat: south, lng: west })
    );
    return { ...center, label: result.display_name || 'Selected area', radiusMeters };
  }
  return { lat, lng, label: result.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}` };
}
async function nominatim(path, key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < 24 * 60 * 60 * 1000) return cached.value;
  const wait = 1050 - (Date.now() - lastRequestAt);
  if (wait > 0) await sleep(wait);
  lastRequestAt = Date.now();
  const response = await fetch(`${NOMINATIM}${path}`, {
    headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'en' },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Geocoder returned ${response.status}.`);
  const value = await response.json();
  cache.set(key, { at: Date.now(), value });
  if (cache.size > 150) cache.delete(cache.keys().next().value);
  return value;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = String(searchParams.get('q') || '').trim();
    const lat = Number(searchParams.get('lat'));
    const lng = Number(searchParams.get('lng'));

    if (q) {
      const direct = q.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
      if (direct) {
        const dLat = Number(direct[1]), dLng = Number(direct[2]);
        if (Math.abs(dLat) <= 90 && Math.abs(dLng) <= 180) {
          return NextResponse.json({ lat: dLat, lng: dLng, label: `${dLat.toFixed(5)}, ${dLng.toFixed(5)}` });
        }
      }
      const results = await nominatim(`/search?format=jsonv2&limit=1&addressdetails=1&q=${encodeURIComponent(q)}`, `q:${q.toLowerCase()}`);
      const point = pointFromResult(results?.[0]);
      if (!point) return NextResponse.json({ error: 'Location not found.' }, { status: 404 });
      return NextResponse.json(point);
    }

    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      const result = await nominatim(`/reverse?format=jsonv2&zoom=10&addressdetails=1&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`, `r:${lat.toFixed(4)},${lng.toFixed(4)}`);
      const point = pointFromResult(result) || { lat, lng, label: result?.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}` };
      return NextResponse.json(point);
    }

    return NextResponse.json({ error: 'Provide q or valid lat/lng parameters.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error?.message || 'Geocoding service unavailable.' }, { status: 503 });
  }
}
