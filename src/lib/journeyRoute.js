import { bearingBetween, destinationZoneFromBearing, distanceKmBetween } from './astro';

const norm=n=>((Number(n)%360)+360)%360;
const signed=(a,b)=>((norm(a)-norm(b)+540)%360)-180;
const GANDANTA=[
  {longitude:0,label:'Revati → Ashwini · Pisces/Aries'},
  {longitude:120,label:'Ashlesha → Magha · Cancer/Leo'},
  {longitude:240,label:'Jyeshtha → Mula · Scorpio/Sagittarius'}
];
function interpolate(a,b,t){return {lat:a.lat+(b.lat-a.lat)*t,lng:a.lng+(b.lng-a.lng)*t}}
function densify(path,stepMeters=120){
  const out=[];
  for(let i=0;i<(path||[]).length;i++){
    const a=path[i],b=path[i+1];out.push(a);if(!b)continue;
    const m=(distanceKmBetween(a,b)||0)*1000,n=Math.max(1,Math.ceil(m/stepMeters));
    for(let k=1;k<n;k++)out.push(interpolate(a,b,k/n));
  }
  return out;
}
function crosses(a,b,target){
  const da=signed(a,target),db=signed(b,target);return Math.abs(da)<.5||Math.abs(db)<.5||(Math.sign(da)!==Math.sign(db)&&Math.abs(signed(a,b))<30);
}
export function analyzeJourneyRoute({path,cityCenter,chart}){
  if(!chart||!cityCenter||!path?.length)return null;
  const samples=densify(path,100);
  const zones=samples.map(point=>{
    const bearing=bearingBetween(cityCenter,point);
    const zone=destinationZoneFromBearing(chart,bearing);
    return {...zone,point,bearing};
  }).filter(Boolean);
  if(!zones.length)return null;
  const houses=[],naks=[];
  for(const z of zones){
    if(houses[houses.length-1]!==z.house)houses.push(z.house);
    const n=z.nakshatra?.name;if(n&&naks[naks.length-1]!==n)naks.push(n);
  }
  const gandanta=[];
  for(let i=0;i<zones.length-1;i++){
    for(const g of GANDANTA){
      if(crosses(zones[i].longitude,zones[i+1].longitude,g.longitude)&&!gandanta.some(x=>x.label===g.label))gandanta.push({...g,point:zones[i+1].point});
    }
  }
  const first=zones[0],last=zones[zones.length-1];
  return {
    start:{house:first.house,sign:first.sign,nakshatra:first.nakshatra?.name,longitude:first.longitude},
    end:{house:last.house,sign:last.sign,nakshatra:last.nakshatra?.name,longitude:last.longitude},
    houseSequence:houses,nakshatraSequence:naks,houseCount:houses.length,nakshatraCount:naks.length,gandanta
  };
}
