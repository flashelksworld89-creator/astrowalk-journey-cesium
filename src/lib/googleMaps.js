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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&callback=${cb}&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error('Google Maps could not be loaded.'));
      document.head.appendChild(script);
    });
  })();

  return loaderPromise;
}
