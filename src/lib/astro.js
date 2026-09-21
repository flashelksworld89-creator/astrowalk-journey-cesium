import {
  SwissEphemeris,
  Planet,
  LunarPoint,
  SiderealMode,
  HouseSystem
} from '@swisseph/browser';

export const ZODIAC_SIGNS = [
  'Aries','Taurus','Gemini','Cancer','Leo','Virgo',
  'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'
];
export const ZODIAC_GLYPHS = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];

export const NAKSHATRAS = [
  'Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra',
  'Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni',
  'Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha',
  'Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishta','Shatabhisha',
  'Purva Bhadrapada','Uttara Bhadrapada','Revati'
];


export const ASPECT_DEFINITIONS = [
  {type:'Conjunction',angle:0,orb:6},
  {type:'Sextile',angle:60,orb:5},
  {type:'Square',angle:90,orb:6},
  {type:'Trine',angle:120,orb:6},
  {type:'Quincunx',angle:150,orb:4},
  {type:'Opposition',angle:180,orb:6}
];

export function calculateAspects(planets, definitions=ASPECT_DEFINITIONS) {
  const result=[];
  const list=(planets||[]).filter(p=>Number.isFinite(p.siderealLon));
  for(let i=0;i<list.length;i++){
    for(let j=i+1;j<list.length;j++){
      const a=list[i],b=list[j];
      const separation=Math.abs(((a.siderealLon-b.siderealLon+540)%360)-180);
      let best=null;
      for(const def of definitions){
        const delta=Math.abs(separation-def.angle);
        if(delta<=def.orb && (!best || delta<best.orbDelta)) best={...def,orbDelta:delta};
      }
      if(best){
        result.push({
          type:best.type,
          angle:best.angle,
          orb:Number(best.orbDelta.toFixed(2)),
          aId:a.id,aName:a.name,bId:b.id,bName:b.name
        });
      }
    }
  }
  return result;
}

export function aspectsForPlanet(planetId, aspects=[]) {
  return aspects.filter(a=>a.aId===planetId||a.bId===planetId).map(a=>({
    type:a.type,
    orb:a.orb,
    with:a.aId===planetId?a.bName:a.aName,
    withId:a.aId===planetId?a.bId:a.aId
  }));
}

export const SIGN_LORDS = {
  Aries:'mars', Taurus:'venus', Gemini:'mercury', Cancer:'moon',
  Leo:'sun', Virgo:'mercury', Libra:'venus', Scorpio:'mars',
  Sagittarius:'jupiter', Capricorn:'saturn', Aquarius:'saturn', Pisces:'jupiter'
};

export const HOUSE_MEANINGS = {
  1:{name:'Self',purpose:'Dharma',topics:['identity','body','health','appearance','life direction']},
  2:{name:'Resources',purpose:'Artha',topics:['money','family resources','speech','food','values','possessions']},
  3:{name:'Effort',purpose:'Kama',topics:['communication','courage','skills','siblings','short journeys','initiative']},
  4:{name:'Home',purpose:'Moksha',topics:['home','property','mother','emotional foundation','private life']},
  5:{name:'Creativity',purpose:'Dharma',topics:['children','creativity','intelligence','romance','study','self-expression']},
  6:{name:'Service',purpose:'Artha',topics:['work','service','health routines','debts','conflict','obstacles']},
  7:{name:'Partnership',purpose:'Kama',topics:['marriage','partners','contracts','clients','one-to-one relationships']},
  8:{name:'Transformation',purpose:'Moksha',topics:['shared resources','inheritance','secrets','vulnerability','sudden change','transformation']},
  9:{name:'Purpose',purpose:'Dharma',topics:['belief','teachers','higher learning','long journeys','fortune','dharma']},
  10:{name:'Action',purpose:'Artha',topics:['career','reputation','status','responsibility','public life','achievement']},
  11:{name:'Gains',purpose:'Kama',topics:['income','gains','friends','networks','ambitions','goals']},
  12:{name:'Release',purpose:'Moksha',topics:['retreat','expenses','foreign places','solitude','sleep','spiritual release']}
};

