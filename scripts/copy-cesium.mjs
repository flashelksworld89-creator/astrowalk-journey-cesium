import { cp, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
const src=resolve('node_modules/cesium/Build/Cesium');
const dest=resolve('public/cesium');
await mkdir(dest,{recursive:true});
await cp(src,dest,{recursive:true,force:true});
console.log('Cesium runtime copied to public/cesium');
