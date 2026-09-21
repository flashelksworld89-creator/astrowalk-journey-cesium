import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Compass, Map, Maximize2, Minimize2, Loader2, Sparkles } from 'lucide-react';
import ZodiacWheel from './ZodiacWheel';
import CesiumMissionMap from './CesiumMissionMap';
import StreetGameOverlay from './StreetGameOverlay';
import NakshatraExplorer from './NakshatraExplorer';
import PlanetStrip from './PlanetStrip';
import OutcomeFeedback from './OutcomeFeedback';
import TimeNavigator from './TimeNavigator';
import TransitPositionsPanel from './TransitPositionsPanel';
import CurrentDateTimeWidget from './CurrentDateTimeWidget';
import JourneyDirectionsPanel from './JourneyDirectionsPanel';
import PredictionFocusSelector from './PredictionFocusSelector';
import LocationAstrologyPanel from './LocationAstrologyPanel';
import MapScaleControls from './MapScaleControls';
import LiveTrackingControls from './LiveTrackingControls';
import {computeChart,computeNatalChart,calculateHouseLords,buildJourneyReading,bearingBetween,destinationZoneFromBearing,distanceKmBetween,geographicHouseFromBearing,formatDistance,HOUSE_MEANINGS,getSignData,relocationAngularity,calculateLocalSpaceDirections,localSpaceRouteContacts} from '../lib/astro';
import { requestPrivateInterpretation } from '../lib/privateInterpretation';
import { analyzeJourneyRoute } from '../lib/journeyRoute';
import { loadGoogleMaps } from '../lib/googleMaps';
import { geocodePlace } from '../lib/geocode';



function ForecastParagraphs({forecast,kind,label,fallback}){
  if(!forecast)return <div className="fullscreen-report-empty"><b>{kind} Prediction</b><p>{fallback}</p></div>;
  const first=[forecast.headline,forecast.eventText,forecast.peopleText].filter(Boolean).join(' ');
  const second=[forecast.positiveText?`Constructively, ${forecast.positiveText}`:'',forecast.challengingText?`The more challenging expression is ${forecast.challengingText}`:'',forecast.destinationText].filter(Boolean).join(' ');
  return <section className={`fullscreen-report-section fullscreen-report-${kind.toLowerCase()}`}>
    <div className="fullscreen-report-title"><small>{kind} Prediction</small><strong>{label}</strong></div>
    {first&&<p>{first}</p>}
    {second&&<p>{second}</p>}
    {!!forecast.triggers?.length&&<details className="fullscreen-report-triggers"><summary>Astrological basis</summary><ul>{forecast.triggers.map((t,i)=><li key={i}>{t}</li>)}</ul></details>}
  </section>;
}

function ForecastPanel({forecast,fallback}){
  if(!forecast)return <p>{fallback}</p>;
  return <div className="forecast-detail">
    <p className="forecast-headline">{forecast.headline}</p>
    <div className="forecast-grid"><div><b>What may happen</b><p>{forecast.eventText}</p></div><div><b>People / roles</b><p>{forecast.peopleText}</p></div><div className="forecast-positive"><b>Constructive expression</b><p>{forecast.positiveText}</p></div><div className="forecast-challenge"><b>Challenging expression</b><p>{forecast.challengingText}</p></div></div>
    <p className="forecast-destination">{forecast.destinationText}</p>
    {!!forecast.triggers?.length&&<details><summary>Why this forecast was generated</summary><ul>{forecast.triggers.map((t,i)=><li key={i}>{t}</li>)}</ul></details>}
  </div>;
}

const cardinalFromBearing=b=>['N','NE','E','SE','S','SW','W','NW'][Math.round((((b%360)+360)%360)/45)%8];

const TRACKING = {
  walk:{movementMeters:12,maxSeconds:20},
  drive:{movementMeters:50,maxSeconds:30},
  static:{movementMeters:Infinity,maxSeconds:Infinity}
};

const parseMapCoords=text=>{const m=String(text||'').trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);if(!m)return null;const lat=Number(m[1]),lng=Number(m[2]);if(Math.abs(lat)>90||Math.abs(lng)>180)return null;return{lat,lng,label:`${lat.toFixed(5)}, ${lng.toFixed(5)}`};};

