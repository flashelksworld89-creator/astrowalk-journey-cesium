import { FALLBACK_VOCABULARY } from '../../../src/server/vocabulary.js';

const VALID_CATEGORIES=['people','events','qualities','places','objects'];
const HOUSE_THEMES={
  1:['identity','body','appearance','personal initiative'],2:['money','speech','family resources','possessions'],3:['messages','siblings','skills','short travel'],4:['home','property','mother/family','private life'],5:['children','romance','creativity','study'],6:['work','service','health routines','debts','conflict'],7:['partners','clients','agreements','open opponents'],8:['shared money','secrets','inheritance','sudden change'],9:['teachers','belief','higher learning','long travel'],10:['career','status','authority','public responsibilities'],11:['friends','networks','income','goals'],12:['retreat','expenses','foreign settings','seclusion','release']
};
const KARAKA={
  sun:{people:['authority figure','manager','father or paternal figure','official','leader'],events:['recognition','leadership decision','visibility','contact with authority'],positive:['recognition','clear direction','confidence','support from an influential person'],negative:['ego conflict','pressure from authority','overexposure','pride-driven disagreement']},
  moon:{people:['mother or maternal figure','caretaker','member of the public','family member'],events:['family matter','change of mood','public interaction','food/home concern'],positive:['supportive care','help from family','emotional connection','useful public response'],negative:['emotional reactivity','uncertainty','family tension','rapidly changing conditions']},
  mercury:{people:['student','writer','merchant','driver','messenger','analyst'],events:['message','conversation','transaction','short trip','document exchange'],positive:['useful information','successful negotiation','helpful introduction','efficient travel'],negative:['mixed messages','misunderstanding','wrong turn','paperwork or device problem']},
  venus:{people:['partner','artist','designer','diplomatic person','social contact'],events:['social encounter','agreement','attraction','purchase','aesthetic experience'],positive:['pleasant meeting','cooperation','gift or benefit','harmonious agreement'],negative:['overindulgence','social distraction','awkward attraction','money spent for comfort']},
  mars:{people:['athlete','mechanic','soldier','surgeon','competitor','assertive person'],events:['competition','argument','physical effort','repair','rapid action'],positive:['decisive action','successful repair','courageous intervention','productive physical effort'],negative:['argument','impatience','minor injury risk','mechanical problem','reckless action']},
  jupiter:{people:['teacher','mentor','advisor','counselor','judge','benefactor'],events:['guidance','learning','opportunity','expansion','legal or educational matter'],positive:['helpful advice','fortunate introduction','learning opportunity','support from a mentor'],negative:['overconfidence','excess','poor judgment through optimism','promising more than can be delivered']},
  saturn:{people:['elder','manager','worker','official','technician','serious person'],events:['delay','duty','restriction','repair','administrative requirement'],positive:['disciplined progress','useful boundary','reliable assistance','completion through patience'],negative:['delay','denial','fatigue','bureaucratic obstacle','cold or difficult encounter']},
  uranus:{people:['innovator','outsider','technologist','unconventional person'],events:['surprise','disruption','technical change','sudden redirection'],positive:['breakthrough','unexpected solution','fresh connection','useful change of plan'],negative:['disruption','instability','technology failure','abrupt separation']},
  neptune:{people:['artist','healer','spiritual person','confused or elusive person'],events:['inspiration','misdirection','unclear situation','creative or spiritual encounter'],positive:['inspiration','compassion','creative insight','meaningful quiet encounter'],negative:['confusion','misreading signals','loss of direction','unclear boundaries']},
  pluto:{people:['investigator','powerful person','crisis worker','intense personality'],events:['hidden issue surfaces','power struggle','deep change','intense encounter'],positive:['decisive transformation','important discovery','strong focus','release of an old pattern'],negative:['control struggle','obsession','intimidating encounter','hidden complication']},
  rahu:{people:['foreigner or outsider','ambitious person','unusual contact','technology-oriented person'],events:['novel encounter','amplification','unexpected desire','foreign or unfamiliar influence'],positive:['new opportunity','unusual connection','rapid learning','ambitious opening'],negative:['obsession','misjudgment from novelty','exaggeration','unreliable attraction']},
  ketu:{people:['specialist','solitary person','spiritual person','detached contact'],events:['separation','completion','withdrawal','specialized problem'],positive:['clean ending','precision','insight through detachment','useful simplification'],negative:['disconnection','missed engagement','abrupt ending','lack of interest or clarity']}
};
const ASPECT_EFFECT={
  Conjunction:{tone:0,text:'concentrates and intensifies'},Sextile:{tone:1,text:'opens a usable opportunity through'},Square:{tone:-1,text:'creates friction or a problem requiring action around'},Trine:{tone:1,text:'supports a relatively easy development through'},Quincunx:{tone:-.45,text:'requires adjustment, compromise or recalibration around'},Opposition:{tone:-.7,text:'brings an encounter, polarity or external pressure around'}
};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function normalizeEntries(v){if(!Array.isArray(v))return[];return v.map(x=>typeof x==='string'?{term:x,weight:.65}:x&&typeof x.term==='string'?{term:x.term.trim(),weight:clamp(Number(x.weight)||.65,0,1)}:null).filter(Boolean)}
function mergeBank(base={},custom={}){const m={};for(const c of VALID_CATEGORIES){const own=normalizeEntries(custom?.[c]);m[c]=own.length?own:normalizeEntries(base?.[c])}return m}
function readVocabulary(){let custom={};try{if(process.env.PLANET_VOCAB_JSON)custom=JSON.parse(process.env.PLANET_VOCAB_JSON)}catch{}const out={};for(const k of new Set([...Object.keys(FALLBACK_VOCABULARY),...Object.keys(custom||{})]))out[k]=mergeBank(FALLBACK_VOCABULARY[k],custom?.[k]);return out}
function seedIndex(seed,n){let h=2166136261;for(let i=0;i<seed.length;i++){h^=seed.charCodeAt(i);h=Math.imul(h,16777619)}return n?(h>>>0)%n:0}
function pick(entries,seed){const list=normalizeEntries(entries).sort((a,b)=>b.weight-a.weight).slice(0,10);return list[seedIndex(seed,list.length)]||null}
function uniq(arr){return [...new Set(arr.filter(Boolean))]}
function joinNatural(arr){const a=uniq(arr);if(a.length<=1)return a[0]||'';if(a.length===2)return `${a[0]} or ${a[1]}`;return `${a.slice(0,-1).join(', ')}, or ${a[a.length-1]}`}
function conditionTone(p){const s=Number(p.conditionStrength)||0;return s>0?.25:s<0?-.25:0}
function aspectScore(a){const eff=ASPECT_EFFECT[a?.type]||{tone:0};const tight=1-Math.min(Number(a?.orb)||6,6)/6;return eff.tone*(.65+.35*tight)}
function ruledHouses(body,planetId){return (body.houseLords||[]).filter(h=>h.lordId===planetId)}
function natalPlanetHouse(body,natalId){return (body.natalPlanets||[]).find(p=>p.id===natalId)?.house||null}
function keywordManifestations(bank,seed){return {
  event:pick(bank.events,`${seed}|event`)?.term,
  person:pick(bank.people,`${seed}|person`)?.term,
  place:pick(bank.places,`${seed}|place`)?.term,
  object:pick(bank.objects,`${seed}|object`)?.term,
  quality:pick(bank.qualities,`${seed}|quality`)?.term
}}

