import { useEffect,useMemo,useState } from 'react';
import { ChevronLeft,ChevronRight,MapPin,Navigation,RefreshCw } from 'lucide-react';
import { NAKSHATRAS,bearingBetween,distanceKmBetween,destinationZoneFromBearing } from '../lib/astro';

const COLORS=['#ef4444','#f97316','#fb923c','#f59e0b','#eab308','#84cc16','#22c55e','#10b981','#14b8a6','#06b6d4','#0ea5e9','#3b82f6','#6366f1','#8b5cf6','#a855f7','#c026d3','#db2777','#e11d48','#dc2626','#ea580c','#ca8a04','#65a30d','#16a34a','#0d9488','#0284c7','#4f46e5','#9333ea'];
const rad=d=>d*Math.PI/180;
function segmentKm(a,b){
  const R=6371.0088,dLat=rad(b.lat-a.lat),dLon=rad(b.lng-a.lng),p1=rad(a.lat),p2=rad(b.lat);
  const h=Math.sin(dLat/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(h));
}
function midpoint(a,b){return {lat:(a.lat+b.lat)/2,lng:(a.lng+b.lng)/2}}
function roadIndex(roads,cityCenter,chart){
  const bins=Array.from({length:27},(_,index)=>({index,name:NAKSHATRAS[index],roads:[]}));
  if(!cityCenter||!chart)return bins;
  const grouped=new Map();
  for(const road of roads||[]){
    const pts=road.geometry||[];
    for(let i=0;i<pts.length-1;i++){
      const a=pts[i],b=pts[i+1],mid=midpoint(a,b),bearing=bearingBetween(cityCenter,mid);
      const zone=destinationZoneFromBearing(chart,bearing);
      const idx=Number(zone?.nakshatra?.index);
      if(!Number.isInteger(idx)||idx<0||idx>26)continue;
      const km=segmentKm(a,b);
      const key=`${idx}|${road.name}`;
      let item=grouped.get(key);
      if(!item){item={id:key,name:road.name,type:road.type,ref:road.ref||'',nakshatraIndex:idx,km:0,geometry:[],representative:mid,house:zone.house,bearing};grouped.set(key,item)}
      item.km+=km;item.geometry.push(a,b);
      if(km>0.08)item.representative=mid;
    }
  }
  for(const item of grouped.values())bins[item.nakshatraIndex].roads.push(item);
  bins.forEach(bin=>bin.roads.sort((a,b)=>b.km-a.km));
  return bins;
}

export default function NakshatraExplorer({cityCenter,cityRadiusMeters,chart,userLocation,streetViewActive,onHighlightRoad,onSetDestination,onOpenStreet}){
  const [open,setOpen]=useState(true),[roads,setRoads]=useState([]),[loading,setLoading]=useState(false),[error,setError]=useState(''),[expanded,setExpanded]=useState(null);
  const loadRoads=async()=>{
    if(!cityCenter)return;
    setLoading(true);setError('');
    try{
      const r=await fetch('/api/roads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lat:cityCenter.lat,lng:cityCenter.lng,radiusMeters:Math.min(30000,Math.max(8000,Number(cityRadiusMeters)||22000))})});
      const data=await r.json();
      if(!r.ok)throw new Error(data?.error||'Road network unavailable.');
      setRoads(data.roads||[]);
    }catch(e){setError(e?.message||'Road network unavailable.')}finally{setLoading(false)}
  };
  useEffect(()=>{loadRoads()},[cityCenter?.lat,cityCenter?.lng,Math.round(Number(cityRadiusMeters)||0)]);
  const bins=useMemo(()=>roadIndex(roads,cityCenter,chart),[roads,cityCenter,chart]);
  const localBin=useMemo(()=>{
    if(!streetViewActive||!cityCenter||!userLocation||!chart)return null;
    const zone=destinationZoneFromBearing(chart,bearingBetween(cityCenter,userLocation));
    const idx=zone?.nakshatra?.index;
    return Number.isInteger(idx)?bins[idx]:null;
  },[streetViewActive,cityCenter,userLocation,chart,bins]);
  const visibleBins=streetViewActive&&localBin?[localBin]:bins;

  return <aside className={`nak-explorer ${open?'open':'collapsed'} ${streetViewActive?'local':''}`}>
    <button className="nak-collapse" type="button" onClick={()=>setOpen(v=>!v)} aria-label={open?'Collapse Nakshatra Explorer':'Open Nakshatra Explorer'}>{open?<ChevronLeft size={18}/>:<ChevronRight size={18}/>}</button>
    {open&&<div className="nak-explorer-inner">
      <div className="nak-explorer-head"><div><small>{streetViewActive?'LOCAL STREET MODE':'CITY COMPASS INDEX'}</small><b>Nakshatra Explorer</b></div><button type="button" onClick={loadRoads} disabled={loading} title="Refresh roads"><RefreshCw size={15} className={loading?'spin':''}/></button></div>
      <p className="nak-explorer-note">{streetViewActive?'Nearby major streets inside your current nakshatra field.':'Major streets are ranked by how much roadway currently lies inside each city-scale nakshatra wedge.'}</p>
      {error&&<div className="nak-explorer-error">{error}</div>}
      {loading&&!roads.length&&<div className="nak-explorer-loading">Loading city roads…</div>}
      <div className="nak-list">
        {visibleBins.map(bin=>{
          const isExpanded=streetViewActive||expanded===bin.index;
          return <section className="nak-group" key={bin.index} style={{'--nak':COLORS[bin.index]}}>
            <button className="nak-group-head" type="button" onClick={()=>setExpanded(isExpanded&&!streetViewActive?null:bin.index)}>
              <span className="nak-swatch"/><span><b>{bin.index+1}. {bin.name}</b><small>{bin.roads.length?`${bin.roads.length} major road${bin.roads.length===1?'':'s'}`:'No indexed major roads'}</small></span>
            </button>
            {isExpanded&&<div className="nak-roads">{bin.roads.slice(0,12).map((road,i)=>{
              const d=userLocation?distanceKmBetween(userLocation,road.representative):null;
              return <div className="nak-road" key={`${road.id}-${i}`}>
                <button className="nak-road-main" type="button" onClick={()=>onHighlightRoad?.(road)}><b>{road.name}</b><span>{road.km.toFixed(1)} km inside field · H{road.house}{Number.isFinite(d)?` · ${d.toFixed(1)} km away`:''}</span></button>
                <div className="nak-road-actions"><button type="button" onClick={()=>onSetDestination?.({...road.representative,label:`${road.name} · ${bin.name}`})} title="Set destination"><Navigation size={13}/></button><button type="button" onClick={()=>onOpenStreet?.({...road.representative,label:road.name})} title="Open Street View"><MapPin size={13}/></button></div>
              </div>
            })}{!bin.roads.length&&<div className="nak-empty">No major road segments indexed in this wedge.</div>}</div>}
          </section>
        })}
      </div>
    </div>}
  </aside>
}
