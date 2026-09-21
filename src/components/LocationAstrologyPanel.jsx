export default function LocationAstrologyPanel({currentHits=[],destinationHits=[],localSpaceContacts=[]}){
  const has=currentHits.length||destinationHits.length||localSpaceContacts.length;
  return <section className="card location-astrology-panel">
    <div className="section-title">Location astrology <span>RELOCATION + LOCAL SPACE</span></div>
    <p className="small-note">Relocation angularity compares your natal planets with the ASC/DSC/MC/IC at the current and destination locations. Local Space compares the route bearing with natal planetary directions.</p>
    {!has?<div className="muted">No close angular or local-space contacts inside the current thresholds.</div>:<div className="location-astro-grid">
      <div><b>Current location</b>{currentHits.slice(0,5).map((x,i)=><span key={i}>{x.glyph} {x.planetName} · {x.angle} · {x.orb.toFixed(1)}°</span>)}</div>
      <div><b>Destination</b>{destinationHits.slice(0,5).map((x,i)=><span key={i}>{x.glyph} {x.planetName} · {x.angle} · {x.orb.toFixed(1)}°</span>)}</div>
      <div><b>Route / Local Space</b>{localSpaceContacts.slice(0,5).map((x,i)=><span key={i}>{x.glyph} {x.planetName} · {x.azimuth.toFixed(0)}° · route orb {x.routeOrb.toFixed(1)}°</span>)}</div>
    </div>}
  </section>;
}
