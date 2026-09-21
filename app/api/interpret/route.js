import { FALLBACK_VOCABULARY } from '../../../src/server/vocabulary.js';

const PRIORITY_LORD_HOUSES=[1,3,7,9];
const HOUSE_THEMES={
  1:['self','body','identity','personal initiative'],2:['money','speech','family resources','possessions'],3:['communication','local travel','errands','siblings','skills'],4:['home','property','family','emotional foundation'],5:['creativity','children','romance','study'],6:['work','service','health routines','obstacles'],7:['other people','partners','clients','contracts','open opponents'],8:['shared resources','secrets','sudden change','transformation'],9:['long journeys','guidance','teachers','belief','higher learning'],10:['career','status','authority','public responsibilities'],11:['friends','networks','income','goals'],12:['foreign settings','retreat','expenses','solitude','release']
};
const KARAKA={
  sun:{people:['authority figure','leader','official'],events:['recognition','leadership decision','visibility'],positive:['clear direction','confidence','recognition'],negative:['ego conflict','pressure from authority']},
  moon:{people:['family member','caretaker','member of the public'],events:['change of mood','family matter','public interaction'],positive:['emotional connection','supportive care','adaptive response'],negative:['emotional reactivity','uncertainty','rapidly changing conditions']},
  mercury:{people:['driver','messenger','student','merchant','analyst'],events:['message','conversation','transaction','short trip','document exchange'],positive:['useful information','successful negotiation','efficient travel'],negative:['mixed messages','wrong turn','paperwork or device problem']},
  venus:{people:['partner','artist','social contact','diplomatic person'],events:['social encounter','agreement','attraction','purchase'],positive:['pleasant meeting','cooperation','harmonious agreement'],negative:['social distraction','awkward attraction','overspending']},
  mars:{people:['competitor','mechanic','athlete','assertive person'],events:['competition','argument','physical effort','repair','rapid action'],positive:['decisive action','successful repair','courage'],negative:['argument','impatience','mechanical problem','reckless action']},
  jupiter:{people:['teacher','mentor','advisor','benefactor'],events:['guidance','learning','opportunity','expansion'],positive:['helpful advice','fortunate introduction','learning opportunity'],negative:['overconfidence','excess','poor judgment through optimism']},
  saturn:{people:['elder','manager','worker','official','technician'],events:['delay','duty','restriction','repair','administrative requirement'],positive:['disciplined progress','reliable assistance','completion through patience'],negative:['delay','fatigue','bureaucratic obstacle','cold encounter']},
  uranus:{people:['innovator','outsider','technologist'],events:['surprise','disruption','technical change','sudden redirection'],positive:['breakthrough','unexpected solution'],negative:['instability','technology failure','abrupt change']},
  neptune:{people:['artist','healer','spiritual person','elusive person'],events:['inspiration','misdirection','unclear situation'],positive:['compassion','creative insight'],negative:['confusion','unclear boundaries','loss of direction']},
  pluto:{people:['investigator','powerful person','intense personality'],events:['hidden issue surfaces','power struggle','deep change'],positive:['important discovery','decisive transformation'],negative:['control struggle','obsession','hidden complication']},
  rahu:{people:['outsider','foreign contact','unusual person'],events:['novel encounter','amplification','unexpected desire'],positive:['new opportunity','unusual connection'],negative:['obsession','exaggeration','misjudgment from novelty']},
  ketu:{people:['specialist','solitary person','detached contact'],events:['separation','completion','withdrawal'],positive:['clean ending','precision','insight through detachment'],negative:['disconnection','abrupt ending','lack of engagement']}
};
const ASPECT_EFFECT={
  Conjunction:{tone:0,label:'concentrates'},Sextile:{tone:.7,label:'opens an opportunity in'},Square:{tone:-.8,label:'creates pressure in'},Trine:{tone:.8,label:'supports'},Quincunx:{tone:-.45,label:'requires adjustment in'},Opposition:{tone:-.65,label:'externalizes or polarizes'}
};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const uniq=a=>[...new Set((a||[]).filter(Boolean))];
const join=(a)=>{const x=uniq(a);if(!x.length)return'';if(x.length===1)return x[0];if(x.length===2)return `${x[0]} and ${x[1]}`;return `${x.slice(0,-1).join(', ')}, and ${x[x.length-1]}`};
function entries(v){return Array.isArray(v)?v.map(x=>typeof x==='string'?{term:x,weight:.5}:x).filter(x=>x&&x.term):[]}
function vocabulary(custom={}){const out={};for(const id of new Set([...Object.keys(FALLBACK_VOCABULARY),...Object.keys(custom||{})])){out[id]={};for(const key of ['people','events','qualities','places','objects']){const c=entries(custom?.[id]?.[key]);out[id][key]=c.length?c:entries(FALLBACK_VOCABULARY?.[id]?.[key])}}return out}
function vocabTerms(bank,key,count=3){return entries(bank?.[key]).sort((a,b)=>(Number(b.weight)||0)-(Number(a.weight)||0)).slice(0,count).map(x=>x.term)}
function aspectScore(a){const eff=ASPECT_EFFECT[a?.type]||{tone:0};const tight=1-Math.min(Number(a?.orb)||6,6)/6;return eff.tone*(.65+.35*tight)}
function contextForHouse(body,h){return (body.natalHouseContexts||[]).find(x=>Number(x.house)===Number(h))||null}
function lordTransit(body,h){return (body.lordTransitPlacements||[]).find(x=>Number(x.house)===Number(h))||null}
function lordRow(body,h){return (body.houseLords||[]).find(x=>Number(x.house)===Number(h))||null}
function describeHouseContext(body,h){
  const ctx=contextForHouse(body,h),lord=lordRow(body,h),lt=lordTransit(body,h);
  if(!ctx)return `natal House ${h}`;
  const occupants=ctx.occupants?.length?` containing ${ctx.occupants.map(p=>p.name).join(', ')}`:'';
  const lordText=lord?`, ruled by ${lord.lordName}${lt?.transit?` now transiting House ${lt.transit.house} in ${lt.transit.sign} (${lt.transit.nakshatra||'—'})`:''}`:'';
  return `natal House ${h} cusp in ${ctx.sign}, ${ctx.nakshatra} pada ${ctx.pada}${occupants}${lordText}`;
}
function priorityEvidence(body){
  const evidence=[];
  for(const h of PRIORITY_LORD_HOUSES){
    const row=lordRow(body,h);if(!row)continue;
    const placement=lordTransit(body,h)?.transit||null;
    const incoming=(body.transitNatalAspects||[]).filter(a=>a.natalId===row.lordId).sort((a,b)=>a.orb-b.orb);
    const outgoing=(body.transitNatalAspects||[]).filter(a=>a.transitId===row.lordId).sort((a,b)=>a.orb-b.orb);
    const houseHits=(body.natalHouseAspects||[]).filter(a=>a.transitId===row.lordId).sort((a,b)=>a.orb-b.orb);
    evidence.push({house:h,row,placement,incoming,outgoing,houseHits});
  }
  return evidence;
}
function routeEvidence(body){
  const route=body.routeContext||{},hits=body.routePointAspects||[];
  return {start:route.start||null,end:route.end||body.destinationZone||null,houses:route.houseSequence||[],nakshatras:route.nakshatraSequence||[],gandanta:route.gandanta||[],hits};
}

