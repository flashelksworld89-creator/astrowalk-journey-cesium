import { Clock3 } from 'lucide-react';

function fmtDate(date){
  try{return new Intl.DateTimeFormat(undefined,{year:'numeric',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(date)}catch{return String(date||'')}
}

export default function TransitPositionsPanel({date,live,chart,predictions={}}){
  const planets=chart?.planets||[];
  return <section className="card transit-positions-panel">
    <div className="section-title"><Clock3 size={15}/> Transit positions <span>{live?'CURRENT':'SELECTED DATE'}</span></div>
    <div className="transit-panel-date">{fmtDate(date)}</div>
    {!planets.length?<div className="muted">Transit positions are being calculated…</div>:<div className="transit-position-grid">
      {planets.map(p=>{const forecast=predictions?.[p.id];return <div className="transit-position-row" key={p.id}>
        <div className="transit-planet"><b>{p.glyph} {p.name}</b>{p.retrograde&&<span className="retrograde-tag">R</span>}</div>
        <div className="transit-sign">{p.sign} {Number(p.degree).toFixed(2)}°</div>
        <div className="transit-meta">H{p.house} · {p.nakshatra?.name||'—'}{p.nakshatra?.pada?` P${p.nakshatra.pada}`:''}</div>
        {forecast&&<div className="transit-interpretation"><b>{forecast.tone==='constructive'?'Supportive':forecast.tone==='challenging'?'Challenging':'Mixed'}:</b> {forecast.headline}</div>}
      </div>})}
    </div>}
  </section>;
}