const HOUSE_FOCUS_DETAIL={
  1:{label:'self / body / initiative',events:['a change in your own plans or pace','a decision about how you present or assert yourself','a physical or motivational shift','a moment that puts you personally at the center of the situation'],people:['someone who directly affects your choices','a person reacting strongly to your presence or initiative']},
  3:{label:'communication / local travel / errands',events:['a message, call, or conversation that changes the route or timing','a short-distance travel change, detour, or navigation issue','an errand, document, device, or vehicle-related matter','an encounter with a sibling, neighbor, driver, courier, or local contact'],people:['a driver, messenger, sibling, neighbor, merchant, dispatcher, or local contact','someone connected with information, directions, paperwork, transport, or scheduling']},
  7:{label:'others / contracts / clients / business relationships',events:['a meeting, negotiation, agreement, or disagreement with another person','a client, partner, customer, or business interaction becoming the focus','a contract, promise, boundary, or expectation needing clarification',"an encounter that makes another person's intentions unusually important"],people:['a partner, client, customer, contractor, negotiator, competitor, or open counterpart','someone whose cooperation or opposition directly affects the outcome']}
};
const ASPECT_ACTION={
  Conjunction:'concentrates the transit directly into',
  Sextile:'opens an opportunity through',
  Square:'creates pressure, friction, or a problem requiring action in',
  Trine:'supports an easier development through',
  Quincunx:'requires adjustment or recalibration in',
  Opposition:'brings the matter through another person, polarity, or external pressure involving'
};
function houseFocusDetail(h){return HOUSE_FOCUS_DETAIL[h]||{label:joinNatural((HOUSE_THEMES[h]||[]).slice(0,4)),events:[`a concrete development involving ${joinNatural((HOUSE_THEMES[h]||[]).slice(0,2))}`],people:[`a person connected with ${joinNatural((HOUSE_THEMES[h]||[]).slice(0,2))}`]}}
function describeLordHit(hit,row,p){
  const h=Number(row.house),detail=houseFocusDetail(h),action=ASPECT_ACTION[hit.type]||'activates';
  const natalHouse=(p&&hit.natalId)?null:null;
  return `${hit.transitName} ${String(hit.type).toLowerCase()} natal ${row.lordName}, the House ${h} lord, ${action} ${detail.label} (${Number(hit.orb).toFixed(2)}° orb).`;
}
function routeContextText(body){
  const r=body.routeContext;if(!r)return '';
  const bits=[];
  if(r.start&&r.end)bits.push(`The road journey begins in House ${r.start.house}, ${r.start.sign}, ${r.start.nakshatra}, and arrives in House ${r.end.house}, ${r.end.sign}, ${r.end.nakshatra}.`);
  if(Array.isArray(r.houseSequence)&&r.houseSequence.length>1)bits.push(`It crosses Houses ${r.houseSequence.join(' → ')}.`);
  if(Array.isArray(r.nakshatraSequence)&&r.nakshatraSequence.length>1)bits.push(`Nakshatra sequence: ${r.nakshatraSequence.join(' → ')}.`);
  if(Array.isArray(r.gandanta)&&r.gandanta.length)bits.push(`Important transition: the route crosses ${r.gandanta.map(g=>g.label).join(' and ')}, so the water-to-fire gandanta boundary is emphasized.`);
  if(Array.isArray(r.streets)&&r.streets.length)bits.push(`Primary streets include ${r.streets.slice(0,5).join(', ')}.`);
  return bits.join(' ');
}
function locationContextForPlanet(body,p){
  const lines=[];
  const dest=(body.relocationDestination||[]).filter(x=>x.planetId===p.id||String(x.planetName||'').toLowerCase()===String(p.name||'').toLowerCase()).slice(0,2);
  const local=(body.localSpaceContacts||[]).filter(x=>x.planetId===p.id||String(x.planetName||'').toLowerCase()===String(p.name||'').toLowerCase()).slice(0,2);
  if(dest.length)lines.push(`${p.name} is also close to the destination ${dest.map(x=>`${x.angle} angle (${Number(x.orb).toFixed(1)}°)`).join(' and ')}, strengthening its visibility at arrival.`);
  if(local.length)lines.push(`The route runs close to ${p.name}'s natal Local Space direction (${local.map(x=>`${Number(x.routeOrb).toFixed(1)}°`).join(', ')} from the route), so this planet is geographically reinforced during movement.`);
  return lines.join(' ');
}

