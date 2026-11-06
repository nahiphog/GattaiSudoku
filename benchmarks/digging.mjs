import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';

// Exercise the actual browser click handlers with a minimal DOM. Timer delays
// are omitted to measure computation, rather than Node/browser timer policies.
const source = readFileSync(new URL('../generate.js', import.meta.url), 'utf8');
const core = source.slice(source.indexOf('  const digits'), source.indexOf('  const addLines'));
const controls = source.slice(source.indexOf('  const digStatus'), source.indexOf('  startDig.addEventListener'));
const current = source.slice(source.indexOf('  startDig.addEventListener'), source.indexOf('  const buildStatus'));
const legacy = readFileSync(new URL('./legacy-dig-handler.txt', import.meta.url), 'utf8');

function setup(seed, mode, handler, options = {}) {
  let state = seed >>> 0;
  const math = Object.create(Math);
  math.random = () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let value = Math.imul(state ^ state >>> 15, 1 | state);
    value ^= value + Math.imul(value ^ value >>> 7, 61 | value);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
  const nodes = new Map();
  const node = id => {
    if (!nodes.has(id)) nodes.set(id, { value: '', disabled: false, addEventListener(event, fn) { this[event] = fn; } });
    return nodes.get(id);
  };
  node('#digCellMode').value = mode;
  node('#digStopAt').value = options.stopAt ?? '';
  node('#digTimeCap').value = options.cap ?? '';
  let yields = 0;
  const context = {
    Math: math, performance: options.clock ?? performance,
    document: { querySelector: node },
    window: { setTimeout(fn) {
      yields++;
      if (yields === options.haltAfter) node('#haltDigging').click();
      fn();
    } },
    resultPanel: {}, present(puzzle, solution) { context.result = { puzzle: [...puzzle], solution: [...solution] }; },
  };
  const compile = new Function(...Object.keys(context), core + controls + handler + `
    const exactCount = countSolutions;
    let checks = 0;
    countSolutions = (...args) => { checks++; return exactCount(...args); };
    return {
      getChecks: () => checks,
      makeFull: fullGattai,
      isUnique: puzzle => exactCount(puzzle, 2) === 1,
      useFull: grid => { fullGattai = () => [...grid]; }
    };
  `);
  Object.assign(context, compile(...Object.values(context)));
  return { context, node, yields: () => yields };
}

async function run(seed, mode, handler, full, options) {
  const runtime = setup(seed, mode, handler, options);
  runtime.context.useFull(full);
  const began = performance.now();
  await runtime.node('#startDigging').click();
  const ms = performance.now() - began;
  const { result } = runtime.context;
  const checks = runtime.context.getChecks();
  assert(result, runtime.node('#digStatus').textContent);
  assert(runtime.context.isUnique(result.puzzle), 'Result must have exactly one solution');
  assert(result.puzzle.every((value, index) => !value || value === full[index]));
  assert.equal(runtime.node('#startDigging').disabled, false);
  assert.equal(runtime.node('#haltDigging').disabled, true);
  if (mode === 'dual') result.puzzle.forEach((value, index) => assert.equal(Boolean(value), Boolean(result.puzzle[143 - index])));
  return { puzzle: result.puzzle, checks, ms, yields: runtime.yields() };
}

const trials = Number(process.argv[2] ?? 5);
const target = process.argv[3] ?? '';
const firstSeed = Number(process.argv[4] ?? 1);
assert(Number.isInteger(trials) && trials > 0);
assert(Number.isInteger(firstSeed) && firstSeed > 0);
assert(target === '' || (Number.isInteger(Number(target)) && Number(target) >= 0 && Number(target) <= 126));
const rows = [];
for (let seed = firstSeed; seed < firstSeed + trials; seed++) {
  console.log(`Constructing completed grid for seed ${seed}...`);
  const full = [...setup(seed, 'single', current).context.makeFull()];
  for (const mode of ['single', 'dual']) {
    const results = {};
    // Alternate execution order to reduce systematic warm-up/order bias.
    for (const version of seed % 2 ? ['new', 'old'] : ['old', 'new']) {
      console.log(`Digging seed ${seed}, ${mode}, ${version}...`);
      results[version] = await run(seed + 1000, mode, version === 'old' ? legacy : current, full, { stopAt: target });
      console.log(`Finished ${version}: ${results[version].ms.toFixed(2)} ms, ${results[version].checks} checks.`);
    }
    assert.deepEqual(results.new.puzzle, results.old.puzzle, 'Old and new puzzles differ');
    if (target === '') assert.equal(results.new.checks, (mode === 'single' ? 126 : 63) + 1);
    else assert(results.new.puzzle.filter(Boolean).length >= Number(target));
    const row = { seed, mode, givens: results.new.puzzle.filter(Boolean).length,
      oldMs: +results.old.ms.toFixed(2), newMs: +results.new.ms.toFixed(2),
      oldChecks: results.old.checks, newChecks: results.new.checks };
    rows.push(row);
    console.log(JSON.stringify(row));
  }
  if (seed === firstSeed) {
    for (const mode of ['single', 'dual']) {
      for (const stopAt of ['126', '125', '100']) {
        const old = await run(2000, mode, legacy, full, { stopAt });
        const next = await run(2000, mode, current, full, { stopAt });
        assert.deepEqual(next.puzzle, old.puzzle);
        assert(next.puzzle.filter(Boolean).length >= Number(stopAt));
      }
      const halted = await run(2000, mode, current, full, { haltAfter: 3 });
      assert.equal(halted.yields, 3);
      // Expire the time cap at the loop boundary after the first attempt.
      let tick = 0;
      const capped = await run(2000, mode, current, full, { cap: '1', clock: { now: () => tick++ * 400 } });
      assert.equal(capped.yields, 1);
    }
    console.log('PASS: target-clue limits, halt, time cap, and button reset in both modes.');
  }
}
for (const mode of ['single', 'dual']) {
  const group = rows.filter(row => row.mode === mode);
  const mean = key => group.reduce((sum, row) => sum + row[key], 0) / group.length;
  console.log(JSON.stringify({ mode, trials, oldMeanMs: +mean('oldMs').toFixed(2), newMeanMs: +mean('newMs').toFixed(2),
    savingsPercent: +(100 * (1 - mean('newMs') / mean('oldMs'))).toFixed(1),
    oldMeanChecks: mean('oldChecks'), newMeanChecks: mean('newChecks') }));
}
console.log('PASS: all paired puzzles match exactly and have one solution. Timings exclude full-grid construction and UI timer delays.');
