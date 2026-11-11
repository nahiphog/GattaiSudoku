import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
function page(file) {
  const html=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
  function node() { return {style:{},dataset:{},value:'',hidden:false,disabled:false,children:[],events:{},textContent:'',innerHTML:'',classList:{add(){},toggle(){}},append(...items){this.children.push(...items)},replaceChildren(){this.children=[];this.innerHTML=''},setAttribute(){},addEventListener(name,fn){this.events[name]=fn},click(){return this.events.click?.()}}; }
  const elements=Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(([,id])=>['#'+id,node()]));
  const document={body:node(),createElement:node,querySelector(id){assert(elements[id],`Missing element ${id}`);return elements[id]},querySelectorAll(){return []}};
  const context=vm.createContext({document,localStorage:{getItem(){}},window:{setTimeout,location:{search:''}},navigator:{clipboard:{writeText(){}}},setTimeout,performance,URLSearchParams,console});
  for(const [,src] of html.matchAll(/<script src="\.\/([^"?]+)(?:\?[^"]*)?"><\/script>/g))vm.runInContext(fs.readFileSync(new URL('../'+src,import.meta.url),'utf8'),context);
  return {elements,context};
}
for(const mode of ['single','dual']) test(`${mode} digging automatically evaluates, navigates, and replaces old walkthrough`,async()=>{
  const {elements:e}=page('index.html');
  e['#digCellMode'].value=mode;e['#digStopAt'].value='124';
  await e['#startDigging'].click();
  assert.equal(e['#resultPanel'].hidden,false);
  assert.equal(e['#walkthrough'].hidden,false);
  assert.match(e['#walkthroughRating'].textContent,/Difficulty: Beginner \(8\)/);
  assert.equal(e['#walkthroughStepCount'].textContent,'Step 1 of 2');
  e['#nextWalkthroughStep'].click();assert.equal(e['#walkthroughStepCount'].textContent,'Step 2 of 2');
  assert.equal(e['#nextWalkthroughStep'].disabled,true);
  e['#firstWalkthroughStep'].click();assert.equal(e['#walkthroughStepCount'].textContent,'Step 1 of 2');
  e['#digStopAt'].value='126';await e['#startDigging'].click();
  assert.equal(e['#walkthroughStepCount'].textContent,'0 steps');
  assert.equal(e['#walkthroughTechnique'].textContent,'Already complete');
  assert.equal(e['#nextWalkthroughStep'].disabled,true);
  assert.equal(e['#generationEvaluationStatus'].hidden,true);
});
test('verifier still imports, checks uniqueness, and uses the same walkthrough',async()=>{
  const generated=page('index.html').elements;generated['#digStopAt'].value='124';
  await generated['#startDigging'].click();
  const cells=generated['#puzzleResult'].children.slice(0,144);
  const text=cells.map(cell=>cell.textContent||'.').join('');
  const {elements:e}=page('verify.html');e['#solutionString'].value=text;e['#importString'].click();e['#verifyGrid'].click();
  assert.equal(e['#evaluateDifficulty'].hidden,false);e['#evaluateDifficulty'].click();
  assert.equal(e['#walkthroughRating'].textContent,generated['#walkthroughRating'].textContent);
  assert.equal(e['#walkthroughStepCount'].textContent,'Step 1 of 2');
  e['#clearGrid'].click();assert.equal(e['#walkthrough'].hidden,true);
});
