import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const { findRemotePairs } = createRequire(import.meta.url)('../remote-pairs.js');
const units = [];
for (const offset of [0, 3]) {
  for (let i = 0; i < 9; i++) {
    units.push(Array.from({length:9}, (_,j) => (i+offset)*12+j+offset));
    units.push(Array.from({length:9}, (_,j) => (j+offset)*12+i+offset));
    units.push(Array.from({length:9}, (_,j) => (Math.floor(i/3)*3+Math.floor(j/3)+offset)*12+(i%3)*3+j%3+offset));
  }
}
const peersFor = index => [...new Set(units.filter(unit => unit.includes(index)).flat())].filter(other => other !== index);
const makeNotes = entries => Object.fromEntries(entries.map(([index,digits]) => [index,new Set(digits)]));
const pair = [4,5];
test('four-cell chain eliminates only present candidates and does not mutate notes', () => {
  const notes = makeNotes([[18,pair],[13,pair],[24,pair],[60,pair],[66,[1,5]]]);
  const before = structuredClone(notes), result = findRemotePairs(notes, peersFor);
  assert.deepEqual(result.eliminations, [{index:66,digit:5}]);
  assert.equal(result.chain.length,4);
  assert.deepEqual(notes,before);
});
test('Gattai chain crosses grids and eliminates both pair digits', () => {
  const notes = makeNotes([[16,pair],[52,pair],[58,pair],[94,pair],[88,[1,4,5]]]);
  const result = findRemotePairs(notes,peersFor);
  assert.deepEqual(result.eliminations,[{index:88,digit:4},{index:88,digit:5}]);
  assert.deepEqual(result.chain,[16,52,58,94]);
  // Exhaust every possible assignment of the chain: both endpoint orders
  // exclude both reported digits at the target.
  let valid = 0;
  for (let mask = 0; mask < 16; mask++) {
    const values = result.chain.map((_,i) => pair[(mask >> i) & 1]);
    if (values.some((value,i) => result.chain.some((cell,j) => i !== j && peersFor(result.chain[i]).includes(cell) && value === values[j]))) continue;
    valid++;
    for (const {index,digit} of result.eliminations) assert(result.chain.some((cell,i) => peersFor(index).includes(cell) && values[i] === digit));
  }
  assert.equal(valid,2);
});
function graphSearch(length, targetPeers, overrides = {}) {
  const notes = makeNotes([...Array.from({length},(_,i) => [i,pair]),[99,[1,4,5]],...Object.entries(overrides).map(([i,v])=>[Number(i),v])]);
  return findRemotePairs(notes, index => index === 99 ? targetPeers : [index-1,index+1,...(targetPeers.includes(index)?[99]:[])]);
}
test('odd-cell chains and one-end visibility do not eliminate', () => {
  assert.equal(graphSearch(5,[0,4]),null);
  assert.equal(graphSearch(4,[0]),null);
});
test('two-cell naked pairs are not reported as Remote Pairs', () => assert.equal(graphSearch(2,[0,1]),null));
test('mixed pairs, non-bivalue links, and disconnected chains cannot bridge', () => {
  assert.equal(graphSearch(4,[0,3],{1:[4,6]}),null);
  assert.equal(graphSearch(4,[0,3],{1:[4,5,6]}),null);
  assert.equal(graphSearch(4,[0,3],{1:[]}),null);
});
test('longer even chains work', () => assert.equal(graphSearch(6,[0,5]).chain.length,6));
test('empty notes or no actual elimination returns null', () => {
  assert.equal(findRemotePairs({},peersFor),null);
  assert.equal(findRemotePairs(makeNotes([[18,pair],[13,pair],[24,pair],[60,pair],[66,[1,2,3]]]),peersFor),null);
});
test('walkthrough adapter records chain, eliminations, emphasis, and grid coordinates', () => {
  const source = readFileSync(new URL('../verify.js',import.meta.url),'utf8');
  const adapter = source.slice(source.indexOf('    function remotePairs()'),source.indexOf('    while (active.some'));
  let recorded;
  const notes = makeNotes([[16,pair],[52,pair],[58,pair],[94,pair],[88,[1,4,5]]]);
  const context = {findRemotePairs, notes, peersFor, cellName:index => index===94?'Grid 2: R5C8':`Grid 1: cell ${index}`, eliminate:(...args)=>{recorded=args;return true;}};
  assert.equal(vm.runInNewContext(adapter+'\nremotePairs()',context),true);
  assert.equal(recorded[0],'Remote Pairs');
  assert.equal(recorded[1].length,2);
  assert.match(recorded[2],/Grid 1:.*Grid 2:/);
  assert.equal(recorded[3].emphasis.length,8);
  assert.match(source,/xyzWing\(\) \|\| remotePairs\(\)/);
});
