import { useMemo, useState } from 'react';

const PLANETS=['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','rahu','ketu'];
const CATEGORIES=['people','events','qualities','places','objects'];
const CATEGORY_ALIASES={person:'people',people:'people',event:'events',events:'events',quality:'qualities',qualities:'qualities',place:'places',places:'places',object:'objects',objects:'objects'};

function parseCsv(text){
  const out={};
  const lines=String(text||'').split(/\r?\n/).map(v=>v.trim()).filter(Boolean);
  lines.forEach((line,i)=>{
    if(i===0 && /planet/i.test(line) && /category/i.test(line)) return;
    const parts=line.split(',').map(v=>v.trim());
    if(parts.length<3)return;
    const [planetRaw,categoryRaw,termRaw,weightRaw]=parts;
    const planet=planetRaw.toLowerCase();
    const category=CATEGORY_ALIASES[categoryRaw.toLowerCase()]||categoryRaw.toLowerCase();
    if(!PLANETS.includes(planet)||!CATEGORIES.includes(category)||!termRaw)return;
    const weight=Math.max(0,Math.min(1,Number(weightRaw)||0.65));
    out[planet]??={}; out[planet][category]??=[];
    out[planet][category].push({term:termRaw,weight});
  });
  return out;
}

export default function KeywordManager(){
  const [csv,setCsv]=useState('planet,category,term,weight\nMars,events,competition,0.80\nMars,objects,machinery,0.90\nVenus,qualities,harmony,0.90');
  const [status,setStatus]=useState('');
  const json=useMemo(()=>JSON.stringify(parseCsv(csv),null,2),[csv]);
  const copy=async()=>{try{await navigator.clipboard.writeText(json);setStatus('Copied. Paste this into Vercel as PLANET_VOCAB_JSON.');}catch{setStatus('Copy was blocked. Select the JSON below and copy it manually.')}};
  const loadFile=e=>{const file=e.target.files?.[0];if(!file)return;const r=new FileReader();r.onload=()=>setCsv(String(r.result||''));r.readAsText(file);};
  return <div className="setup-page keyword-admin">
    <header className="mission-header"><div><h1>Private Keyword Vault</h1><p>Owner-only vocabulary preparation</p></div></header>
    <section className="card">
      <div className="section-title">Planet keyword CSV</div>
      <p className="small-note">Use columns: planet, category, term, weight. Categories: people, events, qualities, places, objects. This page prepares the server JSON; it does not expose the vocabulary in the normal user interface.</p>
      <input className="input" type="file" accept=".csv,text/csv" onChange={loadFile}/>
      <textarea className="input keyword-textarea" value={csv} onChange={e=>setCsv(e.target.value)}/>
      <button className="primary" onClick={copy}>Copy Vercel JSON</button>
      {status&&<div className="success">{status}</div>}
    </section>
    <section className="card">
      <div className="section-title">Generated PLANET_VOCAB_JSON</div>
      <textarea className="input keyword-json" readOnly value={json}/>
      <p className="small-note">After copying: Vercel → Project Settings → Environment Variables → PLANET_VOCAB_JSON → paste → save → redeploy.</p>
    </section>
  </div>;
}