function planetForecast(p,body,vocab){
  const bank=vocab[p.id]||{},karaka=KARAKA[p.id]||KARAKA.mercury;
  const natal=(body.transitNatalAspects||[]).filter(a=>a.transitId===p.id).sort((a,b)=>a.orb-b.orb);
  const houses=(body.natalHouseAspects||[]).filter(a=>a.transitId===p.id).sort((a,b)=>a.orb-b.orb);
  const route=(body.routePointAspects||[]).filter(a=>a.transitId===p.id).sort((a,b)=>a.orb-b.orb);
  const ruled=(body.houseLords||[]).filter(h=>h.lordId===p.id);
  const priorityLordHits=natal.filter(a=>PRIORITY_LORD_HOUSES.some(h=>lordRow(body,h)?.lordId===a.natalId));
  const mainHouse=houses[0]?.house||p.house;
  const themes=HOUSE_THEMES[mainHouse]||[];
  let score=Number(p.conditionStrength||0)*.15;for(const a of [...natal.slice(0,4),...houses.slice(0,3),...route.slice(0,2)])score+=aspectScore(a);score=clamp(score,-2,2);
  const tone=score>.35?'constructive':score<-.35?'challenging':'mixed';
  const events=uniq([...vocabTerms(bank,'events',2),...karaka.events.slice(0,2),...themes.slice(0,2)]).slice(0,5);
  const people=uniq([...vocabTerms(bank,'people',2),...karaka.people.slice(0,3)]).slice(0,5);
  const triggers=[];
  houses.slice(0,3).forEach(a=>triggers.push(`${p.name} ${String(a.type).toLowerCase()} ${describeHouseContext(body,a.house)} (${a.orb.toFixed(2)}° orb)`));
  natal.slice(0,3).forEach(a=>{const np=(body.natalPlanets||[]).find(x=>x.id===a.natalId);triggers.push(`${p.name} ${String(a.type).toLowerCase()} natal ${a.natalName}${np?` in House ${np.house}, ${np.sign}, ${np.nakshatra}`:''} (${a.orb.toFixed(2)}° orb)`)});
  priorityLordHits.slice(0,2).forEach(a=>{const h=PRIORITY_LORD_HOUSES.find(x=>lordRow(body,x)?.lordId===a.natalId);if(h)triggers.push(`This directly activates the natal House ${h} lord, a priority route indicator.`)});
  ruled.forEach(r=>{const lt=lordTransit(body,r.house)?.transit;if(lt)triggers.push(`${p.name} rules natal House ${r.house} and is currently in transit House ${lt.house}, ${lt.sign}, ${lt.nakshatra}.`)});
  route.slice(0,2).forEach(a=>triggers.push(`${p.name} ${String(a.type).toLowerCase()} the ${a.pointLabel} in House ${a.pointHouse}, ${a.pointSign}, ${a.pointNakshatra} (${a.orb.toFixed(2)}° orb)`));
  return {
    planet:p.id,score:Number(score.toFixed(2)),tone,
    headline:`${p.name} in transit House ${p.house}, ${p.sign} ${Number(p.degree).toFixed(1)}° (${p.nakshatra}, pada ${p.pada}) is ${tone==='constructive'?'supporting':tone==='challenging'?'pressurizing':'mixing'} ${join(themes.slice(0,3))||'journey conditions'}.`,
    eventText:`Possible manifestations include ${join(events)}.`,
    peopleText:`People or roles emphasized include ${join(people)}.`,
    positiveText:`Constructively, watch for ${join(karaka.positive.slice(0,3))}.`,
    challengingText:`Under strain, watch for ${join(karaka.negative.slice(0,3))}.`,
    destinationText:route.some(x=>x.pointKey==='destination')?`${p.name} directly aspects the destination field, so its symbolism receives extra weight near arrival.`:`${p.name} has no tight direct aspect to the destination field in the current aspect set.`,
    triggers,themes
  };
}

