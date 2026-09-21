import {
  ASPECT_DEFINITIONS,
  calculateAspects,
  aspectsForPlanet,
  calculateTransitNatalAspects,
  calculateTransitHouseAspects,
  destinationZoneFromBearing,
  getSignData,
  getNakshatra
} from './astro';

function readLocalVocabulary(){
  if(typeof window==='undefined')return {};
  try{return JSON.parse(localStorage.getItem('astrowalk_planet_vocab')||'{}')||{}}catch{return {}}
}

function pointAspect(transitLon,pointLon){
  if(!Number.isFinite(Number(transitLon))||!Number.isFinite(Number(pointLon)))return null;
  const separation=Math.abs(((Number(transitLon)-Number(pointLon)+540)%360)-180);
  let best=null;
  for(const def of ASPECT_DEFINITIONS){
    const delta=Math.abs(separation-def.angle);
    if(delta<=def.orb&&(!best||delta<best.orb))best={type:def.type,angle:def.angle,orb:delta};
  }
  return best?{...best,orb:Number(best.orb.toFixed(2))}:null;
}

function buildNatalHouseContexts(natalChart,houseLords){
  return (natalChart?.houseCusps||[]).map((cusp,index)=>{
    const house=index+1,sign=getSignData(cusp),nakshatra=getNakshatra(cusp);
    const occupants=(natalChart?.planets||[]).filter(p=>Number(p.house)===house).map(p=>({id:p.id,name:p.name,glyph:p.glyph,sign:p.sign,degree:Number(p.degree),nakshatra:p.nakshatra?.name,pada:p.nakshatra?.pada}));
    const lord=(houseLords||[]).find(h=>Number(h.house)===house)||null;
    return {house,cusp:Number(cusp),sign:sign.sign,degree:Number(sign.degreeDecimal),nakshatra:nakshatra.name,pada:nakshatra.pada,occupants,lord};
  });
}

function buildLordTransitPlacements(chart,houseLords){
  return (houseLords||[]).map(row=>{
    const t=(chart?.planets||[]).find(p=>p.id===row.lordId);
    return {house:Number(row.house),lordId:row.lordId,lordName:row.lordName,natalLordHouse:row.lordHouse,natalLordSign:row.lordSign,transit:t?{id:t.id,name:t.name,glyph:t.glyph,house:t.house,sign:t.sign,degree:Number(t.degree),siderealLon:Number(t.siderealLon),nakshatra:t.nakshatra?.name,pada:t.nakshatra?.pada,retrograde:Boolean(t.retrograde),condition:t.condition?.label}:null};
  });
}

function buildRoutePointAspects(planets,routeContext,destinationZone){
  const points=[];
  if(routeContext?.start?.longitude!=null)points.push({key:'current',label:'current location field',...routeContext.start});
  if(routeContext?.end?.longitude!=null)points.push({key:'destination',label:'destination field',...routeContext.end});
  if(!points.some(p=>p.key==='destination')&&destinationZone?.longitude!=null)points.push({key:'destination',label:'destination field',...destinationZone,nakshatra:destinationZone.nakshatra?.name});
  const hits=[];
  for(const p of planets||[]){
    for(const point of points){
      const a=pointAspect(p.siderealLon,point.longitude);
      if(a)hits.push({...a,transitId:p.id,transitName:p.name,pointKey:point.key,pointLabel:point.label,pointHouse:point.house,pointSign:point.sign,pointNakshatra:typeof point.nakshatra==='string'?point.nakshatra:point.nakshatra?.name,pointLongitude:Number(point.longitude)});
    }
  }
  return hits.sort((a,b)=>a.orb-b.orb);
}

export async function requestPrivateInterpretation({chart,natalChart,houseLords,origin,destination,bearing,direction,distanceKm,selectedDate,focusHouses=[],focusLords=[],relocationCurrent=[],relocationDestination=[],localSpaceContacts=[],routeContext=null}){
  if(!chart?.planets?.length||!natalChart?.planets?.length)return null;
  const transitAspects=calculateAspects(chart.planets);
  const transitNatalAspects=calculateTransitNatalAspects(chart.planets,natalChart.planets);
  const natalHouseAspects=calculateTransitHouseAspects(chart.planets,natalChart.houseCusps);
  const zone=destinationZoneFromBearing(chart,bearing);
  const natalHouseContexts=buildNatalHouseContexts(natalChart,houseLords);
  const lordTransitPlacements=buildLordTransitPlacements(chart,houseLords);
  const routePointAspects=buildRoutePointAspects(chart.planets,routeContext,zone);
  const planets=chart.planets.map(p=>({
    id:p.id,name:p.name,glyph:p.glyph,sign:p.sign,degree:Number(p.degree),siderealLon:Number(p.siderealLon),house:p.house,
    nakshatra:p.nakshatra?.name,pada:p.nakshatra?.pada,retrograde:p.retrograde,longitudeSpeed:Number(p.longitudeSpeed),
    condition:p.condition?.label,conditionStrength:p.condition?.strength,aspects:aspectsForPlanet(p.id,transitAspects)
  }));
  const natalPlanets=natalChart.planets.map(p=>({id:p.id,name:p.name,glyph:p.glyph,sign:p.sign,degree:Number(p.degree),siderealLon:Number(p.siderealLon),house:p.house,nakshatra:p.nakshatra?.name,pada:p.nakshatra?.pada}));
  const transitMoon=planets.find(p=>p.id==='moon')||null,natalMoon=natalPlanets.find(p=>p.id==='moon')||null;
  const moonNatalAspects=transitNatalAspects.filter(a=>a.transitId==='moon'&&a.natalId==='moon');

  const response=await fetch('/api/interpret',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
    date:selectedDate?.toISOString?.()||String(selectedDate||''),origin:{lat:origin?.lat,lng:origin?.lng},destination:{lat:destination?.lat,lng:destination?.lng},bearing,direction,distanceKm,
    destinationZone:zone,planets,natalPlanets,natalHouseContexts,houseLords,lordTransitPlacements,transitNatalAspects,natalHouseAspects,routePointAspects,
    transitMoon,natalMoon,moonNatalAspects,natalAsc:natalChart.asc,natalHouseCusps:natalChart.houseCusps,
    focusHouses,focusLords,relocationCurrent,relocationDestination,localSpaceContacts,routeContext,customVocabulary:readLocalVocabulary()
  })});
  if(!response.ok)throw new Error('Interpretation service unavailable');
  return response.json();
}