export default function MissionView({mission,gps,gpsError,onBack}){
  const initialMode=mission.trackingMode||((mission.originSource==='gps')?(mission.travelMode||'walk'):'static');
  const [view,setView]=useState('map'),[mapFullscreen,setMapFullscreen]=useState(false),[fullscreenSettling,setFullscreenSettling]=useState(false),[fullscreenPredictionOpen,setFullscreenPredictionOpen]=useState(false),[date,setDate]=useState(new Date(mission.date)),[live,setLive]=useState(()=>Math.abs(new Date(mission.date).getTime()-Date.now())<5*60*1000),[trackingMode,setTrackingMode]=useState(initialMode),[liveLocation,setLiveLocation]=useState(initialMode==='static'?mission.location:(gps||mission.location)),[analysisLocation,setAnalysisLocation]=useState(mission.location),[chart,setChart]=useState(null),[natalChart,setNatalChart]=useState(null),[selected,setSelected]=useState(null),[selectedHouse,setSelectedHouse]=useState(null),[loadingChart,setLoadingChart]=useState(true),[privateReading,setPrivateReading]=useState(null),[privateReadingBusy,setPrivateReadingBusy]=useState(false),[wheelRadiusMeters,setWheelRadiusMeters]=useState(804.672),[distanceUnit,setDistanceUnit]=useState(initialMode==='drive'?'mi':'ft'),[movedMeters,setMovedMeters]=useState(0),[lastAnalysisAt,setLastAnalysisAt]=useState(Date.now()),[chartError,setChartError]=useState(''),[natalStatus,setNatalStatus]=useState('calculating'),[natalError,setNatalError]=useState(''),[streetViewActive,setStreetViewActive]=useState(false),[streetPov,setStreetPov]=useState({heading:0,pitch:0,zoom:0}),[streetRoadBearing,setStreetRoadBearing]=useState(null),[streetCompassMode,setStreetCompassMode]=useState('upright'),[followingPlanetId,setFollowingPlanetId]=useState(null),[cityCenter,setCityCenter]=useState(null),[cityWheelDiameterPx,setCityWheelDiameterPx]=useState(null),[journeyDestination,setJourneyDestination]=useState(mission.destination),[mapSelectedPlace,setMapSelectedPlace]=useState(null),[mapSearchText,setMapSearchText]=useState(''),[mapSearchBusy,setMapSearchBusy]=useState(false),[mapFocusLocation,setMapFocusLocation]=useState(null),[mapStreetLocation,setMapStreetLocation]=useState(null),[highlightRoad,setHighlightRoad]=useState(null),[focusHouses,setFocusHouses]=useState([1,3,7]),[focusLords,setFocusLords]=useState([1,3,7]),[relocatedCurrent,setRelocatedCurrent]=useState(null),[relocatedDestination,setRelocatedDestination]=useState(null),[routeData,setRouteData]=useState(null),[centerRouteRequest,setCenterRouteRequest]=useState(0);
  const lastAnalysisRef=useRef({location:mission.location,at:Date.now()});

  useEffect(()=>{if(!live)return;const id=setInterval(()=>setDate(new Date()),30000);return()=>clearInterval(id)},[live]);
  useEffect(()=>{if(streetViewActive)setStreetCompassMode('flat')},[streetViewActive]);

  useEffect(()=>{if(!mapFullscreen)setFullscreenPredictionOpen(false)},[mapFullscreen]);

  useEffect(()=>{
    if(trackingMode==='static'||!gps)return;
    setLiveLocation(gps);
    const prior=lastAnalysisRef.current.location;
    const moved=(distanceKmBetween(prior,gps)||0)*1000;
    const elapsed=(Date.now()-lastAnalysisRef.current.at)/1000;
    setMovedMeters(moved);
    const rule=TRACKING[trackingMode]||TRACKING.walk;
    const accuracyOkay=!Number.isFinite(gps.accuracy)||gps.accuracy<=Math.max(75,rule.movementMeters*3);
    if(accuracyOkay&&(moved>=rule.movementMeters||elapsed>=rule.maxSeconds)){
      setAnalysisLocation(gps);
      lastAnalysisRef.current={location:gps,at:Date.now()};
      setLastAnalysisAt(Date.now());
      setMovedMeters(0);
    }
  },[gps,trackingMode]);

  const changeTrackingMode=mode=>{
    setTrackingMode(mode);
    if(mode==='static'){
      setLiveLocation(analysisLocation);
    } else if(gps){
      setLiveLocation(gps);
      setAnalysisLocation(gps);
      lastAnalysisRef.current={location:gps,at:Date.now()};
      setLastAnalysisAt(Date.now());
      setMovedMeters(0);
      if(mode==='walk'){setDistanceUnit('ft')}
      if(mode==='drive'){setDistanceUnit('mi')}
    }
  };

  useEffect(()=>{let cancelled=false;setLoadingChart(true);setChartError('');computeChart(date,analysisLocation.lat,analysisLocation.lng).then(next=>{if(!cancelled){setChart(next);setSelected(prev=>prev?next.planets.find(p=>p.id===prev.id)||null:null)}}).catch(e=>{if(!cancelled){setChartError(e?.message||'Transit chart calculation failed.');setChart(null)}}).finally(()=>!cancelled&&setLoadingChart(false));return()=>{cancelled=true}},[date,analysisLocation.lat,analysisLocation.lng]);
  useEffect(()=>{let cancelled=false;const p=mission.profile;setNatalStatus('calculating');setNatalError('');setNatalChart(null);computeNatalChart(p.birthDate,p.birthTime,p.birthLat,p.birthLng,p.birthUtcOffset).then(n=>{if(!cancelled){if(!n?.planets?.length||!Number.isFinite(Number(n.asc)))throw new Error('Natal chart returned incomplete data.');setNatalChart(n);setNatalStatus('verified')}}).catch(e=>{if(!cancelled){setNatalStatus('error');setNatalError(e?.message||'Natal chart calculation failed.')}});return()=>{cancelled=true}},[mission.profile]);

  useEffect(()=>{
    if(!natalChart)return;let cancelled=false;const p=mission.profile;
    Promise.all([
      computeNatalChart(p.birthDate,p.birthTime,analysisLocation.lat,analysisLocation.lng,p.birthUtcOffset),
      computeNatalChart(p.birthDate,p.birthTime,journeyDestination.lat,journeyDestination.lng,p.birthUtcOffset)
    ]).then(([currentReloc,destReloc])=>{if(!cancelled){setRelocatedCurrent(currentReloc);setRelocatedDestination(destReloc)}}).catch(()=>{if(!cancelled){setRelocatedCurrent(null);setRelocatedDestination(null)}});
    return()=>{cancelled=true};
  },[natalChart,mission.profile,analysisLocation.lat,analysisLocation.lng,journeyDestination.lat,journeyDestination.lng]);

  const planets=chart?.planets||[],natalPlanets=natalChart?.planets||[];
  const houseLords=useMemo(()=>calculateHouseLords(natalPlanets,natalChart?.asc),[natalPlanets,natalChart?.asc]);
  const baseReading=useMemo(()=>buildJourneyReading({origin:analysisLocation,destination:journeyDestination,transitPlanets:planets,natalPlanets,houseLords,selectedDate:date}),[analysisLocation,journeyDestination,planets,natalPlanets,houseLords,date]);
  const bearing=useMemo(()=>bearingBetween(analysisLocation,journeyDestination),[analysisLocation,journeyDestination]);
  const destinationZone=useMemo(()=>chart?destinationZoneFromBearing(chart,bearing):null,[chart,bearing]);
  const relocationCurrent=useMemo(()=>natalChart&&relocatedCurrent?relocationAngularity(natalChart,relocatedCurrent,5):[],[natalChart,relocatedCurrent]);
  const relocationDestination=useMemo(()=>natalChart&&relocatedDestination?relocationAngularity(natalChart,relocatedDestination,5):[],[natalChart,relocatedDestination]);
  const localSpaceDirections=useMemo(()=>natalChart?calculateLocalSpaceDirections(natalChart,natalChart.date,analysisLocation.lat,analysisLocation.lng):[],[natalChart,analysisLocation.lat,analysisLocation.lng]);
  const localSpaceContacts=useMemo(()=>localSpaceRouteContacts(localSpaceDirections,bearing,12),[localSpaceDirections,bearing]);

  useEffect(()=>{
    if(!followingPlanetId||!analysisLocation||!journeyDestination){setRouteData(null);return;}
    let cancelled=false;setRouteData(null);
    const directFallback=message=>{
      const distanceMeters=(distanceKmBetween(analysisLocation,journeyDestination)||0)*1000;
      const speedMps=trackingMode==='drive'?11.11:1.34;
      setRouteData({status:'DIRECT',error:message,path:[analysisLocation,journeyDestination],streets:[],leg:{distanceMeters,durationSeconds:speedMps?distanceMeters/speedMps:0,startAddress:analysisLocation.label||'',endAddress:journeyDestination.label||'',steps:[]}});
    };
    loadGoogleMaps().then(maps=>{
      const service=new maps.DirectionsService();
      const mode=trackingMode==='drive'?maps.TravelMode.DRIVING:maps.TravelMode.WALKING;
      service.route({origin:analysisLocation,destination:journeyDestination,travelMode:mode,provideRouteAlternatives:false},(result,status)=>{
        if(cancelled)return;
        if(status!==maps.DirectionsStatus.OK||!result?.routes?.length){directFallback(`Using direct journey geometry because Google road routing is unavailable (${status||'unknown'}).`);return;}
        const route=result.routes[0],leg=route.legs?.[0];
        const path=(route.overview_path||[]).map(p=>({lat:p.lat(),lng:p.lng()}));
        const steps=(leg?.steps||[]).map(s=>({instruction:s.instructions||'',distanceMeters:Number(s.distance?.value)||0,durationSeconds:Number(s.duration?.value)||0}));
        const streetNames=[];
        for(const s of leg?.steps||[]){
          const html=String(s.instructions||'');
          for(const m of html.matchAll(/<b>(.*?)<\/b>/g)){const name=String(m[1]).replace(/<[^>]*>/g,'').trim();if(name&&!streetNames.includes(name))streetNames.push(name)}
        }
        setRouteData({status:'ROUTED',path,streets:streetNames.slice(0,20),leg:{distanceMeters:Number(leg?.distance?.value)||0,durationSeconds:Number(leg?.duration?.value)||0,startAddress:leg?.start_address||'',endAddress:leg?.end_address||'',steps}});
      });
    }).catch(()=>{if(!cancelled)directFallback('Using direct journey geometry. Add an optional Google Maps key only if you want Street View and road-by-road directions.')});
    return()=>{cancelled=true};
  },[followingPlanetId,analysisLocation.lat,analysisLocation.lng,journeyDestination.lat,journeyDestination.lng,trackingMode]);

  const reading=useMemo(()=>!baseReading?null:!privateReading?baseReading:{...baseReading,summary:privateReading.summary,privateModelVersion:privateReading.modelVersion},[baseReading,privateReading]);
  const natalSun=natalPlanets.find(p=>p.id==='sun'), natalMoon=natalPlanets.find(p=>p.id==='moon');
  const natalAudit=privateReading?.natalUsage||null;
  const focusForecast=selected?privateReading?.planetPredictions?.[selected.id]:selectedHouse?privateReading?.housePredictions?.[selectedHouse]:null;
  const followedPlanet=planets.find(p=>p.id===followingPlanetId)||null;
  const followedBearing=followedPlanet&&chart?((followedPlanet.siderealLon+90-chart.asc)%360+360)%360:null;
  const followedDirection=Number.isFinite(followedBearing)?cardinalFromBearing(followedBearing):null;
  const followedLineZone=chart&&Number.isFinite(followedBearing)?destinationZoneFromBearing(chart,followedBearing):null;
  const followedNak=followedPlanet?.nakshatra||followedLineZone?.nakshatra||null;
  const fullscreenPlanetForecast=selected?privateReading?.planetPredictions?.[selected.id]:followedPlanet?privateReading?.planetPredictions?.[followedPlanet.id]:null;
  const fullscreenPlanet=selected||followedPlanet||null;
  const fullscreenHouseNumber=selectedHouse||fullscreenPlanet?.house||destinationZone?.house||null;
  const fullscreenHouseForecast=fullscreenHouseNumber?privateReading?.housePredictions?.[fullscreenHouseNumber]:null;
  const focusTitle=selected?`${selected.glyph} ${selected.name} forecast`:selectedHouse?`House ${selectedHouse} · ${HOUSE_MEANINGS[selectedHouse]?.name||''}`:'Select a planet or house';
  const choosePlanet=p=>{setSelected(p);setSelectedHouse(null);setFollowingPlanetId(p?.id||null)};const chooseHouse=h=>{setSelectedHouse(h);setSelected(null)};
  const currentTravelBearing=streetViewActive?Number(streetPov.heading)||0:bearing;
  const currentTravelZone=chart&&Number.isFinite(currentTravelBearing)?destinationZoneFromBearing(chart,currentTravelBearing):null;
  const cityBearing=useMemo(()=>cityCenter?bearingBetween(cityCenter,liveLocation):null,[cityCenter,liveLocation]);
  const cityDistanceMeters=useMemo(()=>cityCenter?(distanceKmBetween(cityCenter,liveLocation)||0)*1000:null,[cityCenter,liveLocation]);
  const geographicHouse=Number.isFinite(cityBearing)?geographicHouseFromBearing(cityBearing):null;
  const geographicNakshatraZone=chart&&Number.isFinite(cityBearing)?destinationZoneFromBearing(chart,cityBearing):null;
  const resolvedCityRadiusMeters=Number(cityCenter?.radiusMeters)||wheelRadiusMeters;
  const geographicRadiusMeters=/las vegas/i.test(String(cityCenter?.label||''))?Math.max(resolvedCityRadiusMeters,22209.9):resolvedCityRadiusMeters;
  const routeAnalysis=useMemo(()=>routeData?.path?.length&&cityCenter&&chart?analyzeJourneyRoute({path:routeData.path,cityCenter,chart}):null,[routeData,cityCenter,chart]);

  useEffect(()=>{
    if(!chart||!natalChart||!baseReading)return;
    let cancelled=false;
    setPrivateReadingBusy(true);
    const routeContext=routeAnalysis?{
      ...routeAnalysis,
      streets:routeData?.streets||[],
      distanceMeters:routeData?.leg?.distanceMeters||0,
      durationSeconds:routeData?.leg?.durationSeconds||0,
      startAddress:routeData?.leg?.startAddress||'',
      endAddress:routeData?.leg?.endAddress||''
    }:null;
    requestPrivateInterpretation({
      chart,natalChart,houseLords,origin:analysisLocation,destination:journeyDestination,
      bearing:baseReading.bearing,direction:baseReading.direction,distanceKm:baseReading.distanceKm,
      selectedDate:date,focusHouses,focusLords,relocationCurrent,relocationDestination,localSpaceContacts,routeContext
    }).then(r=>{if(!cancelled)setPrivateReading(r)})
      .catch(()=>{if(!cancelled)setPrivateReading(null)})
      .finally(()=>{if(!cancelled)setPrivateReadingBusy(false)});
    return()=>{cancelled=true};
  },[chart,natalChart,baseReading,houseLords,analysisLocation,journeyDestination,date,focusHouses,focusLords,relocationCurrent,relocationDestination,localSpaceContacts,routeAnalysis,routeData]);
  const natalBirthBearing=useMemo(()=>cityCenter&&Number.isFinite(Number(mission.profile?.birthLat))&&Number.isFinite(Number(mission.profile?.birthLng))?bearingBetween(cityCenter,{lat:Number(mission.profile.birthLat),lng:Number(mission.profile.birthLng)}):null,[cityCenter,mission.profile?.birthLat,mission.profile?.birthLng]);
  const flatModeActive=streetViewActive&&streetCompassMode==='flat';
  const baseWheelSize=Math.max(180,Math.min(mapFullscreen?820:680,560*Math.sqrt(Math.max(30,wheelRadiusMeters)/804.672)));
  const wheelDisplaySize=flatModeActive
    ? Math.min(mapFullscreen?1120:920,baseWheelSize*1.48)
    : (Number.isFinite(cityWheelDiameterPx)?Math.max(180,cityWheelDiameterPx):baseWheelSize);

  const setCurrentFromMap=point=>{
    if(!point)return;
    const next={lat:Number(point.lat),lng:Number(point.lng),label:point.label||'Selected map location'};
    setTrackingMode('static');
    setLiveLocation(next);
    setAnalysisLocation(next);
    lastAnalysisRef.current={location:next,at:Date.now()};
    setLastAnalysisAt(Date.now());
    setMovedMeters(0);
  };
  const setDestinationFromMap=point=>{
    if(!point)return;
    setJourneyDestination({lat:Number(point.lat),lng:Number(point.lng),label:point.label||'Selected destination'});
  };
  const searchMapLocation=async e=>{
    e?.preventDefault?.();
    const q=mapSearchText.trim();
    if(!q)return;
    setMapSearchBusy(true);
    try{
      const direct=parseMapCoords(q);
      if(direct){setMapSelectedPlace(direct);setMapFocusLocation({...direct,nonce:Date.now()});return;}
      const point=await geocodePlace(q);
      setMapSelectedPlace(point);
      setMapFocusLocation({...point,nonce:Date.now()});
    }catch{
      setMapSelectedPlace(null);
    }
    finally{setMapSearchBusy(false)}
  };
  const openSelectedStreet=()=>{
    if(!mapSelectedPlace)return;
    setMapStreetLocation({...mapSelectedPlace,nonce:Date.now()});
  };
  const openCurrentStreet=()=>{
    const point=mapSelectedPlace||liveLocation||analysisLocation;
    if(!point)return;
    setMapStreetLocation({...point,nonce:Date.now()});
  };

  const toggleMapFullscreen=()=>{
    if(fullscreenSettling)return;
    setFullscreenSettling(true);
    setMapFullscreen(v=>!v);
    window.setTimeout(()=>setFullscreenSettling(false),320);
  };

  return <div className={mapFullscreen?'mission-page map-is-fullscreen':'mission-page'}>
    {!mapFullscreen&&<><header className="mission-header"><button onClick={onBack} className="back-button"><ArrowLeft size={16}/> Setup</button><div><h1>AstroWalk Journey <small className="build-version">v4.1.0 Lean Cesium Core</small></h1><p>{journeyDestination?.label||'No destination selected'}</p></div></header><div className="top-analysis-grid"><CurrentDateTimeWidget/><TimeNavigator date={date} live={live} onLive={()=>{setLive(true);setDate(new Date())}} onChange={d=>{if(!Number.isNaN(d.getTime())){setLive(false);setDate(d)}}}/><TransitPositionsPanel date={date} live={live} chart={chart}/></div><section className="card natal-verification"><div className="section-title">Natal chart verification <span>{natalStatus==='verified'?'ACTIVE':natalStatus==='error'?'ERROR':'CALCULATING'}</span></div>{natalStatus==='calculating'&&<div className="natal-status-line"><Loader2 className="spin" size={15}/> Calculating natal Ascendant, houses and planets…</div>}{natalStatus==='error'&&<div className="natal-error"><b>Natal chart was not generated.</b><span>{natalError}</span><span>Return to Setup and verify birth date, exact birth time, birthplace and UTC offset.</span></div>}{natalStatus==='verified'&&natalChart&&<><div className="natal-verified-head"><span className="natal-asc-dot"/><b>Natal chart verified and available to the prediction engine</b></div><div className="natal-proof-grid"><div><small>Natal ASC</small><b>{getSignData(natalChart.asc).label}</b></div><div><small>Natal Sun</small><b>{natalSun?`${natalSun.sign} ${natalSun.degree}°`:'—'}</b></div><div><small>Natal Moon</small><b>{natalMoon?`${natalMoon.sign} ${natalMoon.degree}°`:'—'}</b></div><div><small>Birth houses</small><b>{natalChart.houseCusps?.length||0} loaded</b></div></div>{natalAudit&&<div className="natal-used-audit"><b>Used in this prediction</b><span>{natalAudit.transitNatalAspectCount} transit→natal planet contacts</span><span>{natalAudit.transitNatalHouseAspectCount} transit→natal house contacts</span><span>{natalAudit.houseLordCount} natal house rulers</span></div>}</>}</section>{natalStatus==='verified'&&<PredictionFocusSelector houseLords={houseLords} focusHouses={focusHouses} focusLords={focusLords} onChange={(type,next)=>type==='house'?setFocusHouses(next):setFocusLords(next)}/>} {natalStatus==='verified'&&<LocationAstrologyPanel currentHits={relocationCurrent} destinationHits={relocationDestination} localSpaceContacts={localSpaceContacts}/>} {reading&&<section className="card destination-reading"><div className="section-title"><Sparkles size={14}/> Journey forecast <span>{destinationZone?`Destination zone: House ${destinationZone.house}`:''}</span></div><p>{reading.summary}</p>{privateReadingBusy&&<div className="small-note">Combining natal chart, live transit, route zone and private terminology…</div>}{natalStatus==='verified'&&!privateReadingBusy&&!natalAudit&&<div className="error">Natal chart is loaded, but the private interpretation response has not confirmed natal-data usage. Refresh or check the /api/interpret deployment.</div>}</section>}<div className="mission-tabs"><button className={view==='compass'?'active':''} onClick={()=>setView('compass')}><Compass size={16}/> Compass</button><button className={view==='map'?'active':''} onClick={()=>setView('map')}><Map size={16}/> Map</button></div><PlanetStrip planets={planets} selected={selected} onSelect={choosePlanet}/></>}
    {loadingChart&&!chart?<section className="card loading-chart"><Loader2 className="spin" size={20}/> Calculating sidereal transit chart…</section>:null}{chartError&&<section className="card error"><b>Transit compass could not be generated.</b> {chartError}</section>}
    {view==='compass'&&!mapFullscreen&&chart&&<div className="layout main"><section className="wheel-card"><ZodiacWheel chart={chart} natalAsc={natalChart?.asc} natalMc={natalChart?.mc} natalPlanets={natalPlanets} natalBirthBearing={natalBirthBearing} planets={planets} selectedPlanet={selected} onSelectPlanet={choosePlanet} selectedHouse={selectedHouse} onSelectHouse={chooseHouse} destinationBearing={bearing} followingPlanetId={followingPlanetId} onCenterRequest={()=>{setView('map');setCenterRouteRequest(v=>v+1)}}/></section><div className="stack"><LiveTrackingControls mode={trackingMode} onModeChange={changeTrackingMode} gps={gps} gpsError={gpsError} movedMeters={movedMeters} lastAnalysisAt={lastAnalysisAt}/><section className="card prediction-focus"><div className="section-title">{focusTitle}</div><ForecastPanel forecast={focusForecast} fallback="Click any planetary glyph or numbered house sector on the wheel. The panel will show possible events, people/roles, constructive and challenging expressions, and the natal/transit triggers behind the forecast."/></section><JourneyDirectionsPanel planet={followedPlanet} routeData={routeData} analysis={routeAnalysis} departureDate={date}/><OutcomeFeedback reading={reading}/></div></div>}
    {view==='map'&&<div className={`${mapFullscreen?'fullscreen-map-wrap':'mission-map-wrap'} ${fullscreenSettling?'map-transitioning':''}`}>
      <div><CesiumMissionMap location={liveLocation} analysisLocation={analysisLocation} destination={journeyDestination} fullscreen={mapFullscreen} radiusMeters={wheelRadiusMeters} followUser={trackingMode!=='static'} cityCentered cityCenter={cityCenter} cityRadiusMeters={geographicRadiusMeters} onCityCenterChange={setCityCenter} onStreetViewChange={setStreetViewActive} onStreetPovChange={setStreetPov} onStreetRoadBearing={setStreetRoadBearing} onCityViewportChange={g=>setCityWheelDiameterPx(Number(g?.diameterPx)||null)} onMapPlaceSelect={setMapSelectedPlace} focusLocation={mapFocusLocation} streetLocation={mapStreetLocation} highlightRoad={highlightRoad} centerRouteRequest={centerRouteRequest} chart={chart}/></div>
      <NakshatraExplorer cityCenter={cityCenter} cityRadiusMeters={geographicRadiusMeters} chart={chart} userLocation={liveLocation} streetViewActive={streetViewActive} onHighlightRoad={road=>{setHighlightRoad(road);setMapSelectedPlace({...road.representative,label:road.name})}} onSetDestination={setDestinationFromMap} onOpenStreet={point=>{setMapSelectedPlace(point);setMapStreetLocation({...point,nonce:Date.now()})}}/>
      <form className="map-location-search map-location-search-hud" onSubmit={searchMapLocation}>
        <input value={mapSearchText} onChange={e=>setMapSearchText(e.target.value)} placeholder="Search address, landmark, city…" aria-label="Search map location"/>
        <button type="submit" disabled={mapSearchBusy}>{mapSearchBusy?'Searching…':'Search'}</button>
      </form>
      {mapSelectedPlace&&<div className="map-selected-location map-selected-location-hud">
        <div><small>Selected location</small><b>{mapSelectedPlace.label}</b></div>
        <div className="map-selected-actions">
          <button type="button" onClick={()=>setMapFocusLocation({...mapSelectedPlace,nonce:Date.now()})}>Go Here</button>
          <button type="button" onClick={()=>setCurrentFromMap(mapSelectedPlace)}>Set Current</button>
          <button type="button" onClick={()=>setDestinationFromMap(mapSelectedPlace)}>Set Destination</button>
          <button type="button" onClick={openSelectedStreet}>Open Street View</button>
          <button type="button" className="quiet" onClick={()=>setMapSelectedPlace(null)}>×</button>
        </div>
      </div>}
      {streetViewActive&&<StreetGameOverlay active heading={streetPov.heading} pitch={streetPov.pitch} roadBearing={streetRoadBearing} currentZone={geographicNakshatraZone||currentTravelZone} currentBearing={cityBearing} depthMeters={1609.344} followedPlanet={followedPlanet} followedBearing={followedBearing} followedZone={followedLineZone} onStopFollowing={()=>setFollowingPlanetId(null)}/>}
      <MapScaleControls radiusMeters={wheelRadiusMeters} unit={distanceUnit} onUnitChange={setDistanceUnit} onRadiusChange={setWheelRadiusMeters}/>
      <div className="map-tracking-overlay"><LiveTrackingControls mode={trackingMode} onModeChange={changeTrackingMode} gps={gps} gpsError={gpsError} movedMeters={movedMeters} lastAnalysisAt={lastAnalysisAt}/></div>
      {mapFullscreen&&<aside className={`fullscreen-prediction-box ${fullscreenPredictionOpen?'open':'collapsed'}`} aria-label="Fullscreen predictions">
        <button type="button" className="fullscreen-prediction-toggle" onClick={()=>setFullscreenPredictionOpen(v=>!v)} aria-expanded={fullscreenPredictionOpen}>
          <span className="prediction-toggle-title"><Sparkles size={15}/><b>Predictions</b></span>
          <span className="prediction-toggle-focus">{selected?`${selected.glyph} ${selected.name}`:selectedHouse?`House ${selectedHouse}`:'Journey'}</span>
          <span className="prediction-toggle-icon">{fullscreenPredictionOpen?'−':'+'}</span>
        </button>
        {fullscreenPredictionOpen&&<div className="fullscreen-prediction-content">
          <div className="fullscreen-prediction-head"><div><small>Active forecast</small><strong>{focusTitle}</strong></div></div>
          {reading?.summary&&<div className="fullscreen-journey-summary"><small>Journey overview</small><p>{reading.summary}</p></div>}
          <div className="fullscreen-organized-report">
            <ForecastParagraphs
              kind="Planet"
              label={fullscreenPlanet?`${fullscreenPlanet.glyph} ${fullscreenPlanet.name} · House ${fullscreenPlanet.house||'—'} · ${fullscreenPlanet.sign||''} ${Number(fullscreenPlanet.degree||0).toFixed(1)}°`:'No planet selected'}
              forecast={fullscreenPlanetForecast}
              fallback="Tap a transit planet on the compass to see how that planet may affect the journey, the people encountered, and the natal houses or house lords it activates."
            />
            <ForecastParagraphs
              kind="House"
              label={fullscreenHouseNumber?`House ${fullscreenHouseNumber} · ${HOUSE_MEANINGS[fullscreenHouseNumber]?.name||''}`:'No house selected'}
              forecast={fullscreenHouseForecast}
              fallback="Select a house, or select a planet that occupies a house, to see a focused interpretation of that life area during the journey."
            />
          </div>
          {privateReadingBusy&&<div className="small-note">Updating natal, transit, route and location interpretation…</div>}
        </div>}
      </aside>}
      <button className="fullscreen-button" onClick={toggleMapFullscreen} disabled={fullscreenSettling}>{mapFullscreen?<Minimize2 size={17}/>:<Maximize2 size={17}/>} {mapFullscreen?'Exit full screen':'Full screen'}</button>
      {streetViewActive&&<div className="street-compass-controls"><b>Street compass</b><div><button className={streetCompassMode==='flat'?'active':''} onClick={()=>setStreetCompassMode('flat')}>Flat</button><button className={streetCompassMode==='upright'?'active':''} onClick={()=>setStreetCompassMode('upright')}>Upright</button></div></div>}
      {followedPlanet&&!flatModeActive&&<div className="planet-follow-panel"><span>Following <b>{followedPlanet.glyph} {followedPlanet.name}</b></span><span>{followedBearing.toFixed(0)}° {followedDirection}</span><button onClick={()=>setFollowingPlanetId(null)}>Stop</button></div>}
      {flatModeActive&&<div className="flat-travel-hud">
        <div className="flat-hud-primary"><small>Selected planet</small><b>{followedPlanet?`${followedPlanet.glyph} ${followedPlanet.name}`:'Tap a planet'}</b></div>
        <div><small>Current travel house</small><b>{currentTravelZone?`House ${currentTravelZone.house}`:'—'}</b></div>
        <div><small>Planetary line house</small><b>{followedPlanet?`House ${followedPlanet.house}`:'—'}</b></div>
        <div><small>Current nakshatra field</small><b>{currentTravelZone?.nakshatra?.name||'—'}{currentTravelZone?.nakshatra?.pada?` · Pada ${currentTravelZone.nakshatra.pada}`:''}</b></div>
        <div><small>Selected planet nakshatra</small><b>{followedNak?.name||'—'}{followedNak?.pada?` · Pada ${followedNak.pada}`:''}</b></div>
        <div><small>Planet degree</small><b>{followedPlanet?`${followedPlanet.sign} ${followedPlanet.degree}°`:'—'}</b></div>
        <div><small>Nakshatra degree</small><b>{Number.isFinite(Number(followedNak?.degreeInNakshatra))?`${Number(followedNak.degreeInNakshatra).toFixed(2)}°`:'—'}</b></div>
        <div><small>Follow bearing</small><b>{Number.isFinite(followedBearing)?`${followedBearing.toFixed(0)}° ${followedDirection}`:'—'}</b></div>
        {followedPlanet&&<button onClick={()=>setFollowingPlanetId(null)}>Stop following</button>}
      </div>}
      {cityCenter&&!streetViewActive&&<div className="city-center-hud"><small>Geographic wheel center</small><b>{cityCenter.label}</b><span>You are in geographic House {geographicHouse||'—'} · {Number.isFinite(cityDistanceMeters)?formatDistance(cityDistanceMeters/1000,distanceUnit):'—'} from center</span></div>}
      {chart&&<div className={`map-wheel-overlay ${streetViewActive?`street-${streetCompassMode}`:''}`} style={{'--wheel-size':`${wheelDisplaySize}px`}}><div className="compass-overlay-label">{streetViewActive?'STREET SIDEREAL COMPASS':'LIVE SIDEREAL COMPASS'}</div><ZodiacWheel chart={chart} natalAsc={natalChart?.asc} natalMc={natalChart?.mc} natalPlanets={natalPlanets} natalBirthBearing={natalBirthBearing} planets={planets} selectedPlanet={selected} onSelectPlanet={choosePlanet} selectedHouse={selectedHouse} onSelectHouse={chooseHouse} destinationBearing={bearing} compact overlay radiusMeters={geographicRadiusMeters} distanceUnit={distanceUnit} displayHeading={streetViewActive?streetPov.heading:0} followingPlanetId={followingPlanetId} flatMode={flatModeActive} travelBearing={currentTravelBearing} cityCentered cityCenterLabel={cityCenter?.label} userGeoBearing={cityBearing} userGeoDistanceMeters={cityDistanceMeters} geoRadiusMeters={geographicRadiusMeters} geographicHouse={geographicHouse} onCenterRequest={()=>setCenterRouteRequest(v=>v+1)}/></div>}
    </div>}
    {view==='map'&&!mapFullscreen&&<div className="layout main under-map"><section className="card prediction-focus"><div className="section-title">{focusTitle}</div><ForecastPanel forecast={focusForecast} fallback="Click a planet glyph or numbered house zone on the compass overlay to open its event forecast."/></section><JourneyDirectionsPanel planet={followedPlanet} routeData={routeData} analysis={routeAnalysis} departureDate={date}/><OutcomeFeedback reading={reading}/></div>}
  </div>;
}