function planetForecast(p,body,vocab){
  const bank=vocab[p.id]||{},k=KARAKA[p.id]||{people:[],events:[],positive:[],negative:[]};
  const zone=body.destinationZone||{};
  const natalContacts=(body.transitNatalAspects||[]).filter(a=>a.transitId===p.id).sort((a,b)=>a.orb-b.orb);
  const houseContacts=(body.natalHouseAspects||[]).filter(a=>a.transitId===p.id).sort((a,b)=>a.orb-b.orb);
  const rules=ruledHouses(body,p.id);
  const focus=focusConfiguration(body);
  const focusedLordRows=(body.houseLords||[]).filter(h=>focus.lords.includes(Number(h.house)));
  const focusedLordIds=new Set(focusedLordRows.map(h=>h.lordId));
  const focusedNatalContacts=natalContacts.filter(a=>focusedLordIds.has(a.natalId));
  const focusedHouseContacts=houseContacts.filter(a=>focus.houses.includes(Number(a.house)));
  const ruledFocus=rules.filter(h=>focus.lords.includes(Number(h.house)));
  const kw=keywordManifestations(bank,`${body.date}|${p.id}`);
  let score=conditionTone(p);natalContacts.slice(0,4).forEach(a=>score+=aspectScore(a));
  const priorityBoost=Math.min(2,focusedNatalContacts.length*.65+ruledFocus.length*.7+focusedHouseContacts.length*.35);
  if(p.house===zone.house)score+=.4;if(houseContacts.some(a=>a.house===zone.house))score+=.3;score=clamp(score,-1.75,1.75);
  const tone=score>.35?'constructive':score<-.35?'challenging':'mixed';

  const focusNarratives=[];
  for(const hit of focusedNatalContacts.slice(0,4)){
    const row=focusedLordRows.find(r=>r.lordId===hit.natalId);if(row)focusNarratives.push(describeLordHit(hit,row,p));
  }
  for(const row of ruledFocus){
    const d=houseFocusDetail(Number(row.house));focusNarratives.push(`${p.name} itself rules natal House ${row.house}, so this transit directly carries ${d.label} into the journey.`);
  }
  for(const hit of focusedHouseContacts.slice(0,3)){
    const d=houseFocusDetail(Number(hit.house));focusNarratives.push(`${p.name} ${String(hit.type).toLowerCase()} the natal House ${hit.house} cusp ${ASPECT_ACTION[hit.type]||'activates'} ${d.label} (${Number(hit.orb).toFixed(2)}° orb).`);
  }

  const activatedFocusHouses=uniq([
    ...ruledFocus.map(x=>Number(x.house)),
    ...focusedNatalContacts.map(hit=>Number(focusedLordRows.find(r=>r.lordId===hit.natalId)?.house)).filter(Boolean),
    ...focusedHouseContacts.map(x=>Number(x.house))
  ]);
  const concreteEvents=uniq(activatedFocusHouses.flatMap(h=>houseFocusDetail(h).events));
  const concretePeople=uniq(activatedFocusHouses.flatMap(h=>houseFocusDetail(h).people));
  const fallbackEvents=uniq([kw.event,...k.events]);
  const fallbackPeople=uniq([kw.person,...k.people]);
  const eventExamples=uniq([...concreteEvents,...fallbackEvents]).slice(0,5);
  const peopleExamples=uniq([...concretePeople,...fallbackPeople]).slice(0,5);
  const positive=uniq([...(k.positive||[]),kw.quality&&`a constructive expression of ${kw.quality}`]).slice(0,4);
  const challenging=uniq([...(k.negative||[]),kw.quality&&`an excessive or difficult expression of ${kw.quality}`]).slice(0,4);
  const locText=locationContextForPlanet(body,p);
  const routeText=routeContextText(body);
  const triggers=[...focusNarratives];
  natalContacts.filter(a=>!focusedNatalContacts.includes(a)).slice(0,2).forEach(a=>triggers.push(`${p.name} ${String(a.type).toLowerCase()} natal ${a.natalName} (${Number(a.orb).toFixed(2)}° orb)`));
  if(p.house===zone.house)triggers.push(`${p.name} is transiting the same current house sector as the destination bearing (House ${zone.house})`);
  if(locText)triggers.push(locText);
  if(body.routeContext?.gandanta?.length)triggers.push(`The physical route crosses gandanta: ${body.routeContext.gandanta.map(g=>g.label).join(', ')}`);

  const primaryFocus=activatedFocusHouses.length?activatedFocusHouses.map(h=>`House ${h} ${houseFocusDetail(h).label}`).join('; '):joinNatural((rules||[]).map(r=>`House ${r.house}`));
  const headline=focusNarratives.length
    ? `${p.name} is directly activating ${primaryFocus}.`
    : `${p.name} is active in ${p.sign} ${Number(p.degree||0).toFixed(1)}°, House ${p.house}, ${p.nakshatra||'its current nakshatra'}, with ${tone} journey potential.`;
  const eventText=`Most relevant manifestations for this trip: ${joinNatural(eventExamples)}.${focusNarratives.length?` ${focusNarratives.slice(0,2).join(' ')}`:''}`;
  const peopleText=`People most likely to carry the symbolism: ${joinNatural(peopleExamples)}.${kw.place?` A ${kw.place} setting can make the theme more literal.`:''}`;
  const positiveText=`If handled constructively, this can show as ${joinNatural(positive)}${activatedFocusHouses.length?`, specifically through ${activatedFocusHouses.map(h=>houseFocusDetail(h).label).join('; ')}`:''}.`;
  const challengingText=`If the transit is expressed with friction, watch for ${joinNatural(challenging)}${activatedFocusHouses.length?`, especially around ${activatedFocusHouses.map(h=>houseFocusDetail(h).label).join('; ')}`:''}.`;
  const destinationText=[zone.house?`The destination falls in current House ${zone.house} (${zone.sign||'—'}${zone.nakshatra?.name?`, ${zone.nakshatra.name}`:''}).`:'',locText,routeText].filter(Boolean).join(' ');
  return {headline,eventText,peopleText,positiveText,challengingText,destinationText,triggers,tone,score:Number(score.toFixed(2)),priorityBoost:Number(priorityBoost.toFixed(2)),themes:activatedFocusHouses.flatMap(h=>HOUSE_THEMES[h]||[]),planet:p.id};
}

