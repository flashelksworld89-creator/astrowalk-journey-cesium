import { useEffect, useState } from 'react';
import { Clock3, CalendarDays } from 'lucide-react';

export default function CurrentDateTimeWidget(){
  const [now,setNow]=useState(()=>new Date());
  useEffect(()=>{const id=setInterval(()=>setNow(new Date()),1000);return()=>clearInterval(id)},[]);
  const time=now.toLocaleTimeString([], {hour:'numeric',minute:'2-digit',second:'2-digit'});
  const date=now.toLocaleDateString([], {weekday:'short',month:'short',day:'numeric',year:'numeric'});
  const zone=Intl.DateTimeFormat().resolvedOptions().timeZone||'Local time';
  return <section className="card current-time-widget">
    <div className="section-title"><Clock3 size={16}/> Current time <span>LIVE</span></div>
    <div className="current-time-main">{time}</div>
    <div className="current-time-date"><CalendarDays size={13}/><span>{date}</span></div>
    <small>{zone}</small>
  </section>;
}
