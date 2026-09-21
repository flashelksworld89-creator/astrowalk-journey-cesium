import fs from 'node:fs';
import path from 'node:path';

const input = process.argv[2] || 'scripts/planet-vocab-template.csv';
const output = process.argv[3] || 'scripts/planet-vocab-output.json';
const validPlanets = new Set(['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','rahu','ketu']);
const validCategories = new Set(['people','events','qualities','places','objects']);

function parseCsvLine(line) {
  const out=[];
  let value='';
  let quoted=false;
  for(let i=0;i<line.length;i++){
    const ch=line[i];
    if(ch==='"'){
      if(quoted && line[i+1]==='"'){ value+='"'; i++; }
      else quoted=!quoted;
    } else if(ch===',' && !quoted){
      out.push(value.trim()); value='';
    } else value+=ch;
  }
  out.push(value.trim());
  return out;
}

const text=fs.readFileSync(input,'utf8').replace(/^\uFEFF/,'');
const lines=text.split(/\r?\n/).filter(line=>line.trim());
if(lines.length<2) throw new Error('CSV has no terminology rows.');
const headers=parseCsvLine(lines[0]).map(x=>x.toLowerCase());
const required=['planet','category','term','weight'];
for(const h of required) if(!headers.includes(h)) throw new Error(`Missing CSV column: ${h}`);

const bank={};
for(const planet of validPlanets){
  bank[planet]={people:[],events:[],qualities:[],places:[],objects:[]};
}

for(let i=1;i<lines.length;i++){
  const cells=parseCsvLine(lines[i]);
  const row=Object.fromEntries(headers.map((h,j)=>[h,cells[j]??'']));
  const planet=row.planet.toLowerCase();
  const category=row.category.toLowerCase();
  const term=row.term.trim();
  const weight=Math.max(0,Math.min(1,Number(row.weight || 0.65)));
  if(!validPlanets.has(planet)) throw new Error(`Row ${i+1}: invalid planet "${row.planet}"`);
  if(!validCategories.has(category)) throw new Error(`Row ${i+1}: invalid category "${row.category}"`);
  if(!term) throw new Error(`Row ${i+1}: term is empty`);
  bank[planet][category].push({term,weight:Number.isFinite(weight)?weight:0.65});
}

fs.writeFileSync(output,JSON.stringify(bank,null,2));
console.log(`Created ${path.resolve(output)}`);
console.log('Copy the entire JSON file into the Vercel PLANET_VOCAB_JSON environment variable.');