function houseForecast(h,body,vocab){
  const zone=body.destinationZone||{};
  const lord=(body.houseLords||[]).find(x=>x.house===h);
  const inHouse=(body.planets||[]).filter(p=>p.house===h);
  const cuspContacts=(body.natalHouseAspects||[]).filter(a=>a.house===h).sort((a,b)=>a.orb-b.orb);
  const rulers=lord?[lord.lordName]:[];
  const topics=HOUSE_THEMES[h]||[];
  const planetKaraka=inHouse.flatMap(p=>(KARAKA[p.id]?.people||[]).slice(0,2));
  const people=uniq([...planetKaraka,...rulers.map(x=>`${x}-type person`)]).slice(0,4);
  const eventSeeds=uniq(inHouse.flatMap(p=>KARAKA[p.id]?.events||[])).slice(0,5);
  const positive=uniq(inHouse.flatMap(p=>KARAKA[p.id]?.positive||[])).slice(0,4);
  const negative=uniq(inHouse.flatMap(p=>KARAKA[p.id]?.negative||[])).slice(0,4);
  let score=0;cuspContacts.slice(0,3).forEach(a=>score+=aspectScore(a));if(h===zone.house)score+=.35;score=clamp(score,-1.5,1.5);
  const tone=score>.35?'constructive':score<-.35?'challenging':'mixed';
  const triggers=[];
  if(lord)triggers.push(`natal House ${h} is ruled by ${lord.lordName}, placed in natal House ${lord.lordHouse}`);
  if(inHouse.length)triggers.push(`${inHouse.map(p=>p.name).join(', ')} ${inHouse.length===1?'is':'are'} transiting current House ${h}`);
  cuspContacts.slice(0,3).forEach(a=>triggers.push(`${a.transitName} ${a.type.toLowerCase()} natal House ${h} cusp (${Number(a.orb).toFixed(2)}° orb)`));
  if(h===zone.house)triggers.push(`the destination bearing falls inside current House ${h}`);
  return {
    headline:`House ${h}: ${tone==='constructive'?'supportive':tone==='challenging'?'challenging':'mixed'} activation of ${joinNatural(topics.slice(0,4))}.`,
    eventText:`Possible events in this zone: ${joinNatural(eventSeeds.length?eventSeeds:[`developments involving ${topics[0]}`,`a situation involving ${topics[1]||topics[0]}`])}.`,
    peopleText:`People emphasized here: ${joinNatural(people.length?people:['people connected with these house topics'])}.`,
    positiveText:`Constructive expression: ${joinNatural(positive.length?positive:[`progress involving ${topics[0]}`,`a useful development involving ${topics[1]||topics[0]}`])}.`,
    challengingText:`Challenging expression: ${joinNatural(negative.length?negative:[`friction involving ${topics[0]}`,`a delay or complication involving ${topics[1]||topics[0]}`])}.`,
    destinationText:h===zone.house?'This is the current destination zone, so its manifestations receive extra weight during the approach and arrival.':'This house is active in the chart but is not the primary destination-bearing zone.',
    triggers,tone,score:Number(score.toFixed(2)),themes:topics,house:h
  };
}

