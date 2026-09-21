import { useEffect, useMemo, useState } from 'react';

const PLANETS=['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','rahu','ketu'];
const CATEGORIES=['people','events','qualities','places','objects'];
const CATEGORY_ALIASES={person:'people',people:'people',event:'events',events:'events',quality:'qualities',qualities:'qualities',place:'places',places:'places',object:'objects',objects:'objects'};
const STORAGE_KEY='astrowalk_planet_vocab';

function parseCsv(text){
  const out={};
  String(text||'').split(/\r?\n/).map(v=>v.trim()).filter(Boolean).forEach((line,i)=>{
    if(i===0&&/planet/i.test(line)&&/category/i.test(line))return;
    const [planetRaw,categoryRaw,termRaw,weightRaw]=line.split(',').map(v=>v.trim());
    if(!planetRaw||!categoryRaw||!termRaw)return;
    const planet=planetRaw.toLowerCase();
    const category=CATEGORY_ALIASES[categoryRaw.toLowerCase()]||categoryRaw.toLowerCase();
    if(!PLANETS.includes(planet)||!CATEGORIES.includes(category))return;
    const weight=Math.max(0,Math.min(1,Number(weightRaw)||0.65));
    out[planet]??={};out[planet][category]??=[];out[planet][category].push({term:termRaw,weight});
  });
  return out;
}
function jsonToCsv(data){
  const rows=['planet,category,term,weight'];
  for(const [planet,banks] of Object.entries(data||{}))for(const [category,items] of Object.entries(banks||{}))for(const item of items||[])rows.push(`${planet},${category},${String(item?.term||'').replaceAll(',',' ')},${Number(item?.weight)||0.65}`);
  return rows.join('\n');
}

export default function KeywordManager(){
  const [csv,setCsv]=useState('planet,category,term,weight\nMars,events,competition,0.80\nMars,objects,machinery,0.90\nVenus,qualities,harmony,0.90');
  const [status,setStatus]=useState('');
  useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');if(Object.keys(saved).length)setCsv(jsonToCsv(saved))}catch{}},[]);
  const parsed=useMemo(()=>parseCsv(csv),[csv]);
  const json=useMemo(()=>JSON.stringify(parsed,null,2),[parsed]);
  const save=()=>{try{localStorage.setItem(STORAGE_KEY,json);setStatus('Saved to this browser. AstroWalk will use these private terms immediately—no Vercel variable or redeploy needed.')}catch{setStatus('Browser storage is unavailable.')}};
  const copy=async()=>{try{await navigator.clipboard.writeText(json);setStatus('JSON copied as a backup.')}catch{setStatus('Copy was blocked. Select the JSON below and copy it manually.')}};
  const clear=()=>{localStorage.removeItem(STORAGE_KEY);setStatus('Custom vocabulary cleared. AstroWalk will use its built-in vocabulary.');};
  const loadFile=e=>{const file=e.target.files?.[0];if(!file)return;const r=new FileReader();r.onload=()=>setCsv(String(r.result||''));r.readAsText(file);};
  return <div className="setup-page keyword-admin">
    <header className="mission-header"><div><h1>Private Keyword Vault</h1><p>Owner vocabulary stored locally in this browser</p></div></header>
    <section className="card">
      <div className="section-title">Planet keyword CSV</div>
      <p className="small-note">Columns: planet, category, term, weight. Categories: people, events, qualities, places, objects. Saving here does not require a Vercel environment variable.</p>
      <input className="input" type="file" accept=".csv,text/csv" onChange={loadFile}/>
      <textarea className="input keyword-textarea" value={csv} onChange={e=>setCsv(e.target.value)}/>
      <div className="row"><button className="primary" onClick={save}>Save to this browser</button><button onClick={copy}>Copy backup JSON</button><button className="quiet" onClick={clear}>Clear custom terms</button></div>
      {status&&<div className="success">{status}</div>}
    </section>
    <section className="card"><div className="section-title">Current private vocabulary JSON</div><textarea className="input keyword-json" readOnly value={json}/><p className="small-note">This data stays in browser storage unless you copy/export it. The deployed app keeps a built-in fallback vocabulary on the server.</p></section>
  </div>;
}