const PLANET_META = [
  ['sun','Sun','☉',Planet.Sun],
  ['moon','Moon','☽',Planet.Moon],
  ['mercury','Mercury','☿',Planet.Mercury],
  ['venus','Venus','♀',Planet.Venus],
  ['mars','Mars','♂',Planet.Mars],
  ['jupiter','Jupiter','♃',Planet.Jupiter],
  ['saturn','Saturn','♄',Planet.Saturn],
  ['uranus','Uranus','♅',Planet.Uranus],
  ['neptune','Neptune','♆',Planet.Neptune],
  ['pluto','Pluto','♇',Planet.Pluto],
  ['rahu','Rahu','☊',LunarPoint.MeanNode]
];

const OWN_SIGNS = {
  sun:['Leo'], moon:['Cancer'], mercury:['Gemini','Virgo'], venus:['Taurus','Libra'],
  mars:['Aries','Scorpio'], jupiter:['Sagittarius','Pisces'], saturn:['Capricorn','Aquarius']
};
const EXALTATION = {sun:'Aries',moon:'Taurus',mercury:'Virgo',venus:'Pisces',mars:'Capricorn',jupiter:'Cancer',saturn:'Libra'};
const DEBILITATION = {sun:'Libra',moon:'Scorpio',mercury:'Pisces',venus:'Virgo',mars:'Cancer',jupiter:'Capricorn',saturn:'Aries'};

const norm = n => ((n % 360)+360)%360;
const toRad = d => d*Math.PI/180;
const toDeg = r => r*180/Math.PI;

let swePromise = null;
async function getSwe() {
  if (!swePromise) {
    swePromise = (async()=>{
      const swe = new SwissEphemeris();
      await swe.init();
      // Use the package's built-in Moshier ephemeris for immediate, reliable startup.
      // Optional Swiss ephemeris files are intentionally not fetched during app boot,
      // because a CDN delay/failure would otherwise prevent the compass from rendering.
      swe.setSiderealMode(SiderealMode.Lahiri);
      return swe;
    })();
  }
  return swePromise;
}

export function getSignData(lon) {
  lon = norm(lon);
  const signIndex = Math.floor(lon/30);
  const within = lon%30;
  const degree = Math.floor(within);
  const minute = Math.floor((within-degree)*60);
  return {
    signIndex,
    sign:ZODIAC_SIGNS[signIndex],
    zodiacGlyph:ZODIAC_GLYPHS[signIndex],
    degreeDecimal:within,
    degree,
    minute,
    label:`${ZODIAC_SIGNS[signIndex]} ${degree}°${String(minute).padStart(2,'0')}′`
  };
}

export function getNakshatra(lon) {
  const step = 360/27;
  lon = norm(lon);
  const index = Math.floor(lon/step);
  const inside = lon-index*step;
  return {
    index,
    name:NAKSHATRAS[index],
    pada:Math.floor(inside/(step/4))+1,
    degreeInNakshatra:inside
  };
}

function getCondition(id, sign) {
  if (EXALTATION[id]===sign) return {label:'Exalted',strength:3};
  if (DEBILITATION[id]===sign) return {label:'Debilitated',strength:-3};
  if (OWN_SIGNS[id]?.includes(sign)) return {label:'Own sign',strength:2};
  if (id==='rahu'||id==='ketu') return {label:'Node',strength:0};
  if (['uranus','neptune','pluto'].includes(id)) return {label:'Outer planet',strength:0};
  return {label:'Neutral',strength:0};
}

export async function computeChart(date, lat, lng) {
  const swe = await getSwe();
  const jd = swe.dateToJulianDay(date);
  const ayanamsa = swe.getAyanamsa(jd);

  // Use Swiss Ephemeris for the true astronomical angles, then convert all
  // ecliptic longitudes into Lahiri sidereal coordinates consistently.
  const tropicalHouses = swe.calculateHouses(jd, Number(lat), Number(lng), HouseSystem.Equal);
  const siderealAsc = norm(tropicalHouses.ascendant - ayanamsa);
  const siderealMC = norm(tropicalHouses.mc - ayanamsa);

  const planets = [];
  for (const [id,name,glyph,body] of PLANET_META) {
    const pos = swe.calculatePosition(jd, body);
    const siderealLon = norm(pos.longitude - ayanamsa);
    const sd = getSignData(siderealLon);
    planets.push({
      id,name,glyph,
      tropicalLon:pos.longitude,
      tropicalLat:pos.latitude,
      siderealLon,
      longitudeSpeed:pos.longitudeSpeed,
      retrograde:Number(pos.longitudeSpeed)<0,
      ...sd,
      degree:sd.degreeDecimal.toFixed(2),
      nakshatra:getNakshatra(siderealLon),
      house:Math.floor(norm(siderealLon-siderealAsc)/30)+1,
      condition:getCondition(id,sd.sign)
    });
  }

  const rahu = planets.find(p=>p.id==='rahu');
  if (rahu) {
    const ketuLon = norm(rahu.siderealLon+180);
    const sd = getSignData(ketuLon);
    planets.push({
      id:'ketu',name:'Ketu',glyph:'☋',
      tropicalLon:norm(rahu.tropicalLon+180),
      siderealLon:ketuLon,
      longitudeSpeed:rahu.longitudeSpeed,
      retrograde:true,
      ...sd,
      degree:sd.degreeDecimal.toFixed(2),
      nakshatra:getNakshatra(ketuLon),
      house:Math.floor(norm(ketuLon-siderealAsc)/30)+1,
      condition:{label:'Node',strength:0}
    });
  }

  return {
    date,
    jd,
    ayanamsa,
    tropicalAsc:tropicalHouses.ascendant,
    tropicalMC:tropicalHouses.mc,
    asc:siderealAsc,
    mc:siderealMC,
    houseCusps:Array.from({length:12},(_,i)=>norm(siderealAsc+i*30)),
    planets
  };
}