function focusConfiguration(body){
  const pinned=[1,3,7];
  const houses=uniq([...(Array.isArray(body.focusHouses)?body.focusHouses:[]),...pinned]).map(Number).filter(h=>h>=1&&h<=12);
  const lords=uniq([...(Array.isArray(body.focusLords)?body.focusLords:[]),...pinned]).map(Number).filter(h=>h>=1&&h<=12);
  return {houses,lords};
}
function focusEvidence(body){
  const focus=focusConfiguration(body);
  const lordRows=(body.houseLords||[]).filter(h=>focus.lords.includes(Number(h.house)));
  const houseRows=focus.houses.map(h=>({house:h,topics:HOUSE_THEMES[h]||[]}));
  const transitLordHits=[];
  for(const row of lordRows){
    const natalLord=(body.natalPlanets||[]).find(p=>p.id===row.lordId);
    if(!natalLord)continue;
    const hits=(body.transitNatalAspects||[]).filter(a=>a.natalId===row.lordId).sort((a,b)=>a.orb-b.orb).slice(0,4);
    for(const hit of hits)transitLordHits.push({...hit,ruledHouse:row.house,lordName:row.lordName||natalLord.name});
  }
  const transitHouseHits=(body.natalHouseAspects||[]).filter(a=>focus.houses.includes(Number(a.house))).sort((a,b)=>a.orb-b.orb).slice(0,12);
  return {focus,lordRows,houseRows,transitLordHits,transitHouseHits};
}
function locationAstrologySummary(body){
  const current=(body.relocationCurrent||[]).slice(0,4);
  const destination=(body.relocationDestination||[]).slice(0,5);
  const local=(body.localSpaceContacts||[]).slice(0,5);
  const parts=[];
  if(destination.length)parts.push(`At the destination, ${destination.map(x=>`${x.glyph||''}${x.planetName} near ${x.angle} (${Number(x.orb).toFixed(1)}°)`).join(', ')} are the strongest relocation angularities.`);
  else if(current.length)parts.push(`At the current location, ${current.map(x=>`${x.glyph||''}${x.planetName} near ${x.angle} (${Number(x.orb).toFixed(1)}°)`).join(', ')} are the strongest relocation angularities.`);
  if(local.length)parts.push(`The route also runs close to local-space direction${local.length>1?'s':''} for ${local.map(x=>`${x.glyph||''}${x.planetName} (${Number(x.routeOrb).toFixed(1)}° from the route)`).join(', ')}.`);
  return parts.join(' ');
}
function focusedJourneySummary(body,planetForecasts){
  const ev=focusEvidence(body);
  const special={1:'self, body, identity and personal initiative',3:'communication, errands, skills and short-distance travel',7:'other people, contracts, clients and business relationships'};
  const lines=[];
  for(const h of ev.focus.lords){
    const row=(body.houseLords||[]).find(x=>Number(x.house)===h);
    if(!row)continue;
    const hits=ev.transitLordHits.filter(x=>Number(x.ruledHouse)===h).slice(0,2);
    const base=special[h]||joinNatural(HOUSE_THEMES[h]?.slice(0,3)||[]);
    lines.push(`Natal House ${h} lord ${row.lordName} (${base})${hits.length?` is being contacted by ${hits.map(x=>`${x.transitName} ${String(x.type).toLowerCase()} (${Number(x.orb).toFixed(1)}°)`).join(' and ')}`:' has no major tight transit aspect in the current aspect set'}.`);
  }
  for(const h of ev.focus.houses){
    const hits=ev.transitHouseHits.filter(x=>Number(x.house)===h).slice(0,2);
    if(hits.length)lines.push(`Natal House ${h} cusp is activated by ${hits.map(x=>`${x.transitName} ${String(x.type).toLowerCase()} (${Number(x.orb).toFixed(1)}°)`).join(' and ')}.`);
  }
  const loc=locationAstrologySummary(body);if(loc)lines.push(loc);
  return lines.join(' ');
}

