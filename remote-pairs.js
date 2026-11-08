// Pure candidate search: uses actual Gattai peers, including shared cells.
function findRemotePairs(notes, peersFor) {
  const cells = Object.keys(notes).map(Number), groups = new Map();
  const peers = new Map(cells.map(index => [index, new Set(peersFor(index))]));
  for (const index of cells) {
    if (notes[index].size !== 2) continue;
    const key = [...notes[index]].sort((a, b) => a - b).join(',');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(index);
  }
  for (const [key, group] of groups) {
    if (group.length < 4) continue;
    const pair = key.split(',').map(Number);
    for (const start of group) {
      const paths = new Map([[start, [start]]]), queue = [start];
      for (let head = 0; head < queue.length; head += 1) {
        const end = queue[head], chain = paths.get(end);
        // An even number of bivalue cells forces opposite endpoint values.
        // Two cells are a naked pair, not a Remote Pairs chain.
        if (chain.length >= 4 && chain.length % 2 === 0) {
          const eliminations = cells.filter(index => !chain.includes(index) && peers.get(index).has(start) && peers.get(index).has(end))
            .flatMap(index => pair.filter(digit => notes[index].has(digit)).map(digit => ({ index, digit })));
          if (eliminations.length) return { pair, chain, eliminations };
        }
        for (const next of group) {
          if (paths.has(next) || !peers.get(end).has(next)) continue;
          paths.set(next, [...chain, next]);
          queue.push(next);
        }
      }
    }
  }
  return null;
}

if (typeof module !== 'undefined') module.exports = { findRemotePairs };
