function normalizePoint(data, fallbackLabel = '') {
  if (!data || !Number.isFinite(Number(data.lat)) || !Number.isFinite(Number(data.lng))) {
    throw new Error('Location not found.');
  }
  return {
    lat: Number(data.lat),
    lng: Number(data.lng),
    label: data.label || fallbackLabel || `${Number(data.lat).toFixed(5)}, ${Number(data.lng).toFixed(5)}`,
    radiusMeters: Number(data.radiusMeters) || undefined,
    approximate: Boolean(data.approximate),
  };
}

export async function geocodePlace(query) {
  const q = String(query || '').trim();
  if (!q) throw new Error('Enter a place or coordinates.');
  const response = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`, { cache: 'no-store' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || 'Location lookup failed.');
  return normalizePoint(data, q);
}

export async function reverseGeocode(point) {
  const lat = Number(point?.lat), lng = Number(point?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error('Invalid coordinates.');
  const response = await fetch(`/api/geocode?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`, { cache: 'no-store' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || 'Reverse lookup failed.');
  return normalizePoint(data, `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
}
