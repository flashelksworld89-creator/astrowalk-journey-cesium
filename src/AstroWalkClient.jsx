'use client';

import { useEffect, useState } from 'react';
import MissionSetup from './components/MissionSetup';
import MissionView from './components/MissionView';
import KeywordManager from './components/KeywordManager';

export default function AstroWalkClient() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('admin') === 'keywords') {
    return <div className="app"><KeywordManager /></div>;
  }

  const [screen, setScreen] = useState('setup');
  const [mission, setMission] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('astrowalk_last_mission') || 'null');
    } catch {
      return null;
    }
  });
  const [gps, setGps] = useState(null);
  const [gpsError, setGpsError] = useState('');

  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError('This browser does not support device location.');
      return;
    }
    const id = navigator.geolocation.watchPosition(
      pos => {
        const c = pos.coords;
        setGps({
          lat: c.latitude,
          lng: c.longitude,
          accuracy: c.accuracy,
          speed: Number.isFinite(c.speed) ? c.speed : null,
          heading: Number.isFinite(c.heading) ? c.heading : null,
          timestamp: pos.timestamp || Date.now(),
          label: `GPS · ${c.latitude.toFixed(5)}, ${c.longitude.toFixed(5)}`,
        });
        setGpsError('');
      },
      err => setGpsError(err?.message || 'Location permission is unavailable.'),
      { enableHighAccuracy: true, maximumAge: 1500, timeout: 15000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  const startMission = data => {
    localStorage.setItem('astrowalk_last_mission', JSON.stringify(data));
    setMission(data);
    setScreen('mission');
  };

  return (
    <div className="app">
      {screen === 'setup' ? (
        <MissionSetup initial={mission} gps={gps} gpsError={gpsError} onStart={startMission} />
      ) : (
        <MissionView mission={mission} gps={gps} gpsError={gpsError} onBack={() => setScreen('setup')} />
      )}
    </div>
  );
}
