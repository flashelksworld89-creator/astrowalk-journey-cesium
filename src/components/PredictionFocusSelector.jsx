const DEFAULT_LORDS=[1,3,7];
const LABELS={1:'Self',2:'Resources',3:'Communication / local travel',4:'Home',5:'Creativity',6:'Work / service',7:'Others / contracts',8:'Shared matters',9:'Long travel / belief',10:'Career',11:'Networks / gains',12:'Foreign / retreat'};

export default function PredictionFocusSelector({houseLords=[],focusHouses=[],focusLords=[],onChange}){
  const toggle=(type,house)=>{
    const current=type==='house'?focusHouses:focusLords;
    if(type==='lord'&&DEFAULT_LORDS.includes(house))return;
    const next=current.includes(house)?current.filter(x=>x!==house):[...current,house].sort((a,b)=>a-b);
    onChange?.(type,next);
  };
  return <section className="card prediction-focus-selector">
    <div className="section-title">Prediction focus <span>DEFAULT 1 · 3 · 7 LORDS</span></div>
    <p className="small-note">The 1st lord (self), 3rd lord (communication and short-distance travel), and 7th lord (other people, contracts and business relationships) stay emphasized. Add any other houses or lords you want included.</p>
    <div className="focus-selector-head"><span>House</span><span>House themes</span><span>House</span><span>Lord</span></div>
    <div className="focus-selector-grid">{Array.from({length:12},(_,i)=>i+1).map(h=>{
      const lord=houseLords.find(x=>x.house===h);
      const defaultLord=DEFAULT_LORDS.includes(h);
      return <div className={`focus-selector-row ${defaultLord?'default-focus':''}`} key={h}>
        <b>H{h}</b>
        <span>{LABELS[h]}</span>
        <label><input type="checkbox" checked={focusHouses.includes(h)} onChange={()=>toggle('house',h)}/> House</label>
        <label title={defaultLord?'Default lord focus stays active':''}><input type="checkbox" checked={focusLords.includes(h)||defaultLord} disabled={defaultLord} onChange={()=>toggle('lord',h)}/> {lord?.lordGlyph||''} {lord?.lordName||'Lord'}{defaultLord?' · default':''}</label>
      </div>})}</div>
  </section>;
}
