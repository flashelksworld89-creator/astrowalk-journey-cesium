import { useState } from 'react';

export default function OutcomeFeedback({reading}) {
  const [saved,setSaved]=useState(false);
  if(!reading)return null;
  const record=(answer)=>{
    const old=JSON.parse(localStorage.getItem('astrowalk_outcomes')||'[]');
    old.push({answer,created:new Date().toISOString(),reading});
    localStorage.setItem('astrowalk_outcomes',JSON.stringify(old.slice(-500)));
    setSaved(true);
  };
  return <section className="card">
    <div className="section-title">Did the predicted themes occur?</div>
    {saved?<div className="success">Outcome saved on this device.</div>:<div className="segmented three">
      <button onClick={()=>record('yes')}>Yes</button>
      <button onClick={()=>record('no')}>No</button>
      <button onClick={()=>record('unsure')}>Unsure</button>
    </div>}
    <div className="small-note">Feedback is stored locally so later versions can compare confirmed and unconfirmed patterns.</div>
  </section>
}
