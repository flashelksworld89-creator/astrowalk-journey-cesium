import { useEffect, useState } from 'react';
import { LocateFixed, Footprints, Car, Play, MapPin } from 'lucide-react';
import { geocodeWithGoogle } from '../lib/googleMaps';

function parseCoords(text){const m=text.trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);if(!m)return null;const lat=Number(m[1]),lng=Number(m[2]);if(Math.abs(lat)>90||Math.abs(lng)>180)return null;return{lat,lng,label:`${lat.toFixed(5)}, ${lng.toFixed(5)}`};}
async function resolvePlace(text){return parseCoords(text)||geocodeWithGoogle(text);}
function toLocalInput(date){const pad=n=>String(n).padStart(2,'0');return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;}
const OFFSETS=Array.from({length:53},(_,i)=>{const minutes=-12*60+i*30;const sign=minutes>=0?'+':'-';const a=Math.abs(minutes);return `${sign}${String(Math.floor(a/60)).padStart(2,'0')}:${String(a%60).padStart(2,'0')}`;});

export default function MissionSetup({initial,gps,gpsError,onStart}){
  const [profile,setProfile]=useState(initial?.profile||{name:'',birthDate:'',birthTime:'12:00',birthPlace:'',birthLat:'',birthLng:'',birthUtcOffset:''});
  const [currentText,setCurrentText]=useState(initial?.location?.label||'');
  const [destinationText,setDestinationText]=useState(initial?.destination?.label||'');
  const [location,setLocation]=useState(initial?.location||null);
  const [destination,setDestination]=useState(initial?.destination||null);
  const [originSource,setOriginSource]=useState(initial?.originSource||'manual');
  const [date,setDate]=useState(initial?.date?new Date(initial.date):new Date());
  const [travelMode,setTravelMode]=useState(initial?.travelMode||'walk');
  const [unit,setUnit]=useState(initial?.unit||'mi');
  const [error,setError]=useState(''); const [busy,setBusy]=useState('');

  useEffect(()=>{
    if(!location&&gps){
      setLocation(gps);
      setCurrentText(gps.label||`${gps.lat}, ${gps.lng}`);
      setOriginSource('gps');
    }
  },[gps,location]);

  const useGps=()=>{
    if(gps){
      setLocation(gps);
      setCurrentText(gps.label||`${gps.lat}, ${gps.lng}`);
      setOriginSource('gps');
      setError('');
    } else setError(gpsError||'Waiting for device GPS. Allow location access in the browser.');
  };

  const lookup=async type=>{try{setError('');setBusy(type);if(type==='current'){const found=await resolvePlace(currentText);setLocation({...found,manual:true});setOriginSource('manual');setCurrentText(found.label)}else if(type==='destination'){const found=await resolvePlace(destinationText);setDestination(found);setDestinationText(found.label)}else{const found=await resolvePlace(profile.birthPlace);setProfile({...profile,birthPlace:found.label,birthLat:found.lat,birthLng:found.lng})}}catch(e){setError(e.message||'Location lookup failed.')}finally{setBusy('')}};

  const start=async()=>{try{setError('');let nextProfile={...profile};if(!nextProfile.birthDate)throw new Error('Enter the birth date.');if(!nextProfile.birthTime)throw new Error('Enter the birth time.');if(!nextProfile.birthUtcOffset)throw new Error('Choose the UTC offset that applied at the birth location and date.');if((nextProfile.birthLat===''||nextProfile.birthLng==='')&&nextProfile.birthPlace){setBusy('birth');const found=await resolvePlace(nextProfile.birthPlace);nextProfile={...nextProfile,birthPlace:found.label,birthLat:found.lat,birthLng:found.lng};setProfile(nextProfile)}if(nextProfile.birthLat===''||nextProfile.birthLng==='')throw new Error('Enter the birth place.');let startLocation=location;if(!startLocation&&currentText){const found=await resolvePlace(currentText);startLocation={...found,manual:true};setOriginSource('manual')}if(!startLocation)throw new Error('Enter or allow the current location.');let endLocation=destination;if(!endLocation&&destinationText)endLocation=await resolvePlace(destinationText);if(!endLocation)throw new Error('Enter a destination.');const trackingMode=originSource==='gps'?travelMode:'static';onStart({profile:nextProfile,location:startLocation,destination:endLocation,date:date.toISOString(),travelMode,trackingMode,originSource,unit});}catch(e){setError(e.message||'Could not start mission.')}finally{setBusy('')}};

  return <div className="setup-page">
    <header className="mission-header"><div><h1>AstroWalk Journey</h1><p>Birth chart → live transit → current position → destination zone</p></div></header>
    <section className="card setup-step"><div className="section-title"><b>1</b> Birth data</div><div className="form-grid">
      <input className="input" placeholder="Name (optional)" value={profile.name} onChange={e=>setProfile({...profile,name:e.target.value})}/>
      <input className="input" type="date" value={profile.birthDate} onChange={e=>setProfile({...profile,birthDate:e.target.value})}/>
      <input className="input" type="time" value={profile.birthTime} onChange={e=>setProfile({...profile,birthTime:e.target.value})}/>
      <select className="input" value={profile.birthUtcOffset||''} onChange={e=>setProfile({...profile,birthUtcOffset:e.target.value})}><option value="">Birth UTC offset…</option>{OFFSETS.map(o=><option key={o} value={o}>UTC{o}</option>)}</select>
      <div className="row full"><input className="input" placeholder="Birth city or place" value={profile.birthPlace} onChange={e=>setProfile({...profile,birthPlace:e.target.value})}/><button onClick={()=>lookup('birth')}>{busy==='birth'?'…':'Find'}</button></div>
    </div><div className="small-note">The UTC offset matters because the natal Ascendant and houses depend on the exact birth time at the birth location.</div></section>

    <section className="card setup-step"><div className="section-title"><b>2</b> Current location</div><div className="row"><input className="input" placeholder="Address, city, landmark, or lat,lng" value={currentText} onChange={e=>{setCurrentText(e.target.value);setOriginSource('manual')}}/><button onClick={()=>lookup('current')}>{busy==='current'?'…':'Set'}</button><button onClick={useGps} title="Use device GPS"><LocateFixed size={16}/></button></div><div className="location-source"><MapPin size={13}/><span>{originSource==='gps'?'Live GPS selected — walking/driving tracking can follow the device.':'Manual origin selected — journey will remain static unless Live GPS is chosen.'}</span></div>{gpsError&&<div className="small-note">GPS: {gpsError}</div>}</section>

    <section className="card setup-step"><div className="section-title"><b>3</b> Destination</div><div className="row"><input className="input" placeholder="Address, city, landmark, or lat,lng" value={destinationText} onChange={e=>setDestinationText(e.target.value)}/><button onClick={()=>lookup('destination')}>{busy==='destination'?'…':'Find'}</button></div><label>Journey date and time</label><input className="input" type="datetime-local" value={toLocalInput(date)} onChange={e=>setDate(new Date(e.target.value))}/><div className="segmented mission-modes"><button className={travelMode==='walk'?'active':''} onClick={()=>setTravelMode('walk')}><Footprints size={16}/> Walk</button><button className={travelMode==='drive'?'active':''} onClick={()=>setTravelMode('drive')}><Car size={16}/> Drive</button></div><div className="unit-row"><span>Distance units</span>{['ft','yd','mi','m','km'].map(u=><button key={u} className={unit===u?'active':''} onClick={()=>setUnit(u)}>{u}</button>)}</div>{error&&<div className="error">{error}</div>}<button className="start-mission" onClick={start}><Play size={17}/> Calculate Journey</button></section>
  </div>;
}
