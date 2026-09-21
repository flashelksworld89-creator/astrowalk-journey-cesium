import { ChevronLeft, ChevronRight, Clock3 } from 'lucide-react';

function toLocalInput(date) {
  const pad = n => String(n).padStart(2,'0');
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function TimeNavigator({ date, onChange, live, onLive }) {
  const shift = ms => onChange(new Date(date.getTime() + ms));
  return (
    <section className="card">
      <div className="section-title"><Clock3 size={16}/> Journey time <span>{live ? 'LIVE' : 'PAST / FUTURE'}</span></div>
      <input className="input" type="datetime-local" value={toLocalInput(date)}
        onChange={e => onChange(new Date(e.target.value))}/>
      <div className="time-grid">
        <button onClick={()=>shift(-86400000)}>-1 day</button>
        <button onClick={()=>shift(-3600000)}><ChevronLeft size={16}/></button>
        <button className={live?'active':''} onClick={onLive}>Now</button>
        <button onClick={()=>shift(3600000)}><ChevronRight size={16}/></button>
        <button onClick={()=>shift(86400000)}>+1 day</button>
      </div>
    </section>
  );
}