export async function computeNatalChart(birthDate,birthTime,birthLat,birthLng,birthUtcOffset='') {
  const d = buildBirthDate(birthDate,birthTime,birthUtcOffset);
  return computeChart(d,Number(birthLat)||0,Number(birthLng)||0);
}

export function buildBirthDate(birthDate,birthTime='12:00',birthUtcOffset='') {
  const offset = /^[-+]\d{2}:\d{2}$/.test(String(birthUtcOffset||'')) ? birthUtcOffset : '';
  return new Date(`${birthDate}T${birthTime||'12:00'}:00${offset}`);
}

export function calculateHouseLords(natalPlanets,natalAsc) {
  if (!natalPlanets?.length || natalAsc==null) return [];
  return Array.from({length:12},(_,i)=>{
    const house=i+1;
    const cusp=norm(natalAsc+i*30);
    const sign=ZODIAC_SIGNS[Math.floor(cusp/30)];
    const lordId=SIGN_LORDS[sign];
    const lord=natalPlanets.find(p=>p.id===lordId);
    const m=HOUSE_MEANINGS[house];
    return {
      house,cusp,sign,lordId,
      lordName:lord?.name||lordId,
      lordGlyph:lord?.glyph||'',
      lordHouse:lord?.house??null,
      lordSign:lord?.sign??null,
      lordDegree:lord?.degree??null,
      lordNakshatra:lord?.nakshatra??null,
      lordCondition:lord?.condition??null,
      purpose:m.purpose,houseName:m.name,topics:m.topics
    };
  });
}



export function calculateTransitNatalAspects(transitPlanets=[],natalPlanets=[],definitions=ASPECT_DEFINITIONS){
  const result=[];
  for(const t of transitPlanets.filter(p=>Number.isFinite(p.siderealLon))){
    for(const n of natalPlanets.filter(p=>Number.isFinite(p.siderealLon))){
      const separation=Math.abs(((t.siderealLon-n.siderealLon+540)%360)-180);
      let best=null;
      for(const def of definitions){
        const delta=Math.abs(separation-def.angle);
        if(delta<=def.orb && (!best || delta<best.orbDelta)) best={...def,orbDelta:delta};
      }
      if(best) result.push({
        type:best.type, angle:best.angle, orb:Number(best.orbDelta.toFixed(2)),
        transitId:t.id, transitName:t.name, natalId:n.id, natalName:n.name
      });
    }
  }
  return result;
}

export function calculateTransitHouseAspects(transitPlanets=[],houseCusps=[],definitions=ASPECT_DEFINITIONS){
  const result=[];
  transitPlanets.filter(p=>Number.isFinite(p.siderealLon)).forEach(t=>{
    houseCusps.forEach((cusp,i)=>{
      const separation=Math.abs(((t.siderealLon-cusp+540)%360)-180);
      let best=null;
      for(const def of definitions){
        const delta=Math.abs(separation-def.angle);
        if(delta<=Math.min(def.orb,4) && (!best || delta<best.orbDelta)) best={...def,orbDelta:delta};
      }
      if(best) result.push({type:best.type,angle:best.angle,orb:Number(best.orbDelta.toFixed(2)),transitId:t.id,transitName:t.name,house:i+1,cusp});
    });
  });
  return result;
}


