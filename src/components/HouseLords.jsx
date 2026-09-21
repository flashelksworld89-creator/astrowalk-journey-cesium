export default function HouseLords({lords=[]}) {
  return <section className="card">
    <div className="section-title">Natal house lords</div>
    {!lords.length ? <div className="muted">Save a natal profile to calculate house lords.</div> :
    <div className="lords-grid">{lords.map(h=><div className="lord" key={h.house}>
      <div><b>H{h.house} · {h.houseName}</b><span>{h.purpose}</span></div>
      <div>{h.sign} → <strong>{h.lordGlyph} {h.lordName}</strong></div>
      <small>Natal placement: H{h.lordHouse} · {h.lordSign} {h.lordDegree}°</small>
      {h.lordNakshatra&&<small>{h.lordNakshatra.name} · Pada {h.lordNakshatra.pada} · {h.lordCondition?.label}</small>}
      <small>{h.topics.join(' · ')}</small>
    </div>)}</div>}
  </section>
}
