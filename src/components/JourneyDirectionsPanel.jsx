import { Navigation, AlertTriangle, Clock3, MapPin, Route } from 'lucide-react';

function fmtDuration(sec){
  if(!Number.isFinite(Number(sec)))return '—';
  const m=Math.round(Number(sec)/60);if(m<60)return `${m} min`;
  const h=Math.floor(m/60),r=m%60;return `${h} hr${h===1?'':'s'}${r?` ${r} min`:''}`;
}
function fmtDistance(m){
  if(!Number.isFinite(Number(m)))return '—';
  const mi=Number(m)/1609.344;return mi<10?`${mi.toFixed(2)} mi`:`${mi.toFixed(1)} mi`;
}
function clean(s=''){return String(s).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim()}

export default function JourneyDirectionsPanel({planet,routeData,analysis,departureDate}){
  if(!planet)return null;
  const leg=routeData?.leg||null;
  const eta=leg?.durationSeconds&&departureDate?new Date(new Date(departureDate).getTime()+leg.durationSeconds*1000):null;
  return <section className="card journey-directions-panel">
    <div className="section-title"><Navigation size={15}/> {planet.glyph} {planet.name} journey directions <span>{routeData?.status||'ROUTE'}</span></div>
    {!routeData&&<p className="small-note">Calculating the road route and astrological field crossings…</p>}
    {routeData?.error&&<div className="error">{routeData.error}</div>}
    {analysis&&<>
      <div className="journey-route-summary">
        <div><small>Start field</small><b>H{analysis.start?.house||'—'} · {analysis.start?.sign||'—'}</b><span>{analysis.start?.nakshatra||'—'}</span></div>
        <div><small>Destination field</small><b>H{analysis.end?.house||'—'} · {analysis.end?.sign||'—'}</b><span>{analysis.end?.nakshatra||'—'}</span></div>
        <div><small>Fields crossed</small><b>{analysis.houseCount||0} houses</b><span>{analysis.nakshatraCount||0} nakshatras</span></div>
        <div><small>Road distance</small><b>{fmtDistance(leg?.distanceMeters)}</b><span>{fmtDuration(leg?.durationSeconds)}</span></div>
        <div><small>Estimated arrival</small><b>{eta?eta.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}):'—'}</b><span>{eta?eta.toLocaleDateString():'—'}</span></div>
      </div>
      {!!analysis.houseSequence?.length&&<div className="journey-crossings"><b>House path</b><span>{analysis.houseSequence.map(h=>`H${h}`).join(' → ')}</span></div>}
      {!!analysis.nakshatraSequence?.length&&<div className="journey-crossings"><b>Nakshatra path</b><span>{analysis.nakshatraSequence.join(' → ')}</span></div>}
      {!!analysis.gandanta?.length&&<div className="gandanta-alert"><AlertTriangle size={16}/><div><b>GANDANTA CROSSING</b>{analysis.gandanta.map((g,i)=><span key={i}>{g.label} · near {g.longitude.toFixed(2)}° sidereal</span>)}</div></div>}
    </>}
    {!!leg?.steps?.length&&<div className="journey-step-list">
      <div className="journey-step-head"><Route size={14}/><b>Street directions</b></div>
      {leg.steps.map((s,i)=><div className="journey-step" key={i}><span className="journey-step-num">{i+1}</span><div><b>{clean(s.instruction)}</b><small>{fmtDistance(s.distanceMeters)} · {fmtDuration(s.durationSeconds)}</small></div></div>)}
    </div>}
    {!!routeData?.streets?.length&&<div className="journey-street-chips"><MapPin size={13}/>{routeData.streets.map(s=><span key={s}>{s}</span>)}</div>}
  </section>;
}