function summaryForecast(body,planetForecasts){
  const zone=body.destinationZone||{};
  const ranked=Object.values(planetForecasts).sort((a,b)=>(Math.abs(b.score)+(b.priorityBoost||0))-(Math.abs(a.score)+(a.priorityBoost||0))).slice(0,3);
  const ev=focusEvidence(body);
  const focused=[];
  for(const h of ev.focus.lords){
    const row=(body.houseLords||[]).find(x=>Number(x.house)===h);if(!row)continue;
    const hits=ev.transitLordHits.filter(x=>Number(x.ruledHouse)===h).slice(0,3);
    const d=houseFocusDetail(h);
    if(hits.length)focused.push(`House ${h} lord ${row.lordName} (${d.label}) is currently contacted by ${hits.map(x=>`${x.transitName} ${String(x.type).toLowerCase()} at ${Number(x.orb).toFixed(2)}°`).join(' and ')}.`);
    else focused.push(`House ${h} lord ${row.lordName} remains a default journey focus for ${d.label}, but has no tight major transit aspect in the current set.`);
  }
  for(const h of ev.focus.houses){
    const hits=ev.transitHouseHits.filter(x=>Number(x.house)===h).slice(0,2);
    if(hits.length)focused.push(`The natal House ${h} cusp is also activated by ${hits.map(x=>`${x.transitName} ${String(x.type).toLowerCase()} (${Number(x.orb).toFixed(2)}°)`).join(' and ')}.`);
  }
  const locationText=locationAstrologySummary(body);
  const routeText=routeContextText(body);
  const topSpecific=ranked.map(x=>x.headline).filter(Boolean).join(' ');
  return `Journey focus: ${focused.join(' ')} ${topSpecific} The destination bearing falls in current House ${zone.house||'—'} (${zone.sign||'—'}${zone.nakshatra?.name?`, ${zone.nakshatra.name}`:''}). ${locationText?`${locationText} `:''}${routeText?`${routeText} `:''}Use these as concrete themes to observe in timing, encounters, communication, agreements, route changes, and arrival conditions; they are astrological interpretations, not guaranteed events.`;
}


