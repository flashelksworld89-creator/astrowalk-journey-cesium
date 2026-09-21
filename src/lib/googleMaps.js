let loaderPromise = null;

export function loadGoogleMaps() {
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (loaderPromise) return loaderPromise;

  loaderPromise = (async () => {
    const response = await fetch('/api/maps-key', { cache: 'no-store' });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.key) throw new Error(payload?.error || 'Google Maps API key is missing.');
    const key = payload.key;

    return new Promise((resolve, reject) => {
    const cb = '__astrowalkGoogleReady';
    window[cb] = () => {
      resolve(window.google.maps);
      delete window[cb];
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&callback=${cb}&v=weekly&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error('Google Maps could not be loaded.'));
      document.head.appendChild(script);
    });
  })();

  return loaderPromise;
}

export async function geocodeWithGoogle(query) {
  const maps = await loadGoogleMaps();
  const geocoder = new maps.Geocoder();
  const { results } = await geocoder.geocode({ address: query });
  if (!results?.length) throw new Error('Location not found.');
  const r = results[0];
  return {
    lat: r.geometry.location.lat(),
    lng: r.geometry.location.lng(),
    label: r.formatted_address || query,
  };
}
