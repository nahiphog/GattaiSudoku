(() => {
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const units = [];
  for (const [name, rowOffset, columnOffset] of [["Grid 1", 0, 0], ["Grid 2", 3, 3]]) {
    for (let number = 0; number < 9; number += 1) {
      units.push([`${name} row ${number + 1}`, Array.from({ length: 9 }, (_, column) => (rowOffset + number) * 12 + columnOffset + column)]);
      units.push([`${name} column ${number + 1}`, Array.from({ length: 9 }, (_, row) => (rowOffset + row) * 12 + columnOffset + number)]);
    }
    for (let boxRow = 0; boxRow < 3; boxRow += 1) for (let boxColumn = 0; boxColumn < 3; boxColumn += 1) {
      units.push([`${name} house ${boxRow + 1},${boxColumn + 1}`, Array.from({ length: 9 }, (_, cell) => (rowOffset + boxRow * 3 + Math.floor(cell / 3)) * 12 + columnOffset + boxColumn * 3 + cell % 3)]);
    }
  }
  const active = [...new Set(units.flatMap(([, unit]) => unit))];
  const activeSet = new Set(active);
  const housesFor = Object.fromEntries(active.map(index => [index, units.filter(([, unit]) => unit.includes(index)).map(([, unit]) => unit)]));
  const values = Array(144).fill(0);
  const board = document.querySelector("#verifyBoard");
  const status = document.querySelector("#verifyStatus");
  const stringBox = document.querySelector("#solutionString");
  const solutionResults = document.querySelector("#solutionResults");
  const evaluateButton = document.querySelector("#evaluateDifficulty");
  const copyInputImage = document.querySelector("#copyInputImage");
  const copyCompletedImage = document.querySelector("#copyCompletedImage");
  const uniquenessTime = document.querySelector("#uniquenessTime");
  const walkthrough = document.querySelector("#walkthrough");
  const walkthroughRating = document.querySelector("#walkthroughRating");
  const evaluationTime = document.querySelector("#evaluationTime");
  const walkthroughSteps = document.querySelector("#walkthroughSteps");
  const tallyButton = document.querySelector("#walkthroughTally");
  const tallyResults = document.querySelector("#tallyResults");
  let verifiedSolution = null, verifiedPuzzle = null, verifiedGivens = new Set();
  const setStatus = (message, kind = "") => { status.textContent = message; status.className = `dialog-status ${kind}`; };
  const conflicts = () => {
    const found = new Set();
    for (const [, unit] of units) for (const digit of digits) {
      const matches = unit.filter(index => values[index] === digit);
      if (matches.length > 1) matches.forEach(index => found.add(index));
    }
    return found;
  };
  function drawBoundaries(target = board) {
    [["horizontal", "h-0"], ["horizontal", "h-3"], ["horizontal", "h-6"], ["horizontal", "h-9"], ["horizontal", "h-12"], ["vertical", "v-0"], ["vertical", "v-3"], ["vertical", "v-6"], ["vertical", "v-9"], ["vertical", "v-12"]].forEach(([direction, position]) => {
      const line = document.createElement("span"); line.className = `board-boundary ${direction} ${position}`; target.append(line);
    });
  }
  function showSolution(solution, differences = new Set(), label = "Solution", givens = new Set()) {
    const figure = document.createElement("section"), title = document.createElement("strong"), grid = document.createElement("div");
    figure.className = "verify-solution"; title.textContent = label; grid.className = "board verify-result-grid";
    for (let row = 0; row < 12; row += 1) for (let column = 0; column < 12; column += 1) {
      const index = row * 12 + column; if (!activeSet.has(index)) continue;
      const cell = document.createElement("span"); cell.className = `verify-result-cell${givens.has(index) ? " given-cell" : ""}${differences.has(index) ? " solution-difference" : ""}`;
      cell.textContent = solution[index]; cell.style.gridRowStart = row + 1; cell.style.gridColumnStart = column + 1; grid.append(cell);
    }
    drawBoundaries(grid); figure.append(title, grid); solutionResults.append(figure);
  }
  function clearResults() { solutionResults.replaceChildren(); verifiedSolution = null; verifiedPuzzle = null; verifiedGivens = new Set(); evaluateButton.hidden = true; copyInputImage.hidden = true; copyCompletedImage.hidden = true; uniquenessTime.hidden = true; walkthrough.hidden = true; tallyResults.hidden = true; }
  async function copyGridImage(grid, givens, button, label) {
    const cell = 48, margin = 26, size = cell * 12, canvas = document.createElement("canvas"), context = canvas.getContext("2d");
    canvas.width = size + margin * 2; canvas.height = size + margin * 2; context.fillStyle = "#fff"; context.fillRect(0, 0, canvas.width, canvas.height);
    for (let row = 0; row < 12; row += 1) for (let column = 0; column < 12; column += 1) { const index = row * 12 + column; if (!activeSet.has(index)) continue; const x = margin + column * cell, y = margin + row * cell; context.fillStyle = "#fff"; context.fillRect(x, y, cell, cell); context.strokeStyle = "#73808a"; context.lineWidth = 1; context.strokeRect(x, y, cell, cell); if (grid[index]) { context.fillStyle = givens.has(index) ? "#111" : "#1c6fa1"; context.font = `700 ${Math.round(cell * .57)}px Arial`; context.textAlign = "center"; context.textBaseline = "middle"; context.fillText(grid[index], x + cell / 2, y + cell / 2); } }
    context.strokeStyle = "#173a4c"; context.lineWidth = 4;
    [[0,0,9,0],[0,3,12,3],[0,6,12,6],[0,9,12,9],[3,12,12,12]].forEach(([x1,y1,x2,y2]) => { context.beginPath(); context.moveTo(margin+x1*cell,margin+y1*cell); context.lineTo(margin+x2*cell,margin+y2*cell); context.stroke(); });
    [[0,0,0,9],[3,0,3,12],[6,0,6,12],[9,0,9,12],[12,3,12,12]].forEach(([x1,y1,x2,y2]) => { context.beginPath(); context.moveTo(margin+x1*cell,margin+y1*cell); context.lineTo(margin+x2*cell,margin+y2*cell); context.stroke(); });
    try { const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png")); await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]); button.textContent = "Grid copied"; } catch { button.textContent = "Image copy unavailable"; } setTimeout(() => { button.textContent = label; }, 1600);
  }
  function cellName(index) { const row = Math.floor(index / 12), column = index % 12; return row < 9 && column < 9 ? `Grid 1: R${row + 1}C${column + 1}` : `Grid 2: R${row - 2}C${column - 2}`; }
  function buildWalkthrough(solution, givens) {
    const working = Array(144).fill(0), steps = []; givens.forEach(index => { working[index] = solution[index]; });
    const peersFor = index => [...new Set(housesFor[index].flat().filter(other => other !== index))];
    const candidatesFor = index => { const used = new Set(); peersFor(index).forEach(other => { if (working[other]) used.add(working[other]); }); return digits.filter(digit => !used.has(digit)); };
    const notes = Object.fromEntries(active.filter(index => !working[index]).map(index => [index, new Set(candidatesFor(index))]));
    const combinations = (items, size) => size === 0 ? [[]] : items.length < size ? [] : combinations(items.slice(1), size - 1).map(group => [items[0], ...group]).concat(combinations(items.slice(1), size));
    const add = (technique, text, index = null, digit = null) => steps.push({ technique, text, index, digit });
    const place = (technique, index, digit, text) => { working[index] = digit; delete notes[index]; peersFor(index).forEach(peer => notes[peer]?.delete(digit)); add(technique, text, index, digit); };
    const eliminate = (technique, changes, text) => { const actual = changes.filter(({ index, digit }) => notes[index]?.has(digit)); if (!actual.length) return false; actual.forEach(({ index, digit }) => notes[index].delete(digit)); add(technique, text); return true; };
    function fullHouse() { for (const [label, house] of units) { const blanks = house.filter(index => !working[index]), missing = digits.filter(digit => !house.some(index => working[index] === digit)); if (blanks.length === 1 && missing.length === 1) { place("Full House", blanks[0], missing[0], `${label} has one empty cell: ${cellName(blanks[0])} = ${missing[0]}.`); return true; } } return false; }
    function nakedSingle() { for (const index of active) if (!working[index] && notes[index]?.size === 1) { const digit = [...notes[index]][0]; place("Naked Single", index, digit, `${cellName(index)} has only one candidate: ${digit}.`); return true; } return false; }
    function hiddenSingle() { for (const [label, house] of units) for (const digit of digits) { if (house.some(index => working[index] === digit)) continue; const places = house.filter(index => !working[index] && notes[index]?.has(digit)); if (places.length === 1) { place("Hidden Single", places[0], digit, `${digit} appears in only one open cell of ${label}: ${cellName(places[0])}.`); return true; } } return false; }
    function nakedSubset(size) { for (const [label, house] of units) { const blanks = house.filter(index => notes[index]); for (const group of combinations(blanks, size)) { const union = new Set(group.flatMap(index => [...notes[index]])); if (union.size !== size || group.some(index => notes[index].size < 2 || notes[index].size > size)) continue; const changes = blanks.filter(index => !group.includes(index)).flatMap(index => [...union].filter(digit => notes[index].has(digit)).map(digit => ({ index, digit }))); if (eliminate(`Naked ${["", "", "Pair", "Triple", "Quad"][size]}`, changes, `${[...union].join(", ")} are confined to ${group.map(cellName).join(" and ")} in ${label}.`)) return true; } } return false; }
    function hiddenSubset(size) { for (const [label, house] of units) { const blanks = house.filter(index => notes[index]), missing = digits.filter(digit => !house.some(index => working[index] === digit)); for (const digitsGroup of combinations(missing, size)) { const cells = [...new Set(digitsGroup.flatMap(digit => blanks.filter(index => notes[index].has(digit))))]; if (cells.length !== size) continue; const changes = cells.flatMap(index => [...notes[index]].filter(digit => !digitsGroup.includes(digit)).map(digit => ({ index, digit }))); if (eliminate(`Hidden ${["", "", "Pair", "Triple", "Quad"][size]}`, changes, `${digitsGroup.join(", ")} can appear only in ${cells.map(cellName).join(" and ")} in ${label}.`)) return true; } } return false; }
    function intersections() { for (const [grid, rowOffset, columnOffset] of [["Grid 1", 0, 0], ["Grid 2", 3, 3]]) { for (let boxRow = 0; boxRow < 3; boxRow += 1) for (let boxColumn = 0; boxColumn < 3; boxColumn += 1) { const box = units.find(([label]) => label === `${grid} house ${boxRow + 1},${boxColumn + 1}`)[1]; for (const digit of digits) { const positions = box.filter(index => notes[index]?.has(digit)); if (positions.length < 2) continue; const rows = [...new Set(positions.map(index => Math.floor(index / 12) - rowOffset))], columns = [...new Set(positions.map(index => index % 12 - columnOffset))]; if (rows.length === 1) { const row = units.find(([label]) => label === `${grid} row ${rows[0] + 1}`)[1], changes = row.filter(index => !box.includes(index) && notes[index]?.has(digit)).map(index => ({ index, digit })); if (eliminate("Pointing", changes, `In ${grid} house ${boxRow + 1},${boxColumn + 1}, ${digit} is confined to row ${rows[0] + 1}.`)) return true; } if (columns.length === 1) { const column = units.find(([label]) => label === `${grid} column ${columns[0] + 1}`)[1], changes = column.filter(index => !box.includes(index) && notes[index]?.has(digit)).map(index => ({ index, digit })); if (eliminate("Pointing", changes, `In ${grid} house ${boxRow + 1},${boxColumn + 1}, ${digit} is confined to column ${columns[0] + 1}.`)) return true; } } }
      for (const axis of ["row", "column"]) for (let number = 0; number < 9; number += 1) for (const digit of digits) { const house = units.find(([label]) => label === `${grid} ${axis} ${number + 1}`)[1], positions = house.filter(index => notes[index]?.has(digit)); if (positions.length < 2) continue; const boxRows = [...new Set(positions.map(index => Math.floor((Math.floor(index / 12) - rowOffset) / 3)))], boxColumns = [...new Set(positions.map(index => Math.floor((index % 12 - columnOffset) / 3)))]; if (boxRows.length !== 1 || boxColumns.length !== 1) continue; const box = units.find(([label]) => label === `${grid} house ${boxRows[0] + 1},${boxColumns[0] + 1}`)[1], changes = box.filter(index => !house.includes(index) && notes[index]?.has(digit)).map(index => ({ index, digit })); if (eliminate("Claiming", changes, `In ${grid} ${axis} ${number + 1}, ${digit} is confined to one house.`)) return true; }
    } return false; }
    function basicFish() {
      const names = { 2: "X-Wing", 3: "Swordfish", 4: "Jellyfish" };
      for (const [grid, rowOffset, columnOffset] of [["Grid 1", 0, 0], ["Grid 2", 3, 3]]) for (const digit of digits) for (const size of [2, 3, 4]) for (const byRows of [true, false]) {
        const patterns = [];
        for (let base = 0; base < 9; base += 1) {
          const covers = Array.from({ length: 9 }, (_, cover) => cover).filter(cover => {
            const row = byRows ? base : cover, column = byRows ? cover : base;
            return notes[(rowOffset + row) * 12 + columnOffset + column]?.has(digit);
          });
          if (covers.length >= 2 && covers.length <= size) patterns.push({ base, covers });
        }
        for (const group of combinations(patterns, size)) {
          const coverSet = new Set(group.flatMap(pattern => pattern.covers));
          if (coverSet.size !== size) continue;
          const bases = new Set(group.map(pattern => pattern.base)), changes = [];
          for (const cover of coverSet) for (let base = 0; base < 9; base += 1) {
            if (bases.has(base)) continue;
            const row = byRows ? base : cover, column = byRows ? cover : base, index = (rowOffset + row) * 12 + columnOffset + column;
            if (notes[index]?.has(digit)) changes.push({ index, digit });
          }
          if (eliminate(names[size], changes, `In ${grid}, candidate ${digit} forms a ${names[size]} using ${byRows ? "rows" : "columns"} ${group.map(pattern => pattern.base + 1).join(", ")}.`)) return true;
        }
      }
      return false;
    }
    function skyscraper() { for (const [grid, rowOffset, columnOffset] of [["Grid 1", 0, 0], ["Grid 2", 3, 3]]) for (const digit of digits) for (const byRows of [true, false]) { const pairs = []; for (let unit = 0; unit < 9; unit += 1) { const positions = Array.from({ length: 9 }, (_, position) => position).filter(position => { const row = byRows ? unit : position, column = byRows ? position : unit; return notes[(rowOffset + row) * 12 + columnOffset + column]?.has(digit); }); if (positions.length === 2) pairs.push({ unit, positions }); } for (const first of pairs) for (const second of pairs) { if (first.unit >= second.unit) continue; const shared = first.positions.filter(position => second.positions.includes(position)); if (shared.length !== 1) continue; const roofs = [first.positions.find(position => position !== shared[0]), second.positions.find(position => position !== shared[0])].map((position, n) => { const unit = n ? second.unit : first.unit, row = byRows ? unit : position, column = byRows ? position : unit; return (rowOffset + row) * 12 + columnOffset + column; }); const changes = active.filter(index => index !== roofs[0] && index !== roofs[1] && notes[index]?.has(digit) && peersFor(index).includes(roofs[0]) && peersFor(index).includes(roofs[1])).map(index => ({ index, digit })); if (eliminate("Skyscraper", changes, `In ${grid}, candidate ${digit} forms a Skyscraper using ${byRows ? "rows" : "columns"} ${first.unit + 1} and ${second.unit + 1}.`)) return true; } } return false; }
    function twoStringKite() { for (const [grid, rowOffset, columnOffset] of [["Grid 1", 0, 0], ["Grid 2", 3, 3]]) for (const digit of digits) { const rowPairs = [], columnPairs = []; for (let row = 0; row < 9; row += 1) { const columns = Array.from({ length: 9 }, (_, column) => column).filter(column => notes[(rowOffset + row) * 12 + columnOffset + column]?.has(digit)); if (columns.length === 2) rowPairs.push({ row, columns }); } for (let column = 0; column < 9; column += 1) { const rows = Array.from({ length: 9 }, (_, row) => row).filter(row => notes[(rowOffset + row) * 12 + columnOffset + column]?.has(digit)); if (rows.length === 2) columnPairs.push({ column, rows }); } for (const rowPair of rowPairs) for (const columnPair of columnPairs) for (const rowColumn of rowPair.columns) for (const columnRow of columnPair.rows) { if (Math.floor(rowPair.row / 3) !== Math.floor(columnRow / 3) || Math.floor(rowColumn / 3) !== Math.floor(columnPair.column / 3)) continue; const baseA = (rowOffset + rowPair.row) * 12 + columnOffset + rowColumn, baseB = (rowOffset + columnRow) * 12 + columnOffset + columnPair.column; if (baseA === baseB) continue; const roofA = (rowOffset + rowPair.row) * 12 + columnOffset + rowPair.columns.find(column => column !== rowColumn), roofB = (rowOffset + columnPair.rows.find(row => row !== columnRow)) * 12 + columnOffset + columnPair.column, changes = active.filter(index => index !== roofA && index !== roofB && notes[index]?.has(digit) && peersFor(index).includes(roofA) && peersFor(index).includes(roofB)).map(index => ({ index, digit })); if (eliminate("2-String Kite", changes, `In ${grid}, candidate ${digit} forms a 2-String Kite from one row and one column strong link.`)) return true; } } return false; }
    function xyWing() { for (const pivot of active) { if (notes[pivot]?.size !== 2) continue; const [first, second] = [...notes[pivot]]; for (const [pivotDigit, otherDigit] of [[first, second], [second, first]]) for (const wingA of peersFor(pivot).filter(index => notes[index]?.size === 2 && notes[index].has(pivotDigit))) { const shared = [...notes[wingA]].find(digit => digit !== pivotDigit); if (!shared || shared === otherDigit) continue; for (const wingB of peersFor(pivot)) { if (wingB === wingA || notes[wingB]?.size !== 2 || !notes[wingB].has(otherDigit) || !notes[wingB].has(shared)) continue; const changes = active.filter(index => index !== pivot && index !== wingA && index !== wingB && notes[index]?.has(shared) && peersFor(index).includes(wingA) && peersFor(index).includes(wingB)).map(index => ({ index, digit: shared })); if (eliminate("XY-Wing", changes, `${cellName(pivot)} is the pivot of an XY-Wing; remove ${shared} from cells seeing both wings.`)) return true; } } } return false; }
    function xyzWing() { for (const pivot of active) { if (notes[pivot]?.size !== 3) continue; const pivotDigits = [...notes[pivot]]; for (const shared of pivotDigits) { const [first, second] = pivotDigits.filter(digit => digit !== shared); for (const wingA of peersFor(pivot).filter(index => notes[index]?.size === 2 && notes[index].has(first) && notes[index].has(shared))) for (const wingB of peersFor(pivot)) { if (wingB === wingA || notes[wingB]?.size !== 2 || !notes[wingB].has(second) || !notes[wingB].has(shared)) continue; const changes = active.filter(index => index !== pivot && index !== wingA && index !== wingB && notes[index]?.has(shared) && peersFor(index).includes(pivot) && peersFor(index).includes(wingA) && peersFor(index).includes(wingB)).map(index => ({ index, digit: shared })); if (eliminate("XYZ-Wing", changes, `${cellName(pivot)} is the ${first}/${second}/${shared} pivot; remove ${shared} from cells seeing its pivot and both wings.`)) return true; } } } return false; }
    function wWing() { for (let left = 0; left < active.length; left += 1) for (let right = left + 1; right < active.length; right += 1) { const wingA = active[left], wingB = active[right], peersA = peersFor(wingA), peersB = peersFor(wingB); if (notes[wingA]?.size !== 2 || notes[wingB]?.size !== 2 || peersA.includes(wingB)) continue; const pairA = [...notes[wingA]].sort((a, b) => a - b), pairB = [...notes[wingB]].sort((a, b) => a - b); if (pairA.join() !== pairB.join()) continue; for (const bridge of pairA) { const target = pairA.find(digit => digit !== bridge); for (const [label, house] of units) { const strong = house.filter(index => notes[index]?.has(bridge)); if (strong.length !== 2 || !((peersA.includes(strong[0]) && peersB.includes(strong[1])) || (peersA.includes(strong[1]) && peersB.includes(strong[0])))) continue; const changes = active.filter(index => index !== wingA && index !== wingB && notes[index]?.has(target) && peersFor(index).includes(wingA) && peersFor(index).includes(wingB)).map(index => ({ index, digit: target })); if (eliminate("W-Wing", changes, `${cellName(wingA)} and ${cellName(wingB)} form a W-Wing linked by candidate ${bridge} in ${label}.`)) return true; } } } return false; }
    while (active.some(index => !working[index])) {
      if (fullHouse() || nakedSingle() || hiddenSingle() || nakedSubset(2) || hiddenSubset(2) || intersections() || nakedSubset(3) || hiddenSubset(3) || nakedSubset(4) || hiddenSubset(4) || basicFish() || skyscraper() || twoStringKite() || wWing() || xyWing() || xyzWing()) continue;
      const index = active.filter(cell => !working[cell]).sort((left, right) => candidatesFor(left).length - candidatesFor(right).length)[0];
      place("Trial and error", index, solution[index], `${cellName(index)} = ${solution[index]} is a transparent search choice after the currently implemented named techniques are exhausted. The solver then returns to the easiest named technique.`);
    }
    return steps;
  }
  function renderWalkthrough() {
    const started = performance.now();
    const steps = buildWalkthrough(verifiedSolution, verifiedGivens), tally = new Map(); walkthroughSteps.replaceChildren();
    steps.forEach((step, index) => { tally.set(step.technique, [...(tally.get(step.technique) || []), index + 1]); const item = document.createElement("li"); item.innerHTML = `<strong>Step ${index + 1}: ${step.technique}</strong> — ${step.text}`; walkthroughSteps.append(item); });
    const scores = { "Full House": 100, "Naked Single": 200, "Hidden Single": 300, "Locked Pair": 1000, "Locked Triple": 1100, "Pointing": 1200, "Claiming": 1210, "Naked Pair": 1300, "Naked Triple": 1400, "Hidden Pair": 1500, "Hidden Triple": 1600, "Naked Quad": 2000, "Hidden Quad": 2100, "X-Wing": 2200, "Swordfish": 2300, "Jellyfish": 2400, "Skyscraper": 3000, "2-String Kite": 3100, "W-Wing": 3200, "XY-Wing": 3300, "XYZ-Wing": 3400 };
    const levels = { "Full House": "Beginner", "Naked Single": "Beginner", "Hidden Single": "Beginner", "Locked Pair": "Medium", "Locked Triple": "Medium", "Pointing": "Medium", "Claiming": "Medium", "Naked Pair": "Medium", "Naked Triple": "Medium", "Hidden Pair": "Medium", "Hidden Triple": "Medium", "Naked Quad": "Hard", "Hidden Quad": "Hard", "X-Wing": "Hard", "Swordfish": "Hard", "Jellyfish": "Hard", "Skyscraper": "Tricky", "2-String Kite": "Tricky", "W-Wing": "Tricky", "XY-Wing": "Tricky", "XYZ-Wing": "Tricky" };
    const order = ["Beginner", "Easy", "Medium", "Tricky", "Hard", "Unfair", "Extreme", "Nightmare"], usesSearch = tally.has("Trial and error"); let score = 0, rating = "Beginner";
    if (usesSearch) { score = 9001; rating = "Over 9000"; } else steps.forEach(step => { score = Math.max(score, scores[step.technique] || 0); if (order.indexOf(levels[step.technique] || "Nightmare") > order.indexOf(rating)) rating = levels[step.technique] || "Nightmare"; });
    walkthroughRating.textContent = `Difficulty: ${rating} (${score})`;
    evaluationTime.textContent = `Difficulty evaluation: ${Math.max(1, Math.round(performance.now() - started))} ms`;
    tallyResults.innerHTML = `<table><thead><tr><th>Technique</th><th>Steps</th></tr></thead><tbody>${[...tally.entries()].map(([technique, stepsForTechnique]) => `<tr><td>${technique}</td><td>${stepsForTechnique.join(", ")}</td></tr>`).join("")}</tbody></table>`;
    walkthrough.hidden = false;
  }
  function render() {
    const bad = conflicts(); board.innerHTML = "";
    for (let row = 0; row < 12; row += 1) for (let column = 0; column < 12; column += 1) {
      const index = row * 12 + column; if (!activeSet.has(index)) continue;
      const cell = document.createElement("input");
      cell.className = `cell verify-cell${bad.has(index) ? " conflict" : ""}${row >= 3 && row < 9 && column >= 3 && column < 9 ? " shared" : ""}`;
      cell.dataset.index = index; cell.inputMode = "numeric"; cell.maxLength = 1; cell.autocomplete = "off"; cell.value = values[index] || "";
      cell.style.gridRowStart = row + 1; cell.style.gridColumnStart = column + 1;
      cell.setAttribute("aria-label", `Row ${row + 1}, column ${column + 1}`);
      cell.addEventListener("input", () => { const match = cell.value.match(/[1-9]/); values[index] = match ? Number(match[0]) : 0; cell.value = values[index] || ""; render(); });
      cell.addEventListener("keydown", event => { if (event.key === "Backspace" || event.key === "Delete") { values[index] = 0; setTimeout(render); } });
      board.append(cell);
    }
    drawBoundaries();
    stringBox.value = values.map((value, index) => activeSet.has(index) ? (value || ".") : ".").join("");
  }
  function parseString(text) {
    const clean = text.replace(/\s/g, "");
    if (clean.length !== 144) return "Use exactly 144 characters.";
    if (!/^[1-9.]+$/.test(clean)) return "Use digits 1–9 and periods only.";
    for (let index = 0; index < 144; index += 1) {
      if (!activeSet.has(index) && clean[index] !== ".") return "The 18 cells outside the Gattai shape must be periods.";
      values[index] = activeSet.has(index) && clean[index] !== "." ? Number(clean[index]) : 0;
    }
    return "";
  }
  function countSolutions(limit = 2) {
    if (conflicts().size) return { count: 0, issue: "Resolve the red conflicting entries before checking uniqueness." };
    const working = [...values];
    const candidatesFor = index => {
      const used = new Set();
      housesFor[index].forEach(house => house.forEach(other => { if (working[other]) used.add(working[other]); }));
      return digits.filter(digit => !used.has(digit));
    };
    const solutions = [];
    function search() {
      let choice = -1, options = null;
      for (const index of active) if (!working[index]) {
        const possible = candidatesFor(index);
        if (!possible.length) return 0;
        if (!options || possible.length < options.length) { choice = index; options = possible; }
      }
      if (choice === -1) { solutions.push([...working]); return 1; }
      let total = 0;
      for (const digit of options) {
        working[choice] = digit;
        total += search();
        working[choice] = 0;
        if (total >= limit) return total;
      }
      return total;
    }
    return { count: search(), solutions };
  }
  document.querySelector("#verifyGrid").addEventListener("click", () => {
    const started = performance.now();
    const result = countSolutions();
    clearResults();
    uniquenessTime.textContent = `Uniqueness check: ${Math.max(1, Math.round(performance.now() - started))} ms`;
    uniquenessTime.hidden = false;
    if (result.issue) setStatus(result.issue, "error");
    else if (result.count === 1) { verifiedSolution = result.solutions[0]; verifiedPuzzle = [...values]; verifiedGivens = new Set(active.filter(index => values[index])); setStatus("Verified: this puzzle has exactly one solution.", "success"); showSolution(verifiedSolution, new Set(), "Completed grid", verifiedGivens); evaluateButton.hidden = false; copyInputImage.hidden = false; copyCompletedImage.hidden = false; }
    else if (result.count === 0) setStatus("This puzzle has no valid solution.", "error");
    else {
      setStatus("This puzzle has multiple solutions. The orange cells differ.", "error");
      const differences = new Set(active.filter(index => result.solutions[0][index] !== result.solutions[1][index]));
      const givens = new Set(active.filter(index => values[index])); showSolution(result.solutions[0], differences, "Solution 1", givens); showSolution(result.solutions[1], differences, "Solution 2", givens);
    }
  });
  evaluateButton.addEventListener("click", renderWalkthrough);
  copyInputImage.addEventListener("click", () => copyGridImage(verifiedPuzzle, verifiedGivens, copyInputImage, "Copy input grid as image"));
  copyCompletedImage.addEventListener("click", () => copyGridImage(verifiedSolution, verifiedGivens, copyCompletedImage, "Copy completed grid as image"));
  tallyButton.addEventListener("click", () => { tallyResults.hidden = !tallyResults.hidden; tallyButton.textContent = tallyResults.hidden ? "Technique tally" : "Hide technique tally"; });
  document.querySelector("#clearGrid").addEventListener("click", () => { values.fill(0); clearResults(); setStatus(""); render(); });
  document.querySelector("#importString").addEventListener("click", () => { const issue = parseString(stringBox.value); clearResults(); setStatus(issue || "String imported. Fill or edit any cell, then check uniqueness.", issue ? "error" : "success"); render(); });
  document.querySelector("#exportString").addEventListener("click", async () => { const output = values.map((value, index) => activeSet.has(index) ? (value || ".") : ".").join(""); try { await navigator.clipboard.writeText(output); setStatus("144-character string copied.", "success"); } catch { setStatus("Unable to access the clipboard.", "error"); } });
  render();
})();