function houseForecast(h,body,vocab){
  const ctx=contextForHouse(body,h),lord=lordRow(body,h),lt=lordTransit(body,h)?.transit;
  const hits=(body.natalHouseAspects||[]).filter(a=>Number(a.house)===h).sort((a,b)=>a.orb-b.orb);
  const lordHits=lord?(body.transitNatalAspects||[]).filter(a=>a.natalId===lord.lordId).sort((a,b)=>a.orb-b.orb):[];
  const occupants=ctx?.occupants||[],topics=HOUSE_THEMES[h]||[];
  let score=0;for(const a of [...hits.slice(0,3),...lordHits.slice(0,2)])score+=aspectScore(a);if(Number(body.destinationZone?.house)===h)score+=.3;score=clamp(score,-1.5,1.5);
  const tone=score>.3?'constructive':score<-.3?'challenging':'mixed';
  const people=uniq(occupants.flatMap(p=>(KARAKA[p.id]?.people||[]).slice(0,2)));if(lord)people.push(`${lord.lordName}-type person`);
  const triggers=[describeHouseContext(body,h)];
  hits.slice(0,3).forEach(a=>triggers.push(`${a.transitName} ${String(a.type).toLowerCase()} the House ${h} cusp (${a.orb.toFixed(2)}°)`));
  lordHits.slice(0,2).forEach(a=>triggers.push(`${a.transitName} ${String(a.type).toLowerCase()} natal House ${h} lord ${lord.lordName} (${a.orb.toFixed(2)}°)`));
  if(lt)triggers.push(`${lord?.lordName} is currently placed in transit House ${lt.house}, ${lt.sign}, ${lt.nakshatra}.`);
  return {house:h,tone,score:Number(score.toFixed(2)),themes:topics,
    headline:`House ${h} (${ctx?.sign||'—'}, ${ctx?.nakshatra||'—'}) is ${tone==='constructive'?'supportively':tone==='challenging'?'stressfully':'mixedly'} activated around ${join(topics.slice(0,4))}.`,
    eventText:`The route may bring developments involving ${join(topics.slice(0,4))}.`,peopleText:`People emphasized here include ${join(people)||'people connected with these house topics'}.`,
    positiveText:`Constructive expression favors deliberate progress in ${join(topics.slice(0,3))}.`,challengingText:`Challenging expression can show as friction, delay, or adjustment in ${join(topics.slice(0,3))}.`,
    destinationText:Number(body.destinationZone?.house)===h?'This is the current destination-bearing house, so it receives extra arrival weight.':'This house is active but is not the primary destination-bearing house.',triggers};
}

