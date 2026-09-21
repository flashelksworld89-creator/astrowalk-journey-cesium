import { NextResponse } from 'next/server';
export const runtime='nodejs';
export async function GET(){
  return NextResponse.json({token:process.env.CESIUM_ION_TOKEN||''},{headers:{'Cache-Control':'no-store'}});
}
