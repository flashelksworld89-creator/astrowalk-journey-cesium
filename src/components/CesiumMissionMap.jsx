import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import { loadGoogleMaps } from '../lib/googleMaps';
import { reverseGeocode } from '../lib/geocode';

const NAK_COLORS=[
  '#ef4444','#f97316','#fb923c','#f59e0b','#eab308','#84cc16','#22c55e','#10b981','#14b8a6',
  '#06b6d4','#0ea5e9','#3b82f6','#6366f1','#8b5cf6','#a855f7','#c026d3','#db2777','#e11d48',
  '#dc2626','#ea580c','#ca8a04','#65a30d','#16a34a','#0d9488','#0284c7','#4f46e5','#9333ea'
];
const toRad=d=>d*Math.PI/180;
const toDeg=r=>r*180/Math.PI;
const norm=n=>((Number(n)%360)+360)%360;
function destinationPoint(origin,bearingDeg,distanceM){
  const R=6371008.8,br=toRad(bearingDeg),lat1=toRad(Number(origin.lat)),lon1=toRad(Number(origin.lng)),d=distanceM/R;
  const lat2=Math.asin(Math.sin(lat1)*Math.cos(d)+Math.cos(lat1)*Math.sin(d)*Math.cos(br));
  const lon2=lon1+Math.atan2(Math.sin(br)*Math.sin(d)*Math.cos(lat1),Math.cos(d)-Math.sin(lat1)*Math.sin(lat2));
  return {lat:toDeg(lat2),lng:((toDeg(lon2)+540)%360)-180};
}
function cssHexToRgb(hex){const n=parseInt(hex.replace('#',''),16);return {r:(n>>16)&255,g:(n>>8)&255,b:n&255}}
function validPoint(p){return p&&Number.isFinite(Number(p.lat))&&Number.isFinite(Number(p.lng))}