function moonForecast(body){
  const t=body.transitMoon,n=body.natalMoon,route=routeEvidence(body);if(!t||!n)return null;
  const moonAspect=(body.moonNatalAspects||[])[0]||null;
  const lordHits=(body.transitNatalAspects||[]).filter(a=>a.transitId==='moon'&&PRIORITY_LORD_HOUSES.some(h=>lordRow(body,h)?.lordId===a.natalId)).sort((a,b)=>a.orb-b.orb);
  const locationHits=(body.routePointAspects||[]).filter(a=>a.transitId==='moon').sort((a,b)=>a.orb-b.orb);
  const natalTheme=HOUSE_THEMES[n.house]||[],transitTheme=HOUSE_THEMES[t.house]||[];
  const mindset=[];
  mindset.push(`Natal Moon is in House ${n.house}, ${n.sign}, ${n.nakshatra}; the transiting Moon is in House ${t.house}, ${t.sign}, ${t.nakshatra} pada ${t.pada}.`);
  if(moonAspect)mindset.push(`The transiting Moon ${String(moonAspect.type).toLowerCase()} the natal Moon at ${moonAspect.orb.toFixed(2)}° orb, linking the immediate mood to the natal emotional pattern.`);
  if(lordHits.length)mindset.push(`The Moon is also contacting ${lordHits.slice(0,3).map(a=>{const h=PRIORITY_LORD_HOUSES.find(x=>lordRow(body,x)?.lordId===a.natalId);return `the House ${h} lord by ${String(a.type).toLowerCase()}`}).join(', ')}.`);
  const selfText=`Mindset and actions are pulled between natal themes of ${join(natalTheme.slice(0,3))} and immediate transit themes of ${join(transitTheme.slice(0,3))}. ${moonAspect?(ASPECT_EFFECT[moonAspect.type]?.tone<0?'Expect stronger reactivity or a need to consciously regulate responses.':'The Moon contact can make the internal state easier to recognize and act through.'):'Without a tight Moon-to-Moon aspect, the transit house and nakshatra carry more of the immediate emphasis.'}`;
  const current=route.start,dest=route.end;
  const encounter=[];
  if(current)encounter.push(`At the current location the route field begins in House ${current.house}, ${current.sign}, ${current.nakshatra}.`);
  if(dest)encounter.push(`The destination field is House ${dest.house}, ${dest.sign}, ${typeof dest.nakshatra==='string'?dest.nakshatra:dest.nakshatra?.name||'—'}.`);
  if(locationHits.length)encounter.push(`The transiting Moon directly aspects ${locationHits.slice(0,2).map(x=>`${x.pointLabel} by ${String(x.type).toLowerCase()} (${x.orb.toFixed(2)}°)`).join(' and ')}.`);
  return {headline:'Moon state · mindset, reactions, and arrival encounters',mindset:selfText,routeText:encounter.join(' '),triggers:mindset.concat(encounter)};
}

