// The ring and corner cells have equal digit multiplicities in each 9x9 grid.
// Bounds use only placed values and current candidates, never the solution.
function phistomefelRegions(offset = 0) {
  const cell = (r, c) => (r + offset) * 12 + c + offset;
  const ring = [], corners = [];
  for (let r = 0; r < 9; r += 1) for (let c = 0; c < 9; c += 1) {
    if (r >= 2 && r <= 6 && c >= 2 && c <= 6 && (r === 2 || r === 6 || c === 2 || c === 6)) ring.push(cell(r, c));
    if ((r < 2 || r > 6) && (c < 2 || c > 6)) corners.push(cell(r, c));
  }
  return { ring, corners };
}
function findPhistomefelRing(values, notes) {
  for (const offset of [0, 3]) {
    const regions = phistomefelRegions(offset);
    for (let digit = 1; digit <= 9; digit += 1) {
      const bounds = cells => {
        const fixed = cells.filter(index => values[index] === digit).length;
        const possible = cells.filter(index => !values[index] && notes[index]?.has(digit));
        const forced = possible.filter(index => notes[index].size === 1);
        return { min: fixed + forced.length, max: fixed + possible.length, possible };
      };
      const counts = { ring: bounds(regions.ring), corners: bounds(regions.corners) };
      for (const [target, source] of [['ring', 'corners'], ['corners', 'ring']]) {
        const a = counts[target], b = counts[source];
        // Inconsistent notes must not be used to manufacture a deduction.
        if (Math.max(a.min, b.min) > Math.min(a.max, b.max)) continue;
        let eliminations = [], kind;
        if (a.min === b.max) {
          kind = 'exclude';
          eliminations = a.possible.filter(index => notes[index].size > 1).map(index => ({ index, digit }));
        }
        if (!eliminations.length && a.max === b.min) {
          kind = 'force';
          eliminations = a.possible.flatMap(index => [...notes[index]].filter(other => other !== digit).map(other => ({ index, digit: other })));
        }
        if (eliminations.length) return { offset, digit, regions, counts, target, source, kind, eliminations };
      }
    }
  }
  return null;
}
if (typeof module !== 'undefined') module.exports = { phistomefelRegions, findPhistomefelRing };