export default function CesiumMissionMap({
  location,analysisLocation,destination,fullscreen,radiusMeters=804.672,
  cityCentered=false,cityCenter=null,cityRadiusMeters=null,onCityCenterChange,onStreetViewChange,
  onStreetPovChange,onStreetRoadBearing,onCityViewportChange,onMapPlaceSelect,focusLocation,
  streetLocation,highlightRoad=null,centerRouteRequest=0,chart=null
}){
  const hostRef=useRef(null),streetHostRef=useRef(null);
  const cesiumRef=useRef(null),viewerRef=useRef(null),handlerRef=useRef(null),entitiesRef=useRef([]),streetRef=useRef(null);
  const latestRef=useRef({});
  const resolvedCityKey=useRef('');
  const [error,setError]=useState(''),[streetVisible,setStreetVisible]=useState(false),[streetError,setStreetError]=useState(''),[advanced3d,setAdvanced3d]=useState(false),[mapReady,setMapReady]=useState(false);

  const effectiveCenter=cityCentered&&validPoint(cityCenter)?cityCenter:(validPoint(location)?location:validPoint(analysisLocation)?analysisLocation:destination);
  const effectiveRadius=cityCentered&&Number.isFinite(Number(cityRadiusMeters))?Number(cityRadiusMeters):Number(radiusMeters)||804.672;
  latestRef.current={location,analysisLocation,destination,effectiveCenter,effectiveRadius,cityCenter,highlightRoad,chart};

  const publishViewport=()=>{
    const C=cesiumRef.current,v=viewerRef.current,{effectiveCenter,effectiveRadius}=latestRef.current;
    if(!C||!v||!validPoint(effectiveCenter))return;
    try{
      const a=C.Cartesian3.fromDegrees(Number(effectiveCenter.lng),Number(effectiveCenter.lat),0);
      const edge=destinationPoint(effectiveCenter,90,Number(effectiveRadius)||1609.344);
      const b=C.Cartesian3.fromDegrees(edge.lng,edge.lat,0);
      const sa=C.SceneTransforms.worldToWindowCoordinates(v.scene,a),sb=C.SceneTransforms.worldToWindowCoordinates(v.scene,b);
      if(sa&&sb)onCityViewportChange?.({radiusPx:Math.hypot(sb.x-sa.x,sb.y-sa.y),diameterPx:Math.hypot(sb.x-sa.x,sb.y-sa.y)*2,mapWidth:v.canvas.clientWidth,mapHeight:v.canvas.clientHeight});
    }catch{}
  };

  const clearAstroEntities=()=>{
    const v=viewerRef.current;if(!v)return;
    for(const e of entitiesRef.current){try{v.entities.remove(e)}catch{}}
    entitiesRef.current=[];
  };
  const addEntity=e=>{if(e)entitiesRef.current.push(e);return e};

  const rebuildAstroLayer=()=>{
    const C=cesiumRef.current,v=viewerRef.current;
    const {effectiveCenter,effectiveRadius,location,analysisLocation,destination,cityCenter,highlightRoad,chart}=latestRef.current;
    if(!C||!v||!validPoint(effectiveCenter))return;
    clearAstroEntities();
    const radius=Math.max(1609.344,Number(effectiveRadius)||1609.344);
    const rotation=chart?.asc!=null?norm(90-Number(chart.asc)):90;
    for(let i=0;i<27;i++){
      const start=rotation+i*(360/27),end=start+(360/27),pts=[effectiveCenter];
      for(let j=0;j<=8;j++)pts.push(destinationPoint(effectiveCenter,start+(end-start)*(j/8),radius));
      const positions=pts.flatMap(p=>[p.lng,p.lat]),rgb=cssHexToRgb(NAK_COLORS[i]);
      addEntity(v.entities.add({name:`Nakshatra ${i+1}`,polygon:{hierarchy:C.Cartesian3.fromDegreesArray(positions),material:C.Color.fromBytes(rgb.r,rgb.g,rgb.b,40),outline:true,outlineColor:C.Color.fromBytes(rgb.r,rgb.g,rgb.b,120),height:1}}));
    }
    addEntity(v.entities.add({name:'City center',position:C.Cartesian3.fromDegrees(Number(effectiveCenter.lng),Number(effectiveCenter.lat),6),point:{pixelSize:10,color:C.Color.GOLD,outlineColor:C.Color.WHITE,outlineWidth:2},label:{text:cityCenter?.label||'CITY CENTER',font:'12px sans-serif',fillColor:C.Color.GOLD,pixelOffset:new C.Cartesian2(0,-18)}}));
    if(validPoint(location))addEntity(v.entities.add({name:'You are here',position:C.Cartesian3.fromDegrees(Number(location.lng),Number(location.lat),8),point:{pixelSize:14,color:C.Color.DODGERBLUE,outlineColor:C.Color.WHITE,outlineWidth:2},label:{text:'YOU',font:'bold 12px sans-serif',fillColor:C.Color.WHITE,pixelOffset:new C.Cartesian2(0,-22)}}));
    if(validPoint(analysisLocation))addEntity(v.entities.add({name:'Astrology position',position:C.Cartesian3.fromDegrees(Number(analysisLocation.lng),Number(analysisLocation.lat),5),point:{pixelSize:7,color:C.Color.GOLD,outlineColor:C.Color.BLACK,outlineWidth:1}}));
    if(validPoint(destination)){
      addEntity(v.entities.add({name:'Destination',position:C.Cartesian3.fromDegrees(Number(destination.lng),Number(destination.lat),8),point:{pixelSize:13,color:C.Color.LIME,outlineColor:C.Color.WHITE,outlineWidth:2},label:{text:'DESTINATION',font:'bold 12px sans-serif',fillColor:C.Color.WHITE,pixelOffset:new C.Cartesian2(0,-22)}}));
      if(validPoint(location))addEntity(v.entities.add({name:'Journey route',polyline:{positions:C.Cartesian3.fromDegreesArray([Number(location.lng),Number(location.lat),Number(destination.lng),Number(destination.lat)]),width:4,material:C.Color.WHITE.withAlpha(.82),clampToGround:true}}));
    }
    if(highlightRoad?.coordinates?.length){
      const flat=[];for(const p of highlightRoad.coordinates){const lng=Number(p.lng??p[0]),lat=Number(p.lat??p[1]);if(Number.isFinite(lat)&&Number.isFinite(lng))flat.push(lng,lat)}
      if(flat.length>=4)addEntity(v.entities.add({name:highlightRoad.name||'Highlighted road',polyline:{positions:C.Cartesian3.fromDegreesArray(flat),width:8,material:C.Color.GOLD.withAlpha(.92),clampToGround:true}}));
    }
    v.scene.requestRender();setTimeout(publishViewport,100);
  };

  const resolveCityCenter=async point=>{
    if(!validPoint(point))return;
    const key=`${Number(point.lat).toFixed(3)},${Number(point.lng).toFixed(3)}`;
    if(resolvedCityKey.current===key)return;resolvedCityKey.current=key;
    try{
      const found=await reverseGeocode(point);
      onCityCenterChange?.({lat:Number(found.lat),lng:Number(found.lng),label:found.label||'Selected area',radiusMeters:Math.max(Number(found.radiusMeters)||Number(radiusMeters)||1609.344,1609.344)});
    }catch{
      onCityCenterChange?.({lat:Number(point.lat),lng:Number(point.lng),label:'Selected area center',radiusMeters:Math.max(Number(cityRadiusMeters)||Number(radiusMeters)||1609.344,1609.344),approximate:true});
    }
  };

  useEffect(()=>{
    let cancelled=false;
    (async()=>{
      try{
        globalThis.CESIUM_BASE_URL='/cesium/';
        const C=Cesium;
        if(cancelled||!hostRef.current)return;
        cesiumRef.current=C;
        let ionToken='';
        try{const r=await fetch('/api/cesium-token',{cache:'no-store'});if(r.ok){const j=await r.json();ionToken=String(j.token||'').trim()}}catch{}
        if(ionToken)C.Ion.defaultAccessToken=ionToken;

        // Start with the zero-secret globe first. Optional terrain/buildings are layered in later.
        const viewer=new C.Viewer(hostRef.current,{animation:false,timeline:false,baseLayerPicker:false,baseLayer:false,geocoder:false,homeButton:false,sceneModePicker:false,navigationHelpButton:false,fullscreenButton:false,selectionIndicator:false,infoBox:false,shouldAnimate:false,requestRenderMode:false,terrainProvider:new C.EllipsoidTerrainProvider()});
        viewerRef.current=viewer;
        viewer.scene.backgroundColor=C.Color.fromCssColorString('#050713');
        viewer.scene.globe.baseColor=C.Color.fromCssColorString('#111827');
        viewer.scene.skyAtmosphere.show=true;
        viewer.scene.globe.depthTestAgainstTerrain=false;
        viewer.scene.screenSpaceCameraController.enableCollisionDetection=true;

        try{
          viewer.imageryLayers.addImageryProvider(new C.OpenStreetMapImageryProvider({url:'https://tile.openstreetmap.org/'}));
        }catch(e){console.warn('OSM imagery unavailable; Cesium globe remains active.',e)}

        const start=latestRef.current.effectiveCenter;
        if(!validPoint(start))throw new Error('A valid current location is required to initialize the map.');
        viewer.camera.setView({destination:C.Cartesian3.fromDegrees(Number(start.lng),Number(start.lat),Math.max(12000,(Number(latestRef.current.effectiveRadius)||1609.344)*1.45)),orientation:{heading:0,pitch:C.Math.toRadians(-72),roll:0}});

        const handler=new C.ScreenSpaceEventHandler(viewer.canvas);handlerRef.current=handler;
        handler.setInputAction(movement=>{
          let cartesian;
          try{cartesian=viewer.scene.pickPositionSupported?viewer.scene.pickPosition(movement.position):undefined}catch{}
          if(!C.defined(cartesian))cartesian=viewer.camera.pickEllipsoid(movement.position,viewer.scene.globe.ellipsoid);
          if(!C.defined(cartesian))return;
          const cart=C.Cartographic.fromCartesian(cartesian),lat=C.Math.toDegrees(cart.latitude),lng=C.Math.toDegrees(cart.longitude),currentHeight=viewer.camera.positionCartographic.height;
          onMapPlaceSelect?.({lat,lng,label:`${lat.toFixed(5)}, ${lng.toFixed(5)}`});
          viewer.camera.flyTo({destination:C.Cartesian3.fromDegrees(lng,lat,Math.max(220,Math.min(currentHeight*.5,9000))),orientation:{heading:viewer.camera.heading,pitch:currentHeight>2500?C.Math.toRadians(-60):C.Math.toRadians(-32),roll:0},duration:.75,easingFunction:C.EasingFunction.QUADRATIC_IN_OUT});
        },C.ScreenSpaceEventType.LEFT_CLICK);
        viewer.camera.moveEnd.addEventListener(publishViewport);
        setMapReady(true);setError('');rebuildAstroLayer();resolveCityCenter(latestRef.current.location);

        // Optional Cesium ion enhancements must never block the base map.
        if(ionToken){
          try{viewer.terrainProvider=await C.createWorldTerrainAsync();viewer.scene.globe.depthTestAgainstTerrain=true;setAdvanced3d(true)}catch(e){console.warn('Cesium terrain unavailable',e)}
          try{const buildings=await C.createOsmBuildingsAsync();viewer.scene.primitives.add(buildings);setAdvanced3d(true)}catch(e){console.warn('Cesium buildings unavailable',e)}
        }
      }catch(e){if(!cancelled){console.error(e);setError(e?.message||'Cesium failed to initialize.');setMapReady(false)}}
    })();
    return()=>{cancelled=true;try{handlerRef.current?.destroy()}catch{};try{viewerRef.current?.destroy()}catch{};handlerRef.current=null;viewerRef.current=null};
  },[]);

  useEffect(()=>{if(viewerRef.current)rebuildAstroLayer()},[location?.lat,location?.lng,analysisLocation?.lat,analysisLocation?.lng,destination?.lat,destination?.lng,effectiveCenter?.lat,effectiveCenter?.lng,effectiveRadius,highlightRoad,chart?.asc]);
  useEffect(()=>{if(validPoint(location))resolveCityCenter(location)},[location?.lat,location?.lng]);
  useEffect(()=>{const C=cesiumRef.current,v=viewerRef.current;if(!C||!v||!validPoint(focusLocation))return;v.camera.flyTo({destination:C.Cartesian3.fromDegrees(Number(focusLocation.lng),Number(focusLocation.lat),850),orientation:{heading:v.camera.heading,pitch:C.Math.toRadians(-38),roll:0},duration:1.15,easingFunction:C.EasingFunction.QUADRATIC_IN_OUT})},[focusLocation?.lat,focusLocation?.lng,focusLocation?.nonce]);
  useEffect(()=>{const C=cesiumRef.current,v=viewerRef.current;if(!C||!v||!centerRouteRequest||!validPoint(location)||!validPoint(destination))return;const pts=[location,destination].map(p=>C.Cartesian3.fromDegrees(Number(p.lng),Number(p.lat),0));const sphere=C.BoundingSphere.fromPoints(pts);v.camera.flyToBoundingSphere(sphere,{duration:1,offset:new C.HeadingPitchRange(0,C.Math.toRadians(-55),Math.max(1200,sphere.radius*4))})},[centerRouteRequest]);
  useEffect(()=>{const v=viewerRef.current;if(!v)return;setTimeout(()=>{try{v.resize();v.scene.requestRender();publishViewport()}catch{}},fullscreen?180:120)},[fullscreen]);

  useEffect(()=>{
    if(!validPoint(streetLocation)||!streetHostRef.current)return;
    let cancelled=false;
    loadGoogleMaps().then(maps=>{
      if(cancelled||!streetHostRef.current)return;
      if(!streetRef.current){
        const pano=new maps.StreetViewPanorama(streetHostRef.current,{position:streetLocation,pov:{heading:0,pitch:0},zoom:1,addressControl:false,fullscreenControl:false,linksControl:true,panControl:true,enableCloseButton:true});
        streetRef.current=pano;
        const publish=()=>{const pov=pano.getPov?.()||{},heading=Number(pov.heading)||0,links=pano.getLinks?.()||[];const diff=(a,b)=>Math.abs(((norm(a)-norm(b)+540)%360)-180);const best=links.map(l=>({heading:Number(l.heading)})).filter(l=>Number.isFinite(l.heading)).sort((a,b)=>diff(a.heading,heading)-diff(b.heading,heading))[0];onStreetPovChange?.({heading,pitch:Number(pov.pitch)||0,zoom:Number(pov.zoom)||0});if(best)onStreetRoadBearing?.(norm(best.heading))};
        maps.event.addListener(pano,'pov_changed',publish);maps.event.addListener(pano,'position_changed',publish);maps.event.addListener(pano,'links_changed',publish);maps.event.addListener(pano,'visible_changed',()=>{const visible=pano.getVisible?.()!==false;setStreetVisible(visible);onStreetViewChange?.(visible)});publish();
      }else{streetRef.current.setPosition(streetLocation);streetRef.current.setVisible(true)}
      setStreetError('');setStreetVisible(true);onStreetViewChange?.(true);
    }).catch(()=>{setStreetError('Street View is optional and unavailable because no working Google Maps key is configured.');setStreetVisible(false);onStreetViewChange?.(false)});
    return()=>{cancelled=true};
  },[streetLocation?.lat,streetLocation?.lng,streetLocation?.nonce]);

  return <div className="cesium-map-shell">
    <div ref={hostRef} className="cesium-map-canvas"/>
    {error&&<div className="map-error">{error}</div>}
    {streetError&&!streetVisible&&<div className="map-service-note">{streetError}</div>}
    <div className="cesium-mode-badge">{advanced3d?'CESIUM 3D TERRAIN + BUILDINGS':'CESIUM + OPENSTREETMAP'}</div>
    <div className="map-engine-status">{mapReady?'MAP READY':'STARTING MAP…'}</div>
    <div className="osm-attribution">© OpenStreetMap contributors</div>
    <div ref={streetHostRef} className={`cesium-street-overlay ${streetVisible?'visible':''}`}/>
    {streetVisible&&<button type="button" className="cesium-street-close" onClick={()=>{streetRef.current?.setVisible(false);setStreetVisible(false);onStreetViewChange?.(false)}}>Back to globe</button>}
  </div>;
}
