const dailyPuzzles = {
  monday: { date: "Monday, September 7, 2026", rows: ["78..1..3....", "...6........", "2.......6...", "5..1..47....", "......9.....", "49...7.6.8..", ".....5......", "1.73.....1..", "..5.....8.6.", "........9.3.", ".........61.", "............"] },
  tuesday: { date: "Tuesday, September 8, 2026", rows: [".2....6.....", "....2.31....", ".7..........", ".......5..6.", "..34....7...", ".4.6..9....7", "6.....8..6..", "...9.852...3", "4.........4.", "......689.5.", "............", "....3..1...2"] },
  wednesday: { date: "Wednesday, September 9, 2026", rows: ["...2.3......", ".7...45.9...", "............", ".4.596..2...", "1...4.......", ".8.7...3....", "..........82", "4..82..97...", "........4.9.", "............", ".......2..1.", "...9.4...3.."] },
  thursday: { date: "Thursday, September 10, 2026", rows: [".3..28......", "..5....7....", "2....3..1...", ".....23...6.", "...4....2...", ".........1..", ".4....9..7..", "............", "19.5.......9", "......65....", "....6....8.4", ".......9...7"] },
  friday: { date: "Friday, September 11, 2026", rows: ["5...2..8....", ".9..5..2....", "..27.6......", "9..5....3.1.", "7.4...9.....", ".....4.....2", ".1....8..6..", "...4..3.1.7.", "....69......", ".....1..7..4", ".....6.89...", "............"] },
  saturday: { date: "Saturday, September 12, 2026", rows: ["1..6.2..7...", "......1.....", ".9..73......", "..1..9..2...", ".....8.1.3..", "2.......9...", "..28....125.", "98..2.....6.", "..7....4....", ".....5..71..", "............", ".....2....95"] },
  sunday: { date: "Sunday, September 13, 2026", rows: ["......1.8...", "....26..4...", "7..15...2...", ".8..9.....8.", ".3....28.1..", "..4......9..", "..357.......", "....49.....1", ".2..........", "...7.....29.", "....3......7", ".....83....."] }
};
const previousWeekPuzzles = {
  monday: { date: "Monday, August 31, 2026", rows: ["..6.59......", "81.4........", "...8.2......", "......8.....", "...19....75.", "..8.......19", "..........9.", ".....5.792.3", "....7.......", "...73.....4.", "....526...38", ".......34..2"] },
  tuesday: { date: "Tuesday, September 1, 2026", rows: ["....23..7...", ".4.51.......", "8.2..4......", ".........3.9", "1..265......", ".5..........", "........4.1.", "....71.2.89.", "3...8.......", "......9...7.", ".........428", "...7.3.....5"] },
  wednesday: { date: "Wednesday, September 2, 2026", rows: ["......4.....", "...2.537....", "425..9......", "293.7....2..", "............", "....2..18...", "......53.9..", ".32..7...52.", "..6.........", "......82.47.", "............", ".....937..5."] },
  thursday: { date: "Thursday, September 3, 2026", rows: ["..5.9.......", ".7..5...4...", "4..1..3.....", ".......6..5.", ".832.4.....9", ".4..........", "..8..2..3...", "7...1..8..7.", "......2..5.1", "......6.8...", "...4.....8.2", "....2..5...."] },
  friday: { date: "Friday, September 4, 2026", rows: [".6....7.....", "83..7.2.6...", "1..4........", "...6......5.", "3.8...4.7...", "............", ".....8....2.", "7.6.3..5..1.", "..9......5..", "............", "......7896..", "....2..46..3"] },
  saturday: { date: "Saturday, September 5, 2026", rows: ["...375......", ".8...1......", "3..2....6...", ".72.9.......", "..3.2.1.....", ".......7.9..", "6....3..1...", "...4...9.3.8", ".........2.4", ".....8.5....", "......3.7.9.", "......2...5."] },
  sunday: { date: "Sunday, September 6, 2026", rows: ["8...25......", "..5...3.....", ".7..84......", ".....85...6.", "..263.4.....", ".48.......9.", "....6..3...9", "..7.........", "...8....6.3.", "....2.74....", "........1.53", "....1...284."] }
};
const puzzles = { ...dailyPuzzles, unlimited: { date: "Unlimited", rows: Array(12).fill("............") } };
let activeWeek = "current", activeDay = "tuesday", rows = dailyPuzzles.tuesday.rows, puzzleDate = dailyPuzzles.tuesday.date;
const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const techniqueScores = { "Full House": 4, "Naked Single": 4, "Hidden Single": 14, "Locked Pair": 40, "Locked Triple": 60, "Pointing": 50, "Claiming": 50, "Naked Pair": 60, "Naked Triple": 80, "Hidden Pair": 70, "Hidden Triple": 100, "Naked Quad": 120, "Hidden Quad": 150, "X-Wing": 140, "XY-Wing": 160 };
const techniqueLevels = { "Full House": "Beginner", "Naked Single": "Beginner", "Hidden Single": "Beginner", "Locked Pair": "Medium", "Locked Triple": "Medium", "Pointing": "Medium", "Claiming": "Medium", "Naked Pair": "Medium", "Naked Triple": "Medium", "Hidden Pair": "Medium", "Hidden Triple": "Medium", "Naked Quad": "Hard", "Hidden Quad": "Hard", "X-Wing": "Hard", "XY-Wing": "Tricky" };
const levelOrder = ["Beginner", "Easy", "Medium", "Tricky", "Hard", "Unfair", "Extreme", "Nightmare"];
function rateSteps(solveSteps) { const score = solveSteps.reduce((total, step) => total + (techniqueScores[step.technique] || 0), 0); let rating = score <= 400 ? "Beginner" : score <= 800 ? "Easy" : score <= 1000 ? "Medium" : score <= 1150 ? "Tricky" : score <= 1600 ? "Hard" : score <= 1800 ? "Unfair" : score <= 3000 ? "Extreme" : "Nightmare"; solveSteps.forEach(step => { const techniqueLevel = techniqueLevels[step.technique] || "Nightmare"; if (levelOrder.indexOf(techniqueLevel) > levelOrder.indexOf(rating)) rating = techniqueLevel; }); return { score, rating }; }
const units = [];
for (const [name, rowOffset, columnOffset] of [["G1", 0, 0], ["G2", 3, 3]]) {
  for (let n = 0; n < 9; n += 1) {
    units.push([`${name} row ${n + 1}`, Array.from({ length: 9 }, (_, c) => (rowOffset + n) * 12 + columnOffset + c)]);
    units.push([`${name} column ${n + 1}`, Array.from({ length: 9 }, (_, r) => (rowOffset + r) * 12 + columnOffset + n)]);
  }
  for (let boxRow = 0; boxRow < 3; boxRow += 1) for (let boxColumn = 0; boxColumn < 3; boxColumn += 1) units.push([`${name} box ${boxRow + 1},${boxColumn + 1}`, Array.from({ length: 9 }, (_, n) => (rowOffset + boxRow * 3 + Math.floor(n / 3)) * 12 + columnOffset + boxColumn * 3 + (n % 3))]);
}
const active = [...new Set(units.flatMap(([, house]) => house))];
const housesFor = Object.fromEntries(active.map(index => [index, units.filter(([, house]) => house.includes(index)).map(([, house]) => house)]));
const peers = Object.fromEntries(active.map(index => [index, new Set(housesFor[index].flat().filter(other => other !== index))]));
const board = document.querySelector("#board"), guide = document.querySelector("#guide"), givenCount = document.querySelector("#givenCount"), solutionToggle = document.querySelector("#solutionToggle"), boardCard = document.querySelector("#boardCard");
const blankNotes = () => Array.from({ length: 144 }, () => new Set());
const blankColors = () => Array(144).fill("");
const userInputs = { monday: Array(144).fill(0), tuesday: Array(144).fill(0), wednesday: Array(144).fill(0), thursday: Array(144).fill(0), friday: Array(144).fill(0), saturday: Array(144).fill(0), sunday: Array(144).fill(0), unlimited: Array(144).fill(0) };
const userNotes = { monday: blankNotes(), tuesday: blankNotes(), wednesday: blankNotes(), thursday: blankNotes(), friday: blankNotes(), saturday: blankNotes(), sunday: blankNotes(), unlimited: blankNotes() };
const userColors = { monday: blankColors(), tuesday: blankColors(), wednesday: blankColors(), thursday: blankColors(), friday: blankColors(), saturday: blankColors(), sunday: blankColors(), unlimited: blankColors() };
const histories = { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [], unlimited: [] }, redoHistories = { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [], unlimited: [] };
const original = Array(144).fill(0); let human = userInputs.tuesday, playNotes = userNotes.tuesday, playColors = userColors.tuesday, sharedHighlight = true, autoMarkConflicts = true, difficultyVisible = true, givenCountVisible = true;
function stateKey(day = activeDay) { return day === "unlimited" ? day : `${activeWeek}:${day}`; }
function ensureState(key) {
  if (userInputs[key]) return;
  userInputs[key] = Array(144).fill(0); userNotes[key] = blankNotes(); userColors[key] = blankColors(); histories[key] = []; redoHistories[key] = [];
}
rows.forEach((row, r) => [...row].forEach((value, c) => { if (value !== ".") original[r * 12 + c] = Number(value); }));
function hasCell(row, column) { return (row >= 0 && row < 9 && column >= 0 && column < 9) || (row >= 3 && row < 12 && column >= 3 && column < 12); }
function nameFor(index, preferredGrid = "") { const row = Math.floor(index / 12), column = index % 12, names = []; if (row < 9 && column < 9 && preferredGrid !== "G2") names.push(`G1 R${row + 1}C${column + 1}`); if (row >= 3 && column >= 3 && preferredGrid !== "G1") names.push(`G2 R${row - 2}C${column - 2}`); return names.join(" / "); }
function candidates(values, index) { return digits.filter(digit => ![...peers[index]].some(peer => values[peer] === digit)); }
function shuffle(items) { const result = [...items]; for (let index = result.length - 1; index > 0; index -= 1) { const pick = Math.floor(Math.random() * (index + 1)); [result[index], result[pick]] = [result[pick], result[index]]; } return result; }
function solveNine(givens) {
  const values = [...givens];
  function options(index) { const row = Math.floor(index / 9), column = index % 9, boxRow = Math.floor(row / 3) * 3, boxColumn = Math.floor(column / 3) * 3, used = new Set(); for (let n = 0; n < 9; n += 1) { used.add(values[row * 9 + n]); used.add(values[n * 9 + column]); } for (let rowOffset = 0; rowOffset < 3; rowOffset += 1) for (let columnOffset = 0; columnOffset < 3; columnOffset += 1) used.add(values[(boxRow + rowOffset) * 9 + boxColumn + columnOffset]); return shuffle(digits.filter(digit => !used.has(digit))); }
  function search() { let choice = -1, choices = null; for (let index = 0; index < 81; index += 1) if (!values[index]) { const possible = options(index); if (!possible.length) return false; if (!choices || possible.length < choices.length) { choice = index; choices = possible; } } if (choice === -1) return true; for (const digit of choices) { values[choice] = digit; if (search()) return true; } values[choice] = 0; return false; }
  return search() ? values : null;
}
function makeFullGattai() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const first = solveNine(Array(81).fill(0)); if (!first) continue;
    const secondGivens = Array(81).fill(0);
    for (let row = 0; row < 6; row += 1) for (let column = 0; column < 6; column += 1) secondGivens[row * 9 + column] = first[(row + 3) * 9 + column + 3];
    const second = solveNine(secondGivens); if (!second) continue;
    const full = Array(144).fill(0);
    for (let row = 0; row < 9; row += 1) for (let column = 0; column < 9; column += 1) full[row * 12 + column] = first[row * 9 + column];
    for (let row = 0; row < 9; row += 1) for (let column = 0; column < 9; column += 1) full[(row + 3) * 12 + column + 3] = second[row * 9 + column];
    return full;
  }
  throw new Error("Unable to construct a compatible Gattai grid.");
}
function countGattaiSolutions(givens, limit = 2) {
  const values = [...givens];
  function search() { let choice = -1, choices = null; for (const index of active) if (!values[index]) { const possible = candidates(values, index); if (!possible.length) return 0; if (!choices || possible.length < choices.length) { choice = index; choices = possible; } } if (choice === -1) return 1; let total = 0; for (const digit of choices) { values[choice] = digit; total += search(); values[choice] = 0; if (total >= limit) return total; } return total; }
  return search();
}
const rowsFromBoard = boardValues => Array.from({ length: 12 }, (_, row) => Array.from({ length: 12 }, (_, column) => boardValues[row * 12 + column] || ".").join(""));
function choose(items, size) { if (size === 0) return [[]]; if (items.length < size) return []; return choose(items.slice(1), size - 1).map(group => [items[0], ...group]).concat(choose(items.slice(1), size)); }
function deriveSteps(preferAdvanced = false) {
  const values = [...original], found = [], notes = Object.fromEntries(active.filter(index => !values[index]).map(index => [index, new Set(candidates(values, index))]));
  const subsetName = size => ({ 2: "Pair", 3: "Triple", 4: "Quad" }[size]);
  const snapshotNotes = () => Object.fromEntries(Object.entries(notes).map(([index, note]) => [index, [...note]]));
  function addStep(step, beforeNotes, eliminations = []) { found.push({ ...step, beforeNotes, eliminations }); }
  function place(technique, index, digit, house, text) {
    const beforeNotes = snapshotNotes(), eliminations = [...peers[index]].filter(peer => notes[peer]?.has(digit)).map(peer => ({ index: peer, digit }));
    values[index] = digit; delete notes[index]; peers[index].forEach(peer => notes[peer]?.delete(digit));
    addStep({ technique, index, digit, house, text: text || `${nameFor(index, house ? house.split(" ")[0] : "")} = ${digit}.${house ? ` It is the only possible location in ${house}.` : ""}` }, beforeNotes, eliminations);
  }
  function nakedSubset(size) { for (const [houseName, house] of units) { const blanks = house.filter(index => notes[index]); for (const group of choose(blanks, size)) { const union = new Set(group.flatMap(index => [...notes[index]])); if (union.size !== size || group.some(index => notes[index].size < 2 || notes[index].size > size)) continue; const victims = blanks.filter(index => !group.includes(index) && [...notes[index]].some(digit => union.has(digit))); if (!victims.length) continue; const beforeNotes = snapshotNotes(), eliminations = victims.flatMap(index => [...union].filter(digit => notes[index].has(digit)).map(digit => ({ index, digit }))), emphasis = group.flatMap(index => [...notes[index]].filter(digit => union.has(digit)).map(digit => ({ index, digit }))); victims.forEach(index => union.forEach(digit => notes[index].delete(digit))); const technique = `Naked ${subsetName(size)}`; addStep({ technique, index: null, digit: null, house: houseName, emphasis, text: `${[...union].join(", ")} are confined to ${group.map(index => nameFor(index, houseName.split(" ")[0])).join(" and ")} in ${houseName}. Remove them from ${victims.map(index => nameFor(index, houseName.split(" ")[0])).join(", ")}.` }, beforeNotes, eliminations); return true; } } return false; }
  function hiddenSubset(size) { for (const [houseName, house] of units) { const blanks = house.filter(index => notes[index]), missing = digits.filter(digit => !house.some(index => values[index] === digit)); for (const group of choose(missing, size)) { const cells = [...new Set(group.flatMap(digit => blanks.filter(index => notes[index].has(digit))))]; if (cells.length !== size) continue; const beforeNotes = snapshotNotes(), eliminations = cells.flatMap(index => [...notes[index]].filter(digit => !group.includes(digit)).map(digit => ({ index, digit }))); if (!eliminations.length) continue; const emphasis = cells.flatMap(index => group.filter(digit => notes[index].has(digit)).map(digit => ({ index, digit }))); cells.forEach(index => { notes[index] = new Set([...notes[index]].filter(digit => group.includes(digit))); }); const technique = `Hidden ${subsetName(size)}`; addStep({ technique, index: null, digit: null, house: houseName, emphasis, text: `${group.join(", ")} can appear only in ${cells.map(index => nameFor(index, houseName.split(" ")[0])).join(" and ")} in ${houseName}. Remove every other candidate from those cells.` }, beforeNotes, eliminations); return true; } } return false; }
  // Keep the two intersection directions separate: a pair is easier to spot
  // than a claiming pattern, while pointing remains the first intersection.
  function lockedCandidates(kind) {
    for (const [grid, rowOffset, columnOffset] of [["G1", 0, 0], ["G2", 3, 3]]) {
      if (kind !== "claiming") for (let boxRow = 0; boxRow < 3; boxRow += 1) for (let boxColumn = 0; boxColumn < 3; boxColumn += 1) {
        const box = units.find(([label]) => label === `${grid} box ${boxRow + 1},${boxColumn + 1}`)[1];
        for (const digit of digits) {
          const positions = box.filter(index => notes[index]?.has(digit));
          if (positions.length < 2) continue;
          const localRows = [...new Set(positions.map(index => Math.floor(index / 12) - rowOffset))], localColumns = [...new Set(positions.map(index => index % 12 - columnOffset))];
          if (localRows.length === 1) {
            const rowHouse = units.find(([label]) => label === `${grid} row ${localRows[0] + 1}`)[1], victims = rowHouse.filter(index => !box.includes(index) && notes[index]?.has(digit));
            if (victims.length) { const beforeNotes = snapshotNotes(), eliminations = victims.map(index => ({ index, digit })); victims.forEach(index => notes[index].delete(digit)); addStep({ technique: "Pointing", index: null, digit: null, house: `${grid} box ${boxRow + 1},${boxColumn + 1}`, highlight: [...positions, ...victims], text: `In ${grid} box ${boxRow + 1},${boxColumn + 1}, candidate ${digit} is confined to row ${localRows[0] + 1}. Remove it from the other cells in that row.` }, beforeNotes, eliminations); return true; }
          }
          if (localColumns.length === 1) {
            const columnHouse = units.find(([label]) => label === `${grid} column ${localColumns[0] + 1}`)[1], victims = columnHouse.filter(index => !box.includes(index) && notes[index]?.has(digit));
            if (victims.length) { const beforeNotes = snapshotNotes(), eliminations = victims.map(index => ({ index, digit })); victims.forEach(index => notes[index].delete(digit)); addStep({ technique: "Pointing", index: null, digit: null, house: `${grid} box ${boxRow + 1},${boxColumn + 1}`, highlight: [...positions, ...victims], text: `In ${grid} box ${boxRow + 1},${boxColumn + 1}, candidate ${digit} is confined to column ${localColumns[0] + 1}. Remove it from the other cells in that column.` }, beforeNotes, eliminations); return true; }
          }
        }
      }
      if (kind !== "pointing") for (let localRow = 0; localRow < 9; localRow += 1) for (const digit of digits) {
        const rowHouse = units.find(([label]) => label === `${grid} row ${localRow + 1}`)[1], positions = rowHouse.filter(index => notes[index]?.has(digit));
        if (positions.length < 2) continue;
        const boxColumns = [...new Set(positions.map(index => Math.floor((index % 12 - columnOffset) / 3)))], boxRows = [...new Set(positions.map(index => Math.floor((Math.floor(index / 12) - rowOffset) / 3)))];
        if (boxColumns.length !== 1 || boxRows.length !== 1) continue;
        const box = units.find(([label]) => label === `${grid} box ${boxRows[0] + 1},${boxColumns[0] + 1}`)[1], victims = box.filter(index => !rowHouse.includes(index) && notes[index]?.has(digit));
        if (victims.length) { const beforeNotes = snapshotNotes(), eliminations = victims.map(index => ({ index, digit })); victims.forEach(index => notes[index].delete(digit)); addStep({ technique: "Claiming", index: null, digit: null, house: `${grid} row ${localRow + 1}`, highlight: [...positions, ...victims], text: `In ${grid} row ${localRow + 1}, candidate ${digit} is confined to one box. Remove it from the other cells in that box.` }, beforeNotes, eliminations); return true; }
      }
    }
    return false;
  }
  function xyWing() {
    for (const pivot of active) {
      if (!notes[pivot] || notes[pivot].size !== 2) continue;
      const [first, second] = [...notes[pivot]].sort((a, b) => a - b);
      for (const [pivotDigit, otherDigit] of [[first, second], [second, first]]) {
        const firstWings = [...peers[pivot]].filter(index => notes[index]?.size === 2 && notes[index].has(pivotDigit));
        for (const wingA of firstWings) {
          const shared = [...notes[wingA]].find(digit => digit !== pivotDigit);
          if (!shared) continue;
          for (const wingB of peers[pivot]) {
            if (wingB === wingA || notes[wingB]?.size !== 2 || !notes[wingB].has(otherDigit) || !notes[wingB].has(shared)) continue;
            const victims = active.filter(index => index !== pivot && index !== wingA && index !== wingB && notes[index]?.has(shared) && peers[index].has(wingA) && peers[index].has(wingB));
            if (!victims.length) continue;
            const beforeNotes = snapshotNotes(), eliminations = victims.map(index => ({ index, digit: shared }));
            victims.forEach(index => notes[index].delete(shared));
            addStep({ technique: "XY-Wing", index: null, digit: null, house: "", highlight: [pivot, wingA, wingB, ...victims], text: `${nameFor(pivot)} is the ${pivotDigit}/${otherDigit} pivot. Its ${pivotDigit}/${shared} and ${otherDigit}/${shared} wings force ${shared} into one wing, so remove ${shared} from cells that see both wings.` }, beforeNotes, eliminations);
            return true;
          }
        }
      }
    }
    return false;
  }
  function basicFish() {
    for (const [grid, rowOffset, columnOffset] of [["G1", 0, 0], ["G2", 3, 3]]) for (const digit of digits) {
      const rowPatterns = [];
      for (let localRow = 0; localRow < 9; localRow += 1) { const columns = digits.map(value => value - 1).filter(localColumn => { const index = (rowOffset + localRow) * 12 + columnOffset + localColumn; return notes[index]?.has(digit); }); if (columns.length === 2) rowPatterns.push([localRow, columns]); }
      for (const [rowA, columnsA] of rowPatterns) for (const [rowB, columnsB] of rowPatterns) {
        if (rowA >= rowB || columnsA.join(",") !== columnsB.join(",")) continue;
        const victims = digits.map(value => value - 1).filter(localRow => ![rowA, rowB].includes(localRow)).flatMap(localRow => columnsA.map(localColumn => (rowOffset + localRow) * 12 + columnOffset + localColumn).filter(index => notes[index]?.has(digit)));
        if (!victims.length) continue;
        const beforeNotes = snapshotNotes(), eliminations = victims.map(index => ({ index, digit }));
        victims.forEach(index => notes[index].delete(digit)); const corners = [rowA, rowB].flatMap(localRow => columnsA.map(localColumn => (rowOffset + localRow) * 12 + columnOffset + localColumn));
        addStep({ technique: "X-Wing", index: null, digit: null, house: "", highlight: [...corners, ...victims], text: `In ${grid}, candidate ${digit} occupies the same two columns in rows ${rowA + 1} and ${rowB + 1}. Those four corners form an X-Wing, so remove ${digit} from ${victims.map(index => nameFor(index, grid)).join(", ")}.` }, beforeNotes, eliminations); return true;
      }
      const columnPatterns = [];
      for (let localColumn = 0; localColumn < 9; localColumn += 1) { const rowsForDigit = digits.map(value => value - 1).filter(localRow => { const index = (rowOffset + localRow) * 12 + columnOffset + localColumn; return notes[index]?.has(digit); }); if (rowsForDigit.length === 2) columnPatterns.push([localColumn, rowsForDigit]); }
      for (const [columnA, rowsA] of columnPatterns) for (const [columnB, rowsB] of columnPatterns) {
        if (columnA >= columnB || rowsA.join(",") !== rowsB.join(",")) continue;
        const victims = rowsA.flatMap(localRow => digits.map(value => value - 1).filter(localColumn => ![columnA, columnB].includes(localColumn)).map(localColumn => (rowOffset + localRow) * 12 + columnOffset + localColumn).filter(index => notes[index]?.has(digit)));
        if (!victims.length) continue;
        const beforeNotes = snapshotNotes(), eliminations = victims.map(index => ({ index, digit }));
        victims.forEach(index => notes[index].delete(digit)); const corners = rowsA.flatMap(localRow => [columnA, columnB].map(localColumn => (rowOffset + localRow) * 12 + columnOffset + localColumn));
        addStep({ technique: "X-Wing", index: null, digit: null, house: "", highlight: [...corners, ...victims], text: `In ${grid}, candidate ${digit} occupies the same two rows in columns ${columnA + 1} and ${columnB + 1}. Those four corners form an X-Wing, so remove ${digit} from ${victims.map(index => nameFor(index, grid)).join(", ")}.` }, beforeNotes, eliminations); return true;
      }
    }
    return false;
  }
  while (true) {
    let move = null;
    for (const [label, house] of units) { const blanks = house.filter(index => !values[index]), missing = digits.filter(digit => !house.some(index => values[index] === digit)); if (blanks.length === 1 && missing.length === 1) { move = ["Full House", blanks[0], missing[0], label]; break; } }
    if (!move) for (const index of active) if (!values[index] && notes[index].size === 1) { move = ["Naked Single", index, [...notes[index]][0], ""]; break; }
    if (!move) for (const [label, house] of units) { for (const digit of digits) { if (house.some(index => values[index] === digit)) continue; const places = house.filter(index => !values[index] && notes[index].has(digit)); if (places.length === 1) { move = ["Hidden Single", places[0], digit, label]; break; } } if (move) break; }
    if (move) { place(...move); continue; }
    // The walkthrough is deliberately ordered by human solving cost.  After every
    // deduction it restarts at Singles, then tries the simplest available
    // intersection/subset pattern before Fish and Wings. A Naked/Hidden Pair is
    // deliberately checked ahead of both pointing and claiming.
    if (nakedSubset(2) || hiddenSubset(2)) continue;
    if (lockedCandidates("pointing")) continue;
    if (lockedCandidates("claiming")) continue;
    if ([3, 4].some(size => nakedSubset(size) || hiddenSubset(size))) continue;
    if (basicFish()) continue;
    if (xyWing()) continue;
    return found;
  }
}
let steps = deriveSteps(), mode = "human", stepIndex = 0, selectedCell = null, entryMode = "digit", unlimitedSolution = null, unlimitedGenerationMilliseconds = 0, unlimitedRated = false;
function isUnlimited() { return activeDay === "unlimited"; }
function currentValues() { const values = [...original]; if (mode === "human") human.forEach((value, index) => { if (value) values[index] = value; }); else if (isUnlimited() && unlimitedSolution) return [...unlimitedSolution]; else steps.slice(0, stepIndex + 1).forEach(step => { if (step.index !== null) values[step.index] = step.digit; }); return values; }
function drawBoardBoundaries() {
  const lines = [
    ["horizontal", "h-0"], ["horizontal", "h-3"], ["horizontal", "h-6"], ["horizontal", "h-9"], ["horizontal", "h-12"],
    ["vertical", "v-0"], ["vertical", "v-3"], ["vertical", "v-6"], ["vertical", "v-9"], ["vertical", "v-12"]
  ];
  lines.forEach(([direction, position]) => { const line = document.createElement("span"); line.className = `board-boundary ${direction} ${position}`; board.append(line); });
}
function makeCandidates(noteDigits, index, eliminations = [], emphasis = []) {
  const notation = document.createElement("span"); notation.className = "snyder";
  const removed = new Set(eliminations.filter(item => item.index === index).map(item => item.digit));
  const highlighted = new Set(emphasis.filter(item => item.index === index).map(item => item.digit));
  [...new Set([...noteDigits, ...removed])].sort((a, b) => a - b).forEach(digit => { const mark = document.createElement("i"); mark.className = `candidate-${digit}${removed.has(digit) ? " eliminated" : ""}${highlighted.has(digit) ? " emphasized" : ""}`; mark.textContent = digit; notation.append(mark); });
  return notation;
}
function makeUserCandidates(index) { const notation = document.createElement("span"), clashes = new Set([...playNotes[index]].filter(digit => [...peers[index]].some(peer => (original[peer] || human[peer]) === digit))); notation.className = "snyder"; playNotes[index].forEach(digit => { const mark = document.createElement("i"); mark.className = `candidate-${digit}${autoMarkConflicts && clashes.has(digit) ? " candidate-conflict" : ""}`; mark.textContent = digit; notation.append(mark); }); return notation; }
function stateSnapshot() { return { values: [...human], notes: playNotes.map(note => [...note]), colors: [...playColors] }; }
function restoreState(state) { human.splice(0, human.length, ...state.values); state.notes.forEach((note, index) => { playNotes[index].clear(); note.forEach(digit => playNotes[index].add(digit)); }); playColors.splice(0, playColors.length, ...state.colors); }
function snapshot() { const key = stateKey(); histories[key].push(stateSnapshot()); redoHistories[key].length = 0; }
function updateEntryControls() { const key = stateKey(), editableSelected = selectedCell !== null && !original[selectedCell]; document.querySelectorAll(".entry-button").forEach(button => { button.setAttribute("aria-pressed", String(button.dataset.entry === entryMode)); button.disabled = mode !== "human"; }); document.querySelectorAll(".numpad button, .color-button").forEach(button => button.disabled = mode !== "human" || !editableSelected); document.querySelector("#undoMove").disabled = mode !== "human" || !histories[key].length; document.querySelector("#redoMove").disabled = mode !== "human" || !redoHistories[key].length; document.querySelector("#resetGrid").disabled = mode !== "human"; }
function applyEntry(digit, index = selectedCell) {
  if (mode !== "human" || index === null || original[index]) return;
  snapshot();
  if (entryMode === "snyder" && !human[index]) { if (digit === 0) playNotes[index].clear(); else if (playNotes[index].has(digit)) playNotes[index].delete(digit); else playNotes[index].add(digit); }
  else { human[index] = digit; if (digit) playNotes[index].clear(); else playNotes[index].clear(); }
  refresh();
}
function eraseSelected() {
  if (mode !== "human" || selectedCell === null || original[selectedCell]) return;
  snapshot(); human[selectedCell] = 0; playNotes[selectedCell].clear(); refresh();
}
function applyCellColor(color) { if (mode !== "human" || selectedCell === null || original[selectedCell]) return; snapshot(); playColors[selectedCell] = color; refresh(); }
function undoMove() {
  const key = stateKey(), previous = histories[key].pop(); if (!previous) return;
  redoHistories[key].push(stateSnapshot()); restoreState(previous); refresh();
}
function redoMove() { const key = stateKey(), next = redoHistories[key].pop(); if (!next) return; histories[key].push(stateSnapshot()); restoreState(next); refresh(); }
function makeSelectable(cell, index) { cell.addEventListener("click", event => { event.preventDefault(); selectedCell = selectedCell === index ? null : index; board.querySelectorAll(".cell").forEach(item => item.classList.toggle("selected", Number(item.dataset.index) === selectedCell)); if (selectedCell !== null) cell.focus({ preventScroll: true }); updateEntryControls(); }); }
function makeEditable(cell, index) {
  cell.classList.add("editable"); cell.tabIndex = 0; cell.contentEditable = "true"; cell.setAttribute("inputmode", "numeric"); cell.setAttribute("aria-label", `${nameFor(index)}, enter or delete a digit`); makeSelectable(cell, index);
  cell.addEventListener("keydown", event => {
    if (event.key === "Backspace" || event.key === "Delete" || event.key === "0") { event.preventDefault(); applyEntry(0, index); return; }
    if (/^[1-9]$/.test(event.key)) { event.preventDefault(); applyEntry(Number(event.key), index); }
  });
  cell.addEventListener("beforeinput", event => {
    if (event.inputType.startsWith("delete")) { event.preventDefault(); applyEntry(0, index); return; }
    const digit = event.data?.match(/[1-9]/)?.[0];
    if (digit) { event.preventDefault(); applyEntry(Number(digit), index); }
  });
  cell.addEventListener("input", () => { const digit = cell.textContent.match(/[1-9]/)?.[0]; if (digit) applyEntry(Number(digit), index); else applyEntry(0, index); });
  cell.addEventListener("paste", event => { event.preventDefault(); const digit = event.clipboardData.getData("text").match(/[1-9]/)?.[0]; if (digit) applyEntry(Number(digit), index); });
}
function renderStep() {
  if (isUnlimited()) return;
  const step = steps[stepIndex], grouped = steps.reduce((groups, item, index) => { (groups[item.technique] ||= []).push(index + 1); return groups; }, {}), tallyList = document.querySelector("#techniqueTallyList"), table = document.createElement("table"), header = document.createElement("thead"), body = document.createElement("tbody");
  document.querySelector("#stepCount").textContent = `Step ${stepIndex + 1} of ${steps.length}`;
  document.querySelector("#stepTechnique").textContent = step.technique;
  const grid = step.house?.startsWith("G2") || (!step.house && /\bG2\b/.test(step.text)) ? 2 : 1;
  const plainText = step.text.replace(/In G[12],\s*/g, "").replace(/\bG[12]\s+/g, "");
  document.querySelector("#stepReasoning").textContent = `Grid ${grid}: ${plainText}`;
  header.innerHTML = "<tr><th>Technique</th><th>Steps</th></tr>";
  Object.entries(grouped).sort(([left], [right]) => (levelOrder.indexOf(techniqueLevels[left] || "Nightmare") - levelOrder.indexOf(techniqueLevels[right] || "Nightmare")) || (techniqueScores[left] || 0) - (techniqueScores[right] || 0) || left.localeCompare(right)).forEach(([technique, stepNumbers]) => { const row = document.createElement("tr"), name = document.createElement("th"), details = document.createElement("td"); name.scope = "row"; name.textContent = technique; details.textContent = stepNumbers.join(", "); row.append(name, details); body.append(row); });
  table.append(header, body); tallyList.replaceChildren(table);
  document.querySelector("#firstStep").disabled = stepIndex === 0; document.querySelector("#previousStep").disabled = stepIndex === 0; document.querySelector("#nextStep").disabled = stepIndex === steps.length - 1; document.querySelector("#lastStep").disabled = stepIndex === steps.length - 1;
}
function renderBoard() {
  const values = currentValues(), activeStep = mode === "solver" && !isUnlimited() ? steps[stepIndex] : null, activeHouse = activeStep?.house || "", highlighted = activeStep?.highlight || (activeHouse ? units.find(([label]) => label === activeHouse)?.[1] || [] : []), solverNotes = activeStep?.beforeNotes || {};
  board.innerHTML = "";
  for (let row = 0; row < 12; row += 1) for (let column = 0; column < 12; column += 1) {
    if (!hasCell(row, column)) continue;
    const index = row * 12 + column, cell = document.createElement("div"); cell.className = "cell"; cell.dataset.index = index; cell.style.gridColumnStart = column + 1; cell.style.gridRowStart = row + 1;
    if (sharedHighlight && row >= 3 && column >= 3 && row < 9 && column < 9) cell.classList.add("shared"); if (playColors[index]) cell.classList.add(`user-color-${playColors[index]}`); if (original[index]) cell.classList.add("given"); if (autoMarkConflicts && mode === "human" && human[index] && [...peers[index]].some(peer => values[peer] === human[index])) cell.classList.add("conflict"); if (highlighted.includes(index)) cell.classList.add("affected-house"); if (activeStep?.index === index) cell.classList.add("focus"); if (index === selectedCell) cell.classList.add("selected");
    if (values[index]) { cell.textContent = values[index]; if (mode === "human" && !original[index]) makeEditable(cell, index); else makeSelectable(cell, index); } else if (mode === "solver") { cell.append(makeCandidates(solverNotes[index] || candidates(values, index), index, activeStep?.eliminations || [], activeStep?.emphasis || [])); makeSelectable(cell, index); } else { if (playNotes[index].size) cell.append(makeUserCandidates(index)); makeEditable(cell, index); }
    board.append(cell);
  }
  drawBoardBoundaries();
}
function refresh() { renderStep(); renderBoard(); const givens = original.filter((value, index) => active.includes(index) && value).length, rating = rateSteps(steps), showingSolution = mode === "solver", unlimited = isUnlimited(); givenCount.textContent = unlimited ? `${givens} given cells · generated in ${(unlimitedGenerationMilliseconds / 1000).toFixed(2)} s` : `${givens} given cells`; document.querySelector("#puzzleDate").textContent = puzzleDate; document.querySelector("#difficultyLabel").textContent = unlimited && !unlimitedRated ? "Difficulty: Unrated (unique-only)" : `Difficulty: ${rating.rating} (${rating.score})`; document.querySelector("#difficultyLabel").classList.toggle("is-hidden", !difficultyVisible); givenCount.classList.toggle("is-hidden", !givenCountVisible); solutionToggle.setAttribute("aria-pressed", String(showingSolution)); solutionToggle.textContent = unlimited ? (showingSolution ? "Hide final grid" : "Show final grid") : (showingSolution ? "Hide solution" : "Read solution"); guide.classList.toggle("hidden", mode === "human" || unlimited); boardCard.classList.toggle("solver-active", showingSolution); updateEntryControls(); setTimerRunning(mode === "human"); }
function loadPuzzle(day) { activeDay = day; const selectedWeek = activeWeek === "previous" ? previousWeekPuzzles : dailyPuzzles, selectedPuzzle = (day === "unlimited" ? puzzles : selectedWeek)[day]; rows = selectedPuzzle.rows; puzzleDate = selectedPuzzle.date; original.fill(0); rows.forEach((row, r) => [...row].forEach((value, c) => { if (value !== ".") original[r * 12 + c] = Number(value); })); const key = stateKey(); ensureState(key); human = userInputs[key]; playNotes = userNotes[key]; playColors = userColors[key]; selectedCell = null; steps = deriveSteps(["friday", "saturday", "sunday"].includes(day)); const walked = [...original]; steps.forEach(step => { if (step.index !== null) walked[step.index] = step.digit; }); unlimitedRated = day === "unlimited" && active.every(index => walked[index]); stepIndex = 0; document.querySelector("#unlimitedMode").classList.toggle("active", day === "unlimited"); refresh(); }
const archiveEntries = [
  ["previous", "monday", 2026, 8, 31], ["previous", "tuesday", 2026, 9, 1], ["previous", "wednesday", 2026, 9, 2], ["previous", "thursday", 2026, 9, 3], ["previous", "friday", 2026, 9, 4], ["previous", "saturday", 2026, 9, 5], ["previous", "sunday", 2026, 9, 6],
  ["current", "monday", 2026, 9, 7], ["current", "tuesday", 2026, 9, 8], ["current", "wednesday", 2026, 9, 9], ["current", "thursday", 2026, 9, 10], ["current", "friday", 2026, 9, 11], ["current", "saturday", 2026, 9, 12], ["current", "sunday", 2026, 9, 13]
].map(([week, day, year, month, date]) => ({ week, day, year, month, date }));
const archiveKey = (year, month, date) => `${year}-${month}-${date}`;
const archiveByDate = new Map(archiveEntries.map(entry => [archiveKey(entry.year, entry.month, entry.date), entry]));
function renderArchiveCalendar() {
  const calendar = document.querySelector("#archiveCalendar");
  calendar.replaceChildren();
  for (let offset = 0; offset < 35; offset += 1) {
    const date = new Date(2026, 7, 31 + offset), year = date.getFullYear(), month = date.getMonth() + 1, day = date.getDate(), entry = archiveByDate.get(archiveKey(year, month, day));
    if (!entry) { const blank = document.createElement("span"); blank.textContent = day; if (month !== 9) blank.classList.add("outside"); calendar.append(blank); continue; }
    const button = document.createElement("button");
    button.type = "button"; button.textContent = day; button.title = (entry.week === "previous" ? previousWeekPuzzles : dailyPuzzles)[entry.day].date;
    if (entry.week === activeWeek && entry.day === activeDay) button.classList.add("is-current");
    button.addEventListener("click", () => { activeWeek = entry.week; mode = "human"; loadPuzzle(entry.day); document.querySelector("#archiveDialog").close(); });
    calendar.append(button);
  }
}
async function generateUnlimitedPuzzle() {
  const button = document.querySelector("#unlimitedMode"), title = button.querySelector("strong"), detail = button.querySelector("small"), started = performance.now();
  button.disabled = true; title.textContent = "Generating…"; detail.textContent = "Digging for uniqueness";
  await new Promise(resolve => setTimeout(resolve, 20));
  try {
    const full = makeFullGattai(), puzzle = [...full]; let changed = true;
    while (changed) {
      changed = false;
      for (const cell of shuffle(active.filter(index => puzzle[index]))) {
        const value = puzzle[cell]; puzzle[cell] = 0;
        if (countGattaiSolutions(puzzle, 2) === 1) changed = true; else puzzle[cell] = value;
      }
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    puzzles.unlimited = { date: "Unlimited", rows: rowsFromBoard(puzzle) };
    unlimitedSolution = full; unlimitedGenerationMilliseconds = performance.now() - started;
    userInputs.unlimited.fill(0); userNotes.unlimited.forEach(note => note.clear()); userColors.unlimited.fill(""); histories.unlimited.length = 0; redoHistories.unlimited.length = 0;
    mode = "human"; loadPuzzle("unlimited");
    detail.textContent = "Generate another";
  } catch (error) {
    detail.textContent = "Try again";
    window.alert("The generator could not make a compatible Gattai this time. Please try again.");
  } finally {
    title.textContent = "Unlimited"; button.disabled = false;
  }
}
let elapsedSeconds = 0, timerBase = Date.now(), timerRunning = true;
function showTimer() { const minutes = Math.floor(elapsedSeconds / 60), seconds = elapsedSeconds % 60; document.querySelector("#timer").textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`; }
function setTimerRunning(running) { if (timerRunning === running) return; if (timerRunning) elapsedSeconds += Math.floor((Date.now() - timerBase) / 1000); timerRunning = running; timerBase = Date.now(); showTimer(); }
function resetTimer() { elapsedSeconds = 0; timerBase = Date.now(); showTimer(); }
setInterval(() => { if (timerRunning) { elapsedSeconds += Math.floor((Date.now() - timerBase) / 1000); timerBase = Date.now(); showTimer(); } }, 1000);
document.querySelector("#firstStep").addEventListener("click", () => { stepIndex = 0; refresh(); }); document.querySelector("#previousStep").addEventListener("click", () => { if (stepIndex > 0) { stepIndex -= 1; refresh(); } }); document.querySelector("#nextStep").addEventListener("click", () => { if (stepIndex < steps.length - 1) { stepIndex += 1; refresh(); } }); document.querySelector("#lastStep").addEventListener("click", () => { stepIndex = steps.length - 1; refresh(); });
function toggleSolution() { mode = mode === "human" ? "solver" : "human"; guide.classList.toggle("hidden", mode === "human"); refresh(); }
solutionToggle.addEventListener("click", toggleSolution);
document.querySelector("#hideSolution")?.addEventListener("click", toggleSolution);
document.querySelector("#unlimitedMode").addEventListener("click", generateUnlimitedPuzzle);
document.querySelectorAll(".entry-button").forEach(button => button.addEventListener("click", () => { entryMode = button.dataset.entry; updateEntryControls(); }));
document.querySelectorAll(".numpad [data-key]").forEach(button => button.addEventListener("click", () => applyEntry(Number(button.dataset.key))));
document.querySelectorAll("[data-action=erase]").forEach(button => button.addEventListener("click", eraseSelected));
document.querySelector("#undoMove").addEventListener("click", undoMove);
document.querySelector("#redoMove").addEventListener("click", redoMove);
document.querySelector("#resetGrid").addEventListener("click", () => { if (!window.confirm("Reset this grid? Your entered digits, Snyder notes, and cell colours will be cleared.")) return; snapshot(); human.fill(0); playNotes.forEach(note => note.clear()); playColors.fill(""); selectedCell = null; refresh(); });
document.addEventListener("keydown", event => { if (event.defaultPrevented || mode !== "human" || selectedCell === null || original[selectedCell]) return; if (/^[1-9]$/.test(event.key)) { event.preventDefault(); applyEntry(Number(event.key)); return; } if ((event.key === "Backspace" || event.key === "Delete") && !event.target.closest(".editable")) { event.preventDefault(); eraseSelected(); } });
document.querySelector("#resetTimer").addEventListener("click", resetTimer);
const setSharedHighlight = checked => { sharedHighlight = checked; document.querySelector("#sharedToggle").checked = checked; document.querySelector("#settingsSharedToggle").checked = checked; refresh(); };
document.querySelector("#sharedToggle").addEventListener("change", event => setSharedHighlight(event.target.checked));
document.querySelectorAll(".color-button").forEach(button => button.addEventListener("click", () => applyCellColor(button.dataset.color)));
document.querySelectorAll(".grid-button").forEach(button => button.addEventListener("click", () => { const grid = button.dataset.grid, selected = button.getAttribute("aria-pressed") !== "true"; document.querySelectorAll(".grid-button").forEach(item => item.setAttribute("aria-pressed", "false")); board.querySelectorAll(".cell").forEach(cell => cell.classList.remove("grid-a", "grid-b")); if (selected) { board.querySelectorAll(".cell").forEach(cell => { const index = Number(cell.dataset.index), row = Math.floor(index / 12), column = index % 12; if ((grid === "a" && row < 9 && column < 9) || (grid === "b" && row >= 3 && column >= 3)) cell.classList.add(`grid-${grid}`); }); button.setAttribute("aria-pressed", "true"); } }));
document.querySelector("#copyPng").addEventListener("click", async () => {
  const scale = 60, gridSize = scale * 12, margin = gridSize / 18, canvas = document.createElement("canvas"), context = canvas.getContext("2d"), values = currentValues(); canvas.width = canvas.height = gridSize + margin * 2; context.fillStyle = "#fff"; context.fillRect(0, 0, canvas.width, canvas.height); context.translate(margin, margin);
  for (let row = 0; row < 12; row += 1) for (let column = 0; column < 12; column += 1) if (hasCell(row, column)) { context.fillStyle = row >= 3 && column >= 3 && row < 9 && column < 9 ? "#fff1c7" : "#fff"; context.fillRect(column * scale, row * scale, scale, scale); context.strokeStyle = "#9aa6a8"; context.lineWidth = 1; context.strokeRect(column * scale, row * scale, scale, scale); const value = values[row * 12 + column]; if (value) { context.fillStyle = original[row * 12 + column] ? "#111" : "#1c6fa1"; context.font = "28px sans-serif"; context.textAlign = "center"; context.textBaseline = "middle"; context.fillText(value, (column + .5) * scale, (row + .53) * scale); } }
  context.strokeStyle = "#173a4c"; context.lineWidth = 3;
  [[0, 0, 9, 0], [0, 3, 12, 3], [0, 6, 12, 6], [0, 9, 12, 9], [3, 12, 12, 12]].forEach(([x1, y1, x2, y2]) => { context.beginPath(); context.moveTo(x1 * scale, y1 * scale); context.lineTo(x2 * scale, y2 * scale); context.stroke(); });
  [[0, 0, 0, 9], [3, 0, 3, 12], [6, 0, 6, 12], [9, 0, 9, 12], [12, 3, 12, 12]].forEach(([x1, y1, x2, y2]) => { context.beginPath(); context.moveTo(x1 * scale, y1 * scale); context.lineTo(x2 * scale, y2 * scale); context.stroke(); });
  context.fillStyle = "#52656b"; context.font = "12px sans-serif"; context.textAlign = "right"; context.textBaseline = "middle"; context.fillText("gattai-sudoku.vercel.app", gridSize, gridSize + margin * .55);
  const button = document.querySelector("#copyPng"); try { const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png")); await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]); button.textContent = "Image copied"; } catch { button.textContent = "Image copy unavailable"; } setTimeout(() => { button.textContent = "Copy as a picture"; }, 2000);
});
const howToPlayDialog = document.querySelector("#howToPlayDialog"); document.querySelector("#howToPlay").addEventListener("click", () => howToPlayDialog.showModal()); document.querySelector("#closeHowToPlay").addEventListener("click", () => howToPlayDialog.close()); howToPlayDialog.addEventListener("click", event => { if (event.target === howToPlayDialog) howToPlayDialog.close(); });
const archiveDialog = document.querySelector("#archiveDialog"); document.querySelector("#archive").addEventListener("click", () => { renderArchiveCalendar(); archiveDialog.showModal(); }); document.querySelector("#closeArchive").addEventListener("click", () => archiveDialog.close()); archiveDialog.addEventListener("click", event => { if (event.target === archiveDialog) archiveDialog.close(); });
const settingsDialog = document.querySelector("#settingsDialog"); if (settingsDialog) { document.querySelector("#settings").addEventListener("click", () => settingsDialog.showModal()); document.querySelector("#closeSettings").addEventListener("click", () => settingsDialog.close()); settingsDialog.addEventListener("click", event => { if (event.target === settingsDialog) settingsDialog.close(); }); }
if (settingsDialog) {
  const timerRow = document.querySelector("#timerVisibility")?.closest("label");
  if (timerRow && !document.querySelector("#difficultyVisibility")) timerRow.insertAdjacentHTML("afterend", '<label class="settings-row"><span>Show difficulty rating</span><input id="difficultyVisibility" type="checkbox" checked /></label><label class="settings-row"><span>Show given-cell count</span><input id="givenVisibility" type="checkbox" checked /></label>');
  const conflictLabel = document.querySelector("#autoErrorToggle")?.closest("label")?.querySelector("span"); if (conflictLabel) conflictLabel.textContent = "Mark incorrect entries red";
  const colourTitle = settingsDialog.querySelector(".settings-colours > span"); if (colourTitle) colourTitle.textContent = "Input number colour";
  const colourPicker = settingsDialog.querySelector(".settings-colours .color-picker"); if (colourPicker) colourPicker.setAttribute("aria-label", "Colour selected input number");
  const clearColour = settingsDialog.querySelector(".settings-colours .color-clear"); if (clearColour) clearColour.setAttribute("aria-label", "Clear input number colour");
}
const techniqueDialog = document.querySelector("#techniqueDialog"); document.querySelector("#techniqueTally").addEventListener("click", () => techniqueDialog.showModal()); document.querySelector("#closeTechniqueDialog").addEventListener("click", () => techniqueDialog.close()); techniqueDialog.addEventListener("click", event => { if (event.target === techniqueDialog) techniqueDialog.close(); });
function setTheme(dark) { document.body.classList.toggle("dark", dark); document.querySelector("#darkTheme")?.setAttribute("aria-pressed", String(dark)); document.querySelector("#lightTheme")?.setAttribute("aria-pressed", String(!dark)); }
document.querySelector("#darkTheme")?.addEventListener("click", () => setTheme(true));
document.querySelector("#lightTheme")?.addEventListener("click", () => setTheme(false));
document.querySelector("#timerVisibility")?.addEventListener("change", event => document.querySelector(".timer-controls")?.classList.toggle("timer-hidden", !event.target.checked));
document.querySelector("#difficultyVisibility")?.addEventListener("change", event => { difficultyVisible = event.target.checked; refresh(); });
document.querySelector("#givenVisibility")?.addEventListener("change", event => { givenCountVisible = event.target.checked; refresh(); });
document.querySelector("#autoErrorToggle")?.addEventListener("change", event => { autoMarkConflicts = event.target.checked; refresh(); });
document.querySelector("#settingsSharedToggle")?.addEventListener("change", event => setSharedHighlight(event.target.checked));
function addSidebarToggle(sidebar, label) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "sidebar-toggle";
  button.setAttribute("aria-label", `Collapse ${label}`);
  button.setAttribute("aria-expanded", "true");
  button.textContent = "☰";
  button.addEventListener("click", () => {
    const collapsed = sidebar.classList.toggle("sidebar-collapsed");
    button.setAttribute("aria-expanded", String(!collapsed));
    button.setAttribute("aria-label", `${collapsed ? "Expand" : "Collapse"} ${label}`);
  });
  sidebar.prepend(button);
}
addSidebarToggle(document.querySelector(".control-sidebar"), "puzzle controls sidebar");
document.querySelector(".generator-rule").textContent = "Both published weeks are independently rechecked for exactly one solution. The previous week uses paired rotational digging; every listed walkthrough resolves the entire Gattai using named Singles techniques only.";
loadPuzzle(activeDay);