function synthesis(body){
  const priority=priorityEvidence(body),route=routeEvidence(body),moon=moonForecast(body);
  const self=[],journey=[],encounters=[];
  for(const e of priority){
    const placement=e.placement;
    const incoming=e.incoming.slice(0,2),outgoing=e.outgoing.slice(0,2),houseHits=e.houseHits.slice(0,2);
    const placementText=placement?`${e.row.lordName} is currently in transit House ${placement.house}, ${placement.sign}, ${placement.nakshatra}`:`${e.row.lordName} current transit placement is unavailable`;
    const contacts=uniq([...incoming.map(a=>`${a.transitName} ${String(a.type).toLowerCase()} natal ${e.row.lordName}`),...outgoing.map(a=>`${e.row.lordName} ${String(a.type).toLowerCase()} natal ${a.natalName}`),...houseHits.map(a=>`${e.row.lordName} ${String(a.type).toLowerCase()} natal House ${a.house}`)]).slice(0,4);
    const text=`House ${e.house} lord: ${placementText}${contacts.length?`; active contacts: ${contacts.join(', ')}`:''}.`;
    if(e.house===1)self.push(text);if(e.house===3||e.house===9)journey.push(text);if(e.house===7)encounters.push(text);
  }
  if(route.houses.length)journey.push(`The selected route moves through geographic Houses ${route.houses.join(' → ')}.`);
  if(route.nakshatras.length)journey.push(`Its nakshatra sequence is ${route.nakshatras.join(' → ')}.`);
  if(route.gandanta.length)journey.push(`The route crosses ${route.gandanta.map(x=>x.label).join(', ')}.`);
  const destHits=route.hits.filter(x=>x.pointKey==='destination').slice(0,5);if(destHits.length)encounters.push(`At arrival, the strongest direct planetary contacts to the destination field are ${destHits.map(x=>`${x.transitName} ${String(x.type).toLowerCase()} (${x.orb.toFixed(2)}°)`).join(', ')}.`);
  if(moon){self.push(moon.mindset);encounters.push(moon.routeText)}
  return {self:self.join(' '),journey:journey.join(' '),encounters:encounters.join(' '),moon};
}

function summary(body,planetPredictions,syn){
  const route=routeEvidence(body),top=Object.values(planetPredictions).sort((a,b)=>Math.abs(b.score)-Math.abs(a.score)).slice(0,3);
  const dest=route.end||body.destinationZone||{};
  return `Route prediction: ${syn.journey||'Route geometry is available, but no tight priority-lord contacts are present.'} Self and mindset: ${syn.self||'No unusually tight self indicators are present.'} Encounters: ${syn.encounters||'No unusually tight encounter indicators are present.'} The destination field is House ${dest.house||'—'}, ${dest.sign||'—'}, ${typeof dest.nakshatra==='string'?dest.nakshatra:dest.nakshatra?.name||'—'}. Strongest transit themes: ${top.map(x=>x.headline).join(' ')} These are astrological possibilities to observe, not guaranteed events.`;
}

export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(request){
  try{
    const body=await request.json(),planets=Array.isArray(body.planets)?body.planets:[];
    if(!planets.length)return Response.json({error:'No planetary data supplied'},{status:400});
    const vocab=vocabulary(body.customVocabulary||{}),planetPredictions={},housePredictions={};
    for(const p of planets)planetPredictions[p.id]=planetForecast(p,body,vocab);
    for(let h=1;h<=12;h++)housePredictions[h]=houseForecast(h,body,vocab);
    const routeSynthesis=synthesis(body);
    const natalUsage={
      natalAsc:Number(body.natalAsc),natalPlanetCount:body.natalPlanets?.length||0,natalHouseCount:body.natalHouseContexts?.length||0,houseLordCount:body.houseLords?.length||0,
      transitNatalAspectCount:body.transitNatalAspects?.length||0,transitNatalHouseAspectCount:body.natalHouseAspects?.length||0,routePointAspectCount:body.routePointAspects?.length||0,
      priorityLordCount:priorityEvidence(body).length,verified:Boolean(Number.isFinite(Number(body.natalAsc))&&body.natalPlanets?.length>=9&&body.natalHouseContexts?.length===12)
    };
    return Response.json({summary:summary(body,planetPredictions,routeSynthesis),planetPredictions,housePredictions,moonForecast:routeSynthesis.moon,routeSynthesis,natalUsage,destinationZone:body.destinationZone||{},modelVersion:'route-synthesis-1-3-7-9-moon-houses-nakshatras'});
  }catch(e){console.error('Interpretation failed',e);return Response.json({error:'Interpretation failed',detail:String(e?.message||e)},{status:500})}
}