export function geographicHouseFromBearing(bearing) {
  if (!Number.isFinite(Number(bearing))) return null;
  // Geographic house wheel uses the same cusp convention as the displayed wheel: East begins H1, South begins H4, West begins H7, North begins H10.
  return Math.floor(norm(Number(bearing) - 90) / 30) + 1;
}

export function geographicNakshatraFromBearing(bearing) {
  if (!Number.isFinite(Number(bearing))) return null;
  const step = 360 / 27;
  // Ashwini is centered on geographic North; the remaining 26 sectors proceed clockwise.
  const index = Math.floor(norm(Number(bearing) + step / 2) / step) % 27;
  return { index, name: NAKSHATRAS[index], colorIndex: index };
}

export function destinationZoneFromBearing(chart,bearing){
  if(!chart || !Number.isFinite(bearing)) return null;
  const longitude=norm(chart.asc + bearing - 90);
  const house=Math.floor(norm(longitude-chart.asc)/30)+1;
  const signData=getSignData(longitude);
  return {longitude,house,...signData,nakshatra:getNakshatra(longitude)};
}

export function getHousesRuledByPlanet(houseLords,planetId) {
  return (houseLords||[]).filter(h=>h.lordId===planetId);
}

export function bearingBetween(a,b) {
  if(!a||!b)return null;
  const p1=toRad(a.lat),p2=toRad(b.lat),dl=toRad(b.lng-a.lng);
  const y=Math.sin(dl)*Math.cos(p2);
  const x=Math.cos(p1)*Math.sin(p2)-Math.sin(p1)*Math.cos(p2)*Math.cos(dl);
  return norm(toDeg(Math.atan2(y,x)));
}

export function distanceKmBetween(a,b) {
  if(!a||!b)return null;
  const R=6371.0088;
  const dLat=toRad(b.lat-a.lat),dLon=toRad(b.lng-a.lng);
  const p1=toRad(a.lat),p2=toRad(b.lat);
  const h=Math.sin(dLat/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(h));
}

