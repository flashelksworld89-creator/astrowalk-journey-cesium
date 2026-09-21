import { Footprints, Car, MapPin, Navigation, Satellite } from 'lucide-react';

export default function LiveTrackingControls({mode,onModeChange,gps,gpsError,movedMeters,lastAnalysisAt}){
  const accuracy=gps?.accuracy;
  return <div className="tracking-panel" aria-label="Live journey tracking">
    <div className="tracking-head"><strong><Navigation size={13}/> Journey tracking</strong><span className={gps?'tracking-live':'tracking-off'}>{gps?'GPS live':'GPS unavailable'}</span></div>
    <div className="tracking-modes">
      <button type="button" className={mode==='walk'?'active':''} onClick={()=>onModeChange('walk')}><Footprints size={14}/> Walking</button>
      <button type="button" className={mode==='drive'?'active':''} onClick={()=>onModeChange('drive')}><Car size={14}/> Driving</button>
      <button type="button" className={mode==='static'?'active':''} onClick={()=>onModeChange('static')}><MapPin size={14}/> Static</button>
    </div>
    <div className="tracking-meta"><span><Satellite size={12}/> {Number.isFinite(accuracy)?`±${Math.round(accuracy)} m accuracy`:'waiting for fix'}</span><span>{mode==='static'?'position locked':`analysis shift ${Math.round(movedMeters||0)} m`}</span></div>
    {gpsError&&<div className="tracking-error">{gpsError}</div>}
    <div className="tracking-note">The map marker follows every GPS fix. Astrology and prediction recalculation is throttled to meaningful movement so normal GPS jitter does not constantly rewrite the forecast.</div>
  </div>;
}
