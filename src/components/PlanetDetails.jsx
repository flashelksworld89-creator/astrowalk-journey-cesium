import { getHousesRuledByPlanet, HOUSE_MEANINGS } from '../lib/astro';

export default function PlanetDetails({planet,houseLords}) {
  if(!planet) return <section className="card muted">Select a planet to inspect its exact sidereal placement and natal house-lord connections.</section>;
  const ruled=getHousesRuledByPlanet(houseLords,planet.id);
  const transitMeaning=HOUSE_MEANINGS[planet.house];
  const houseLord=houseLords.find(h=>h.house===planet.house);
  return <section className="card">
    <div className="planet-head"><span>{planet.glyph}</span><div><h3>{planet.name}</h3><p>{planet.sign} {planet.degree}° · H{planet.house}</p></div></div>
    <div className="stats">
      <div><small>Nakshatra</small><b>{planet.nakshatra?.name} · Pada {planet.nakshatra?.pada}</b></div>
      <div><small>Condition</small><b>{planet.condition?.label}{planet.retrograde?' · Rx':''}</b></div>
      <div><small>Sidereal longitude</small><b>{planet.siderealLon?.toFixed(4)}°</b></div>
      <div><small>Degree in sign</small><b>{planet.degree}°</b></div>
    </div>
    <p className="reading"><b>Transit house:</b> H{planet.house} emphasizes {transitMeaning?.topics.slice(0,5).join(', ')}.</p>
    {houseLord&&<p className="reading"><b>Lord of that house:</b> {houseLord.lordName} rules H{planet.house} natally and is placed in natal H{houseLord.lordHouse}.</p>}
    {ruled.length>0&&<p className="reading"><b>{planet.name} rules natal:</b> {ruled.map(h=>`H${h.house} ${h.houseName}`).join(' · ')}.</p>}
  </section>
}
