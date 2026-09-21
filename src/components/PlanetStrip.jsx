export default function PlanetStrip({planets,selected,onSelect}) {
  return <div className="planet-strip">
    {planets.map(p=><button key={p.id} className={selected?.id===p.id?'selected':''} onClick={()=>onSelect(p)}>
      <span>{p.glyph}</span><small>{p.name}</small>
    </button>)}
  </div>
}