export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function POST(request){
  try{
    const body = await request.json();
    const planets=Array.isArray(body.planets)?body.planets:[];
    if(!planets.length)return Response.json({error:'No planetary data supplied'},{status:400});
    const vocab=readVocabulary();
    const planetPredictions={};for(const p of planets)planetPredictions[p.id]=planetForecast(p,body,vocab);
    const housePredictions={};for(let h=1;h<=12;h++)housePredictions[h]=houseForecast(h,body,vocab);
    const natalUsage={
      natalAsc:Number(body.natalAsc),
      natalPlanetCount:Array.isArray(body.natalPlanets)?body.natalPlanets.length:0,
      natalHouseCount:Array.isArray(body.natalHouseCusps)?body.natalHouseCusps.length:0,
      houseLordCount:Array.isArray(body.houseLords)?body.houseLords.length:0,
      transitNatalAspectCount:Array.isArray(body.transitNatalAspects)?body.transitNatalAspects.length:0,
      transitNatalHouseAspectCount:Array.isArray(body.natalHouseAspects)?body.natalHouseAspects.length:0,
      verified:Boolean(Number.isFinite(Number(body.natalAsc))&&Array.isArray(body.natalPlanets)&&body.natalPlanets.length>=9&&Array.isArray(body.natalHouseCusps)&&body.natalHouseCusps.length===12)
    };
    const focus=focusEvidence(body);
    return Response.json({summary:summaryForecast(body,planetPredictions),planetPredictions,housePredictions,destinationZone:body.destinationZone||{},transitNatalAspects:body.transitNatalAspects||[],natalUsage,focusAnalysis:{...focus,locationAstrology:locationAstrologySummary(body)},modelVersion:'context-synthesis-7-lords-route-location'});
  }catch(e){
    console.error('Interpretation failed', e);
    return Response.json({error:'Interpretation failed'},{status:500});
  }
}
