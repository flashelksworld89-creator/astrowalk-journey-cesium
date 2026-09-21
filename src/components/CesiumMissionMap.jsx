import { useEffect, useMemo, useRef, useState } from 'react';
import { loadGoogleMaps } from '../lib/googleMaps';

const NAK_COLORS=[
  '#ef4444','#f97316','#fb923c','#f59e0b','#eab308','#84cc16','#22c55e','#10b981','#14b8a6',
  '#06b6d4','#0ea5e9','#3b82f6','#6366f1','#8b5cf6','#a855f7','#c026d3','#db2777','#e11d48',
  '#dc2626','#ea580c','#ca8a04','#65a30d','#16a34a','#0d9488','#0284c7','#4f46e5','#9333ea'
];

const toRad=d=>d*Math.PI/180;
const toDeg=r=>r*180/Math.PI;
const norm=n=>((Number(n)%360)+360)%360;
function distanceMeters(a,b){
  if(!a||!b)return 0;
  const R=6371008.8,dLat=toRad(Number(b.lat)-Number(a.lat)),dLon=toRad(Number(b.lng)-Number(a.lng));
  const p1=toRad(Number(a.lat)),p2=toRad(Number(b.lat));
  const h=Math.sin(dLat/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(h));
}
function destinationPoint(origin,bearingDeg,distanceM){
  const R=6371008.8,br=toRad(bearingDeg),lat1=toRad(Number(origin.lat)),lon1=toRad(Number(origin.lng)),d=distanceM/R;
  const lat2=Math.asin(Math.sin(lat1)*Math.cos(d)+Math.cos(lat1)*Math.sin(d)*Math.cos(br));
  const lon2=lon1+Math.atan2(Math.sin(br)*Math.sin(d)*Math.cos(lat1),Math.cos(d)-Math.sin(lat1)*Math.sin(lat2));
  return {lat:toDeg(lat2),lng:((toDeg(lon2)+540)%360)-180};
}
function cssHexToRgb(hex){
  const n=parseInt(hex.replace('#',''),16);return {r:(n>>16)&255,g:(n>>8)&255,b:n&255};
}

