export const runtime='nodejs';
export const dynamic='force-dynamic';

const ALLOWED=new Set(['motorway','trunk','primary','secondary','tertiary','motorway_link','trunk_link','primary_link','secondary_link','tertiary_link']);

function cleanRoads(elements=[]){
  return elements
    .filter(e=>e.type==='way'&&e.tags?.name&&ALLOWED.has(e.tags.highway)&&Array.isArray(e.geometry)&&e.geometry.length>1)
    .map(e=>({
      id:String(e.id),
      name:e.tags.name,
      ref:e.tags.ref||'',
      type:e.tags.highway,
      geometry:e.geometry.map(p=>({lat:Number(p.lat),lng:Number(p.lon)})).filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lng))
    }))
    .filter(r=>r.geometry.length>1);
}

export async function POST(request){
  try{
    const body=await request.json();
    const lat=Number(body?.lat),lng=Number(body?.lng);
    const radius=Math.max(1000,Math.min(30000,Number(body?.radiusMeters)||22000));
    if(!Number.isFinite(lat)||!Number.isFinite(lng))return Response.json({error:'Invalid city center.'},{status:400});
    const query=`[out:json][timeout:25];way(around:${Math.round(radius)},${lat},${lng})[highway~"^(motorway|trunk|primary|secondary|tertiary)(_link)?$"][name];out tags geom;`;
    const response=await fetch('https://overpass-api.de/api/interpreter',{
      method:'POST',
      headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8','User-Agent':'AstroWalkJourney/3.4.3'},
      body:new URLSearchParams({data:query}),
      cache:'no-store'
    });
    if(!response.ok)throw new Error(`Road network service returned ${response.status}`);
    const data=await response.json();
    return Response.json({roads:cleanRoads(data?.elements||[])},{headers:{'Cache-Control':'no-store, max-age=0'}});
  }catch(error){
    console.error('Road network query failed',error);
    return Response.json({error:'Could not load the city road network right now.'},{status:502});
  }
}