export function getCardinalDirection(azimuth) {
  const dirs=['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(norm(azimuth)/22.5)%16];
}

export function formatDistance(km,unit='mi') {
  if(km==null)return '—';
  if(unit==='ft')return `${Math.round(km*3280.8399).toLocaleString()} ft`;
  if(unit==='yd')return `${Math.round(km*1093.6133).toLocaleString()} yd`;
  if(unit==='m')return `${Math.round(km*1000).toLocaleString()} m`;
  if(unit==='km')return `${km<10?km.toFixed(2):km.toFixed(1)} km`;
  const mi=km*.621371;
  return `${mi<10?mi.toFixed(2):mi.toFixed(1)} mi`;
}

export function destinationPoint(origin,bearing,distanceKm) {
  const R=6371.0088,d=distanceKm/R,br=toRad(bearing);
  const p1=toRad(origin.lat),l1=toRad(origin.lng);
  const p2=Math.asin(Math.sin(p1)*Math.cos(d)+Math.cos(p1)*Math.sin(d)*Math.cos(br));
  const l2=l1+Math.atan2(Math.sin(br)*Math.sin(d)*Math.cos(p1),Math.cos(d)-Math.sin(p1)*Math.sin(p2));
  return {lat:toDeg(p2),lng:((toDeg(l2)+540)%360)-180};
}

export function buildJourneyReading({origin,destination,transitPlanets,natalPlanets,houseLords,selectedDate}) {
  if(!origin||!destination||!transitPlanets?.length)return null;
  const bearing=bearingBetween(origin,destination);
  const km=distanceKmBetween(origin,destination);

  // Destination is the mission DSC marker visually. Planet/house placements remain astronomical.
  const byHouse=[...(transitPlanets||[])].sort((a,b)=>a.house-b.house);
  const primary=byHouse.find(p=>p.house===7) || byHouse[0];
  const natalLord=houseLords?.find(h=>h.house===primary?.house);

  let summary=`The mission route runs ${bearing.toFixed(0)}° ${getCardinalDirection(bearing)} for about ${formatDistance(km,'mi')}. `;
  summary+=`On the mission wheel, the user begins at ASC and the destination is marked opposite as the mission DSC. `;
  if(primary){
    summary+=`${primary.name} is astronomically in sidereal ${primary.sign} ${primary.degree}° in House ${primary.house}; that house placement is not changed by the destination marker. `;
    if(natalLord) summary+=`Natal House ${primary.house} is ruled by ${natalLord.lordName}, placed in natal House ${natalLord.lordHouse}.`;
  }
  return {bearing,direction:getCardinalDirection(bearing),distanceKm:km,summary,activations:[]};
}


export function angularDistance(a,b){
  return Math.abs(((Number(a)-Number(b)+540)%360)-180);
}

export function relocationAngularity(natalChart, relocatedChart, orb=5){
  if(!natalChart?.planets?.length||!relocatedChart)return[];
  const tropicalAngles=[
    {key:'ASC',longitude:relocatedChart.tropicalAsc},
    {key:'DSC',longitude:norm(Number(relocatedChart.tropicalAsc)+180)},
    {key:'MC',longitude:relocatedChart.tropicalMC},
    {key:'IC',longitude:norm(Number(relocatedChart.tropicalMC)+180)}
  ];
  const siderealAngles=[
    {key:'ASC',longitude:relocatedChart.asc},
    {key:'DSC',longitude:norm(Number(relocatedChart.asc)+180)},
    {key:'MC',longitude:relocatedChart.mc},
    {key:'IC',longitude:norm(Number(relocatedChart.mc)+180)}
  ];
  const hits=[];
  for(const p of natalChart.planets){
    for(const a of tropicalAngles){
      const delta=angularDistance(p.tropicalLon,a.longitude);
      if(delta<=orb)hits.push({system:'western-relocation',planetId:p.id,planetName:p.name,glyph:p.glyph,angle:a.key,orb:Number(delta.toFixed(2))});
    }
    for(const a of siderealAngles){
      const delta=angularDistance(p.siderealLon,a.longitude);
      if(delta<=orb)hits.push({system:'sidereal-relocation',planetId:p.id,planetName:p.name,glyph:p.glyph,angle:a.key,orb:Number(delta.toFixed(2))});
    }
  }
  return hits.sort((a,b)=>a.orb-b.orb);
}

function gmstDegrees(jd){
  const T=(jd-2451545.0)/36525;
  return norm(280.46061837+360.98564736629*(jd-2451545.0)+0.000387933*T*T-(T*T*T)/38710000);
}

export function calculateLocalSpaceDirections(chart,date,lat,lng){
  if(!chart?.planets?.length||!Number.isFinite(Number(lat))||!Number.isFinite(Number(lng)))return[];
  const jd=Number(chart.jd)||((new Date(date).getTime()/86400000)+2440587.5);
  const T=(jd-2451545)/36525;
  const epsilon=toRad(23.43929111-0.0130041667*T-0.0000001639*T*T+0.0000005036*T*T*T);
  const phi=toRad(Number(lat));
  const lst=norm(gmstDegrees(jd)+Number(lng));
  return chart.planets.map(p=>{
    const lambda=toRad(Number(p.tropicalLon));
    const beta=toRad(Number(p.tropicalLat)||0);
    const dec=Math.asin(Math.sin(beta)*Math.cos(epsilon)+Math.cos(beta)*Math.sin(epsilon)*Math.sin(lambda));
    const ra=norm(toDeg(Math.atan2(Math.sin(lambda)*Math.cos(epsilon)-Math.tan(beta)*Math.sin(epsilon),Math.cos(lambda))));
    const H=toRad(norm(lst-ra));
    const altitude=Math.asin(Math.sin(phi)*Math.sin(dec)+Math.cos(phi)*Math.cos(dec)*Math.cos(H));
    const az=norm(toDeg(Math.atan2(Math.sin(H),Math.cos(H)*Math.sin(phi)-Math.tan(dec)*Math.cos(phi)))+180);
    return {planetId:p.id,planetName:p.name,glyph:p.glyph,azimuth:az,altitude:toDeg(altitude)};
  });
}

export function localSpaceRouteContacts(localSpace=[],routeBearing,orb=12){
  if(!Number.isFinite(Number(routeBearing)))return[];
  const out=[];
  for(const p of localSpace){
    const direct=angularDistance(p.azimuth,routeBearing);
    const opposite=angularDistance(norm(p.azimuth+180),routeBearing);
    const delta=Math.min(direct,opposite);
    if(delta<=orb)out.push({...p,routeOrb:Number(delta.toFixed(2)),arm:direct<=opposite?'forward':'opposite'});
  }
  return out.sort((a,b)=>a.routeOrb-b.routeOrb);
}