export default function CesiumMissionMap({
  location,analysisLocation,destination,fullscreen,radiusMeters=804.672,followUser=true,
  cityCentered=false,cityCenter=null,cityRadiusMeters=null,onCityCenterChange,onStreetViewChange,
  onStreetPovChange,onStreetRoadBearing,onCityViewportChange,onMapPlaceSelect,focusLocation,
  streetLocation,highlightRoad=null,travelMode='walk',onRouteUpdate,centerRouteRequest=0,chart=null
}){
  const hostRef=useRef(null),cesiumRef=useRef(null),viewerRef=useRef(null),handlerRef=useRef(null),entitiesRef=useRef([]),resolvedCityKey=useRef('');
  const streetHostRef=useRef(null),streetRef=useRef(null),googleRef=useRef(null);
  const [error,setError]=useState(''),[streetVisible,setStreetVisible]=useState(false),[advanced3d,setAdvanced3d]=useState(false);
  const effectiveCenter=cityCentered&&cityCenter?cityCenter:location;
  const effectiveRadius=cityCentered&&Number.isFinite(Number(cityRadiusMeters))?Number(cityRadiusMeters):Number(radiusMeters)||804.672;

  const resolveCityCenter=async point=>{
    if(!point)return;
    const key=`${Number(point.lat).toFixed(3)},${Number(point.lng).toFixed(3)}`;
    if(resolvedCityKey.current===key)return;
    resolvedCityKey.current=key;
    try{
      const maps=googleRef.current||await loadGoogleMaps();googleRef.current=maps;
      const geocoder=new maps.Geocoder();
      const {results}=await geocoder.geocode({location:{lat:Number(point.lat),lng:Number(point.lng)}});
      const preferred=results?.find(r=>r.types?.includes('locality'))||results?.find(r=>r.types?.includes('postal_town'))||results?.[0];
      if(!preferred)return;
      const comp=preferred.address_components?.find(c=>c.types?.includes('locality'))||preferred.address_components?.find(c=>c.types?.includes('postal_town'));
      const center={lat:preferred.geometry.location.lat(),lng:preferred.geometry.location.lng()};
      let regionRadius=Math.max(Number(radiusMeters)||804.672,804.672);
      const vp=preferred.geometry.viewport;
      if(vp){const ne=vp.getNorthEast(),sw=vp.getSouthWest();const corners=[{lat:ne.lat(),lng:ne.lng()},{lat:ne.lat(),lng:sw.lng()},{lat:sw.lat(),lng:ne.lng()},{lat:sw.lat(),lng:sw.lng()}];regionRadius=Math.max(regionRadius,...corners.map(c=>distanceMeters(center,c)));}
      onCityCenterChange?.({...center,label:comp?.long_name||preferred.formatted_address||'City center',radiusMeters:regionRadius});
    }catch{}
  };

  const publishViewport=()=>{
    const C=cesiumRef.current,v=viewerRef.current;if(!C||!v||!effectiveCenter)return;
    try{
      const a=C.Cartesian3.fromDegrees(Number(effectiveCenter.lng),Number(effectiveCenter.lat),0);
      const edge=destinationPoint(effectiveCenter,90,effectiveRadius);
      const b=C.Cartesian3.fromDegrees(edge.lng,edge.lat,0);
      const sa=C.SceneTransforms.worldToWindowCoordinates(v.scene,a),sb=C.SceneTransforms.worldToWindowCoordinates(v.scene,b);
      if(sa&&sb){const radiusPx=Math.hypot(sb.x-sa.x,sb.y-sa.y);onCityViewportChange?.({radiusPx,diameterPx:radiusPx*2,mapWidth:v.canvas.clientWidth,mapHeight:v.canvas.clientHeight});}
    }catch{}
  };

  const clearAstroEntities=()=>{
    const v=viewerRef.current;if(!v)return;entitiesRef.current.forEach(e=>{try{v.entities.remove(e)}catch{}});entitiesRef.current=[];
  };
  const addEntity=e=>{if(e)entitiesRef.current.push(e);return e};

  const rebuildAstroLayer=()=>{
    const C=cesiumRef.current,v=viewerRef.current;if(!C||!v||!effectiveCenter)return;
    clearAstroEntities();
    const radius=Math.max(1609.344,Number(effectiveRadius)||1609.344);
    const rotation=chart?.asc!=null?norm(90-Number(chart.asc)):90;
    for(let i=0;i<27;i++){
      const start=rotation+i*(360/27),end=start+(360/27),pts=[effectiveCenter];
      for(let j=0;j<=8;j++)pts.push(destinationPoint(effectiveCenter,start+(end-start)*(j/8),radius));
      const positions=pts.flatMap(p=>[p.lng,p.lat]);const rgb=cssHexToRgb(NAK_COLORS[i]);
      addEntity(v.entities.add({name:`Nakshatra ${i+1}`,polygon:{hierarchy:C.Cartesian3.fromDegreesArray(positions),material:C.Color.fromBytes(rgb.r,rgb.g,rgb.b,44),outline:true,outlineColor:C.Color.fromBytes(rgb.r,rgb.g,rgb.b,135),height:1}}));
    }
    addEntity(v.entities.add({name:'City center',position:C.Cartesian3.fromDegrees(Number(effectiveCenter.lng),Number(effectiveCenter.lat),6),point:{pixelSize:10,color:C.Color.GOLD,outlineColor:C.Color.WHITE,outlineWidth:2},label:{text:cityCenter?.label||'CITY CENTER',font:'12px sans-serif',fillColor:C.Color.GOLD,pixelOffset:new C.Cartesian2(0,-18)}}));
    if(location)addEntity(v.entities.add({name:'You are here',position:C.Cartesian3.fromDegrees(Number(location.lng),Number(location.lat),8),point:{pixelSize:14,color:C.Color.DODGERBLUE,outlineColor:C.Color.WHITE,outlineWidth:2},label:{text:'YOU',font:'bold 12px sans-serif',fillColor:C.Color.WHITE,pixelOffset:new C.Cartesian2(0,-22)}}));
    if(analysisLocation)addEntity(v.entities.add({name:'Astrology position',position:C.Cartesian3.fromDegrees(Number(analysisLocation.lng),Number(analysisLocation.lat),5),point:{pixelSize:7,color:C.Color.GOLD,outlineColor:C.Color.BLACK,outlineWidth:1}}));
    if(destination){
      addEntity(v.entities.add({name:'Destination',position:C.Cartesian3.fromDegrees(Number(destination.lng),Number(destination.lat),8),point:{pixelSize:13,color:C.Color.LIME,outlineColor:C.Color.WHITE,outlineWidth:2},label:{text:'DESTINATION',font:'bold 12px sans-serif',fillColor:C.Color.WHITE,pixelOffset:new C.Cartesian2(0,-22)}}));
      addEntity(v.entities.add({name:'Journey route',polyline:{positions:C.Cartesian3.fromDegreesArray([Number(location.lng),Number(location.lat),Number(destination.lng),Number(destination.lat)]),width:4,material:C.Color.WHITE.withAlpha(.8),clampToGround:true}}));
    }
    if(highlightRoad?.coordinates?.length){const flat=[];highlightRoad.coordinates.forEach(p=>flat.push(Number(p.lng??p[0]),Number(p.lat??p[1])));if(flat.length>=4)addEntity(v.entities.add({name:highlightRoad.name||'Highlighted road',polyline:{positions:C.Cartesian3.fromDegreesArray(flat),width:8,material:C.Color.GOLD.withAlpha(.92),clampToGround:true}}));}
    v.scene.requestRender();setTimeout(publishViewport,80);
  };

  useEffect(()=>{
    let cancelled=false;
    (async()=>{
      try{
        globalThis.CESIUM_BASE_URL='/cesium/';
        const C=await import('cesium');if(cancelled||!hostRef.current)return;cesiumRef.current=C;
        let ionToken='';try{const r=await fetch('/api/cesium-token',{cache:'no-store'});if(r.ok){const j=await r.json();ionToken=j.token||''}}catch{}
        if(ionToken)C.Ion.defaultAccessToken=ionToken;
        const imageryProvider=new C.OpenStreetMapImageryProvider({url:'https://tile.openstreetmap.org/'});
        const viewer=new C.Viewer(hostRef.current,{animation:false,timeline:false,baseLayerPicker:false,geocoder:false,homeButton:false,sceneModePicker:false,navigationHelpButton:false,fullscreenButton:false,selectionIndicator:false,infoBox:false,shouldAnimate:true,requestRenderMode:true,maximumRenderTimeChange:Infinity,baseLayer:new C.ImageryLayer(imageryProvider),terrainProvider:new C.EllipsoidTerrainProvider()});
        viewerRef.current=viewer;viewer.scene.globe.depthTestAgainstTerrain=true;viewer.scene.backgroundColor=C.Color.fromCssColorString('#050713');viewer.scene.skyAtmosphere.show=true;
        if(ionToken){
          try{viewer.terrainProvider=await C.createWorldTerrainAsync();setAdvanced3d(true)}catch{}
          try{const buildings=await C.createOsmBuildingsAsync();viewer.scene.primitives.add(buildings);setAdvanced3d(true)}catch{}
        }
        viewer.scene.screenSpaceCameraController.enableCollisionDetection=true;
        const start=effectiveCenter||location;
        viewer.camera.flyTo({destination:C.Cartesian3.fromDegrees(Number(start.lng),Number(start.lat),Math.max(12000,effectiveRadius*1.45)),orientation:{heading:0,pitch:C.Math.toRadians(-72),roll:0},duration:0});
        const handler=new C.ScreenSpaceEventHandler(viewer.canvas);handlerRef.current=handler;
        handler.setInputAction(movement=>{
          let cartesian=viewer.scene.pickPosition(movement.position);if(!C.defined(cartesian))cartesian=viewer.camera.pickEllipsoid(movement.position,viewer.scene.globe.ellipsoid);if(!C.defined(cartesian))return;
          const cart=C.Cartographic.fromCartesian(cartesian),lat=C.Math.toDegrees(cart.latitude),lng=C.Math.toDegrees(cart.longitude);const currentHeight=viewer.camera.positionCartographic.height;
          onMapPlaceSelect?.({lat,lng,label:`${lat.toFixed(5)}, ${lng.toFixed(5)}`});
          viewer.camera.flyTo({destination:C.Cartesian3.fromDegrees(lng,lat,Math.max(220,Math.min(currentHeight*.5,9000))),orientation:{heading:viewer.camera.heading,pitch:currentHeight>2500?C.Math.toRadians(-60):C.Math.toRadians(-32),roll:0},duration:.75,easingFunction:C.EasingFunction.QUADRATIC_IN_OUT});
        },C.ScreenSpaceEventType.LEFT_CLICK);
        viewer.camera.moveEnd.addEventListener(publishViewport);
        rebuildAstroLayer();resolveCityCenter(location);setError('');
      }catch(e){if(!cancelled)setError(e?.message||'Cesium failed to initialize.');}
    })();
    return()=>{cancelled=true;try{handlerRef.current?.destroy()}catch{};try{viewerRef.current?.destroy()}catch{};handlerRef.current=null;viewerRef.current=null};
  },[]);

  useEffect(()=>{if(viewerRef.current)rebuildAstroLayer()},[location?.lat,location?.lng,analysisLocation?.lat,analysisLocation?.lng,destination?.lat,destination?.lng,effectiveCenter?.lat,effectiveCenter?.lng,effectiveRadius,highlightRoad,chart?.asc]);

  useEffect(()=>{const C=cesiumRef.current,v=viewerRef.current;if(!C||!v||!focusLocation)return;v.camera.flyTo({destination:C.Cartesian3.fromDegrees(Number(focusLocation.lng),Number(focusLocation.lat),850),orientation:{heading:v.camera.heading,pitch:C.Math.toRadians(-38),roll:0},duration:1.15,easingFunction:C.EasingFunction.QUADRATIC_IN_OUT})},[focusLocation?.lat,focusLocation?.lng,focusLocation?.nonce]);
  useEffect(()=>{const C=cesiumRef.current,v=viewerRef.current;if(!C||!v||!centerRouteRequest)return;const pts=[location,destination].filter(Boolean).map(p=>C.Cartesian3.fromDegrees(Number(p.lng),Number(p.lat),0));if(pts.length===2){const sphere=C.BoundingSphere.fromPoints(pts);v.camera.flyToBoundingSphere(sphere,{duration:1.0,offset:new C.HeadingPitchRange(0,C.Math.toRadians(-55),Math.max(1200,sphere.radius*4))})}},[centerRouteRequest]);
  useEffect(()=>{const v=viewerRef.current;if(!v)return;setTimeout(()=>{try{v.resize();v.scene.requestRender();publishViewport()}catch{}},fullscreen?180:120)},[fullscreen]);

  useEffect(()=>{
    if(!streetLocation||!streetHostRef.current)return;
    let cancelled=false;
    loadGoogleMaps().then(maps=>{
      if(cancelled||!streetHostRef.current)return;googleRef.current=maps;
      if(!streetRef.current){
        const pano=new maps.StreetViewPanorama(streetHostRef.current,{position:streetLocation,pov:{heading:0,pitch:0},zoom:1,addressControl:false,fullscreenControl:false,linksControl:true,panControl:true,enableCloseButton:true});streetRef.current=pano;
        const publish=()=>{const pov=pano.getPov?.()||{},heading=Number(pov.heading)||0,links=pano.getLinks?.()||[];const diff=(a,b)=>Math.abs(((norm(a)-norm(b)+540)%360)-180);const best=links.map(l=>({heading:Number(l.heading)})).filter(l=>Number.isFinite(l.heading)).sort((a,b)=>diff(a.heading,heading)-diff(b.heading,heading))[0];onStreetPovChange?.({heading,pitch:Number(pov.pitch)||0,zoom:Number(pov.zoom)||0});if(best)onStreetRoadBearing?.(norm(best.heading));};maps.event.addListener(pano,'pov_changed',publish);maps.event.addListener(pano,'position_changed',publish);maps.event.addListener(pano,'links_changed',publish);maps.event.addListener(pano,'visible_changed',()=>{const visible=pano.getVisible?.()!==false;setStreetVisible(visible);onStreetViewChange?.(visible)});publish();
      }else{streetRef.current.setPosition(streetLocation);streetRef.current.setVisible(true)}
      setStreetVisible(true);onStreetViewChange?.(true);
    }).catch(()=>{});
    return()=>{cancelled=true};
  },[streetLocation?.lat,streetLocation?.lng,streetLocation?.nonce]);

  return <div className="cesium-map-shell">
    <div ref={hostRef} className="cesium-map-canvas"/>
    {error&&<div className="map-error">{error}</div>}
    <div className="cesium-mode-badge">{advanced3d?'CESIUM 3D TERRAIN + BUILDINGS':'CESIUM GLOBE'}</div>
    <div ref={streetHostRef} className={`cesium-street-overlay ${streetVisible?'visible':''}`}/>
    {streetVisible&&<button type="button" className="cesium-street-close" onClick={()=>{streetRef.current?.setVisible(false);setStreetVisible(false);onStreetViewChange?.(false)}}>Back to globe</button>}
  </div>;
}
