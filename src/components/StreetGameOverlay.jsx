import { useMemo } from 'react';

const COLORS=['#ef4444','#f97316','#fb923c','#f59e0b','#eab308','#84cc16','#22c55e','#10b981','#14b8a6','#06b6d4','#0ea5e9','#3b82f6','#6366f1','#8b5cf6','#a855f7','#c026d3','#db2777','#e11d48','#dc2626','#ea580c','#ca8a04','#65a30d','#16a34a','#0d9488','#0284c7','#4f46e5','#9333ea'];
const norm=n=>((Number(n)%360)+360)%360;
const signed=(a,b)=>((norm(a)-norm(b)+540)%360)-180;
const cardinal=b=>['N','NE','E','SE','S','SW','W','NW'][Math.round(norm(b)/45)%8];

export default function StreetGameOverlay({active,heading=0,pitch=0,roadBearing=null,currentZone,currentBearing,depthMeters=1609.344,followedPlanet,followedBearing,followedZone,onStopFollowing}){
  if(!active)return null;
  const nak=currentZone?.nakshatra||followedZone?.nakshatra||null;
  const idx=Math.max(0,Math.min(26,Number(nak?.index??nak?.number-1??0)));
  const color=COLORS[idx];
  const roadAxis=Number.isFinite(Number(roadBearing))?Number(roadBearing):Number(heading)||0;
  let roadRel=signed(roadAxis,heading);
  if(Math.abs(roadRel)>90)roadRel=roadRel>0?roadRel-180:roadRel+180;
  const vanishX=Math.max(250,Math.min(750,500+(roadRel/75)*250));
  const planetRel=Number.isFinite(Number(followedBearing))?signed(followedBearing,heading):0;
  const beaconX=Math.max(90,Math.min(910,500+(planetRel/85)*390));
  const routeEndX=Math.max(180,Math.min(820,500+(planetRel/85)*260));
  const horizonY=Math.max(150,Math.min(275,210+Number(pitch||0)*2.2));
  const depthMi=(Number(depthMeters)/1609.344).toFixed(1);
  const vars=useMemo(()=>({'--nak-color':color}),[color]);

  return <div className="street-game-overlay" style={vars}>
    <svg className="street-road-svg" viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="roadFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".10"/><stop offset=".55" stopColor={color} stopOpacity=".28"/><stop offset="1" stopColor={color} stopOpacity=".55"/></linearGradient>
        <linearGradient id="routeGlow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".28"/><stop offset=".45" stopColor={color} stopOpacity=".95"/><stop offset="1" stopColor="#fff7c2" stopOpacity="1"/></linearGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <polygon points={`${vanishX-35},${horizonY} ${vanishX+35},${horizonY} 980,600 20,600`} fill="url(#roadFill)"/>
      <polyline points={`${vanishX-35},${horizonY} 20,600`} className="road-edge"/>
      <polyline points={`${vanishX+35},${horizonY} 980,600`} className="road-edge"/>
      {[.18,.34,.52,.72,.9].map((t,i)=>{const y=horizonY+(600-horizonY)*t*t;const half=35+(480-35)*t*t;return <line key={i} x1={vanishX-half} y1={y} x2={vanishX+half} y2={y} className="road-depth"/>})}
      {followedPlanet&&<><line x1="500" y1="600" x2={routeEndX} y2={horizonY+8} stroke="rgba(2,6,23,.78)" strokeWidth="18"/><line x1="500" y1="600" x2={routeEndX} y2={horizonY+8} stroke="url(#routeGlow)" strokeWidth="7" filter="url(#glow)"/></>}
    </svg>
    <div className="street-road-title"><b>{nak?.name||'Current Nakshatra'}</b><span>HOUSE {currentZone?.house||'—'} · {depthMi} MILE FIELD</span></div>
    {followedPlanet&&<div className="street-planet-beacon" style={{left:`${beaconX/10}%`}}><div className="street-beacon-card"><b>{followedPlanet.glyph} {followedPlanet.name}</b><span>{followedBearing?.toFixed?.(0)}° {cardinal(followedBearing)}</span><small>{followedPlanet.sign} {Number(followedPlanet.degree||0).toFixed(1)}° · H{followedPlanet.house||followedZone?.house||'—'}</small></div><div className="street-beacon-orb">{followedPlanet.glyph}</div><div className="street-beacon-stem"/></div>}
    <div className="street-game-hud"><div><small>Current field</small><b>{nak?.name||'—'}</b></div><div><small>Road axis</small><b>{cardinal(roadAxis)} {norm(roadAxis).toFixed(0)}°</b></div><div><small>Travel house</small><b>House {currentZone?.house||'—'}</b></div><div><small>Following</small><b>{followedPlanet?`${followedPlanet.glyph} ${followedPlanet.name}`:'Select planet'}</b></div>{followedPlanet&&<button type="button" onClick={onStopFollowing}>Stop</button>}</div>
  </div>;
}
