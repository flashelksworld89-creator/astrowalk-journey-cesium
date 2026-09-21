import { useState } from 'react';
import { ChevronDown, ChevronUp, Ruler } from 'lucide-react';
const UNITS = {
  ft: { label:'Feet', toMeters:v=>v*0.3048, fromMeters:m=>m/0.3048, min:100, max:10000, step:50 },
  yd: { label:'Yards', toMeters:v=>v*0.9144, fromMeters:m=>m/0.9144, min:50, max:5000, step:25 },
  mi: { label:'Miles', toMeters:v=>v*1609.344, fromMeters:m=>m/1609.344, min:0.05, max:10, step:0.05 },
  m:  { label:'Meters', toMeters:v=>v, fromMeters:m=>m, min:25, max:5000, step:25 },
  km: { label:'Kilometers', toMeters:v=>v*1000, fromMeters:m=>m/1000, min:0.05, max:15, step:0.05 }
};

const PRESETS = [
  {label:'250 ft', meters:76.2},
  {label:'500 ft', meters:152.4},
  {label:'¼ mi', meters:402.336},
  {label:'1 mi Ø', meters:804.672},
  {label:'1 mi', meters:1609.344},
  {label:'5 mi', meters:8046.72}
];

function pretty(value, unit) {
  if(unit==='mi'||unit==='km') return value<1 ? value.toFixed(2) : value.toFixed(value<10?1:0);
  return Math.round(value).toLocaleString();
}

export default function MapScaleControls({radiusMeters, unit, onUnitChange, onRadiusChange}) {
  const [open,setOpen]=useState(false);
  const cfg=UNITS[unit]||UNITS.ft;
  const raw=cfg.fromMeters(radiusMeters);
  const value=Math.min(cfg.max,Math.max(cfg.min,raw));

  const setDisplayValue=(next)=>{
    const parsed=Number(next);
    if(!Number.isFinite(parsed))return;
    onRadiusChange(cfg.toMeters(Math.min(cfg.max,Math.max(cfg.min,parsed))));
  };

  return (
    <div className={`map-scale-panel ${open?'open':'collapsed'}`} aria-label="Wheel geographic scale">
      <button type="button" className="scale-collapse" onClick={()=>setOpen(v=>!v)} aria-expanded={open}>
        <span><Ruler size={14}/><strong>Wheel radius</strong></span>
        <span>{pretty(raw,unit)} {unit} {open?<ChevronUp size={14}/>:<ChevronDown size={14}/>}</span>
      </button>
      {open&&<>
      <div className="scale-row">
        <input
          aria-label="Wheel radius"
          type="range"
          min={cfg.min}
          max={cfg.max}
          step={cfg.step}
          value={value}
          onChange={e=>setDisplayValue(e.target.value)}
        />
        <select value={unit} onChange={e=>onUnitChange(e.target.value)} aria-label="Distance unit">
          {Object.entries(UNITS).map(([key,item])=><option key={key} value={key}>{item.label}</option>)}
        </select>
      </div>
      <div className="scale-presets">
        {PRESETS.map(p=><button type="button" key={p.label} onClick={()=>onRadiusChange(p.meters)}>{p.label}</button>)}
      </div>
      <div className="scale-note">Map display radius only. Street mode uses a fixed 1-mile nakshatra field depth.</div>
      </>}
    </div>
  );
}
