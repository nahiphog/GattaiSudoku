import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const {phistomefelRegions,findPhistomefelRing}=createRequire(import.meta.url)('../phistomefel-ring.js');
function fixture(offset,source,target,kind) {
 const values=Array(144).fill(0),notes={};
 for(let r=0;r<12;r++)for(let c=0;c<12;c++)if((r<9&&c<9)||(r>=3&&c>=3))notes[r*12+c]=new Set([1,2,3,4,5,6,7,8,9]);
 const regions=phistomefelRegions(offset);
 for(const cell of [...regions.ring,...regions.corners]){values[cell]=1;delete notes[cell];}
 for(const cell of regions[source].slice(0,3))values[cell]=2;
 for(const cell of regions[target].slice(0,kind==='exclude'?3:2))values[cell]=2;
 const index=regions[target][4];values[index]=0;notes[index]=new Set([2,3]);
 return {values,notes,index};
}
test('exact 16-cell sets and Grid B offset',()=>{
 const a=phistomefelRegions(),b=phistomefelRegions(3);
 assert.equal(a.ring.length,16);assert.equal(a.corners.length,16);assert.equal(new Set([...a.ring,...a.corners]).size,32);
 assert.deepEqual(a.ring,[26,27,28,29,30,38,42,50,54,62,66,74,75,76,77,78]);
 assert.deepEqual(a.corners,[0,1,7,8,12,13,19,20,84,85,91,92,96,97,103,104]);
 assert.deepEqual(b.ring,a.ring.map(i=>i+39));assert.deepEqual(b.corners,a.corners.map(i=>i+39));
});
for(const offset of [0,3])for(const target of ['ring','corners'])for(const kind of ['exclude','force'])test(`grid ${offset} ${target} ${kind} using equal counts`,()=>{
 const source=target==='ring'?'corners':'ring',f=fixture(offset,source,target,kind),before=structuredClone(f);
 const result=findPhistomefelRing(f.values,f.notes);
 assert(result);assert.equal(result.offset,offset);assert.equal(result.digit,2);assert.equal(result.kind,kind);
 assert.deepEqual(result.eliminations,[{index:f.index,digit:kind==='exclude'?2:3}]);assert.deepEqual(f,before);
 // Enumerate the target cell's candidates; every assignment satisfying the
 // equal-count constraint must retain the candidate that was not eliminated.
 for(const candidate of f.notes[f.index]){
  const values=[...f.values];values[f.index]=candidate;const regions=phistomefelRegions(offset);
  const count=region=>region.filter(i=>values[i]===2).length;
  if(count(regions.ring)===count(regions.corners))assert(!result.eliminations.some(e=>e.digit===candidate));
 }
});
test('zero occurrences removes digit from the opposite set',()=>{
 const f=fixture(0,'ring','corners','exclude'),regions=phistomefelRegions();
 for(const i of [...regions.ring,...regions.corners])if(f.values[i]===2)f.values[i]=1;
 const r=findPhistomefelRing(f.values,f.notes);assert.equal(r.digit,2);assert.deepEqual(r.eliminations,[{index:f.index,digit:2}]);
});
test('uncertain counts do not treat placed counts as final',()=>{
 const f=fixture(0,'ring','corners','exclude'),i=phistomefelRegions().ring[5];f.values[i]=0;f.notes[i]=new Set([2,3]);
 assert.equal(findPhistomefelRing(f.values,f.notes),null);
});
test('walkthrough records +200 technique with both sets highlighted',()=>{
 const src=readFileSync(new URL('../walkthrough.js',import.meta.url),'utf8');
 const f=fixture(3,'ring','corners','exclude');let recorded;
 const adapter=src.slice(src.indexOf('    function phistomefelRing()'),src.indexOf('    function remotePairs()'));
 assert.equal(vm.runInNewContext(adapter+'\nphistomefelRing()', {findPhistomefelRing,working:f.values,notes:f.notes,eliminate:(...args)=>{recorded=args;return true}}),true);
 assert.equal(recorded[0],'Phistomefel Ring');assert.match(recorded[2],/Grid 2 \(B\)/);assert.equal(recorded[3].affected.length,32);
 assert.equal(JSON.parse(src.match(/const scores = (\{[^\n]+?\});/)[1])['Phistomefel Ring'],200);
 assert.match(src,/remotePairs\(\) \|\| phistomefelRing\(\)/);
});

test('valid Gattai completions satisfy the identity and retain solution candidates',()=>{
 const generator=readFileSync(new URL('../generate.js',import.meta.url),'utf8');
 const code=generator.slice(generator.indexOf('  const digits'),generator.indexOf('  const addLines'));
 const data=vm.runInNewContext(code+'\n({solution:fullGattai(),active,housesFor})');
 const {solution,active,housesFor}=data;
 for(const offset of [0,3]){const {ring,corners}=phistomefelRegions(offset);for(let d=1;d<=9;d++)assert.equal(ring.filter(i=>solution[i]===d).length,corners.filter(i=>solution[i]===d).length);}
 let seed=37;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
 for(let trial=0;trial<100;trial++){
  const values=solution.map((d,i)=>active.includes(i)&&random()<0.45?d:0),notes={};
  for(const i of active)if(!values[i]){const used=new Set(housesFor[i].flat().map(j=>values[j]));notes[i]=new Set([1,2,3,4,5,6,7,8,9].filter(d=>!used.has(d)&&(d===solution[i]||random()<0.8)));}
  const result=findPhistomefelRing(values,notes);
  if(result)for(const e of result.eliminations)assert.notEqual(e.digit,solution[e.index]);
 }
});
