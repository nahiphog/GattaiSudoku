const puzzles = {
  monday: { date: "Monday, September 7, 2026", rows: ["82......9...", "..7.........", ".9....1.....", "6...8...3...", "....53..14..", ".......2.8..", "...8..6..5.4", ".....7.3....", "....1..5....", "....9.......", "......4...3.", "....7....69."] },
  tuesday: { date: "Tuesday, September 8, 2026", rows: [".6..........", "8.4...96....", "5.7..4......", "4....2......", ".....859....", "...........3", "6........1.7", "...1.62....4", ".2......9...", ".....4..1...", "......38....", "...91....7.."] },
  wednesday: { date: "Wednesday, September 9, 2026", rows: [".9.....6....", "......2.1...", "....4.......", ".......8....", "..7....4.1..", ".4..6.1....3", ".5...3......", "..4.8...694.", "2........6..", ".......35...", ".........2..", "...5.12...7."] },
  thursday: { date: "Thursday, September 10, 2026", rows: ["3.6.4.......", "...7934.....", "......8.....", "..8.......2.", ".6.1...9..67", "..3.......1.", "..1.6...5...", "......92....", ".........2.3", "...6....3...", "...2.1...7..", "..........91"] },
  friday: { date: "Friday, September 11, 2026", rows: ["...9........", ".7..........", ".4...8.1....", "3.....1..9..", "..5........4", "...32..4....", "....1.9..4..", "1.6.3...4...", ".9....5.....", "......2...5.", ".....8.5..9.", ".....1...7.."] },
  saturday: { date: "Saturday, September 12, 2026", rows: [".....3.8....", "..4....2....", "1...857.....", "9....7..3.2.", "...........4", "...5.94..7.1", "..1.......9.", "..2.1.....6.", "..8.9..37...", "....8.......", ".........2..", ".....3.218.."] }
};
let activeDay = "tuesday", rows = puzzles.tuesday.rows, puzzleDate = puzzles.tuesday.date;
const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const techniqueScores = { "Full House": 4, "Naked Single": 4, "Hidden Single": 14, "Locked Pair": 40, "Locked Triple": 60, "Pointing": 50, "Claiming": 50, "Naked Pair": 60, "Naked Triple": 80, "Hidden Pair": 70, "Hidden Triple": 100, "Naked Quad": 120, "Hidden Quad": 150, "X-Wing": 140 };
const techniqueLevels = { "Full House": "Beginner", "Naked Single": "Beginner", "Hidden Single": "Beginner", "Locked Pair": "Medium", "Locked Triple": "Medium", "Pointing": "Medium", "Claiming": "Medium", "Naked Pair": "Medium", "Naked Triple": "Medium", "Hidden Pair": "Medium", "Hidden Triple": "Medium", "Naked Quad": "Hard", "Hidden Quad": "Hard", "X-Wing": "Hard" };
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
const userInputs = { monday: Array(144).fill(0), tuesday: Array(144).fill(0), wednesday: Array(144).fill(0), thursday: Array(144).fill(0), friday: Array(144).fill(0), saturday: Array(144).fill(0) };
const userNotes = { monday: blankNotes(), tuesday: blankNotes(), wednesday: blankNotes(), thursday: blankNotes(), friday: blankNotes(), saturday: blankNotes() };
const histories = { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [] };
const original = Array(144).fill(0); let human = userInputs.tuesday, playNotes = userNotes.tuesday;
rows.forEach((row, r) => [...row].forEach((value, c) => { if (value !== ".") original[r * 12 + c] = Number(value); }));
function hasCell(row, column) { return (row >= 0 && row < 9 && column >= 0 && column < 9) || (row >= 3 && row < 12 && column >= 3 && column < 12); }
function nameFor(index, preferredGrid = "") { const row = Math.floor(index / 12), column = index % 12, names = []; if (row < 9 && column < 9 && preferredGrid !== "G2") names.push(`G1 R${row + 1}C${column + 1}`); if (row >= 3 && column >= 3 && preferredGrid !== "G1") names.push(`G2 R${row - 2}C${column - 2}`); return names.join(" / "); }
function candidates(values, index) { return digits.filter(digit => ![...peers[index]].some(peer => values[peer] === digit)); }
function choose(items, size) { if (size === 0) return [[]]; if (items.length < size) return []; return choose(items.slice(1), size - 1).map(group => [items[0], ...group]).concat(choose(items.slice(1), size)); }
function solveExactly(startValues) {
  const values = [...startValues];
  function search() {
    let chosen = null, options = null;
    for (const index of active) if (!values[index]) {
      const possibilities = candidates(values, index);
      if (!possibilities.length) return false;
      if (!options || possibilities.length < options.length) { chosen = index; options = possibilities; if (options.length === 1) break; }
    }
    if (chosen === null) return true;
    for (const digit of options) { values[chosen] = digit; if (search()) return true; values[chosen] = 0; }
    return false;
  }
  return search() ? values : null;
}
function deriveSteps() {
  const values = [...original], found = [], notes = Object.fromEntries(active.filter(index => !values[index]).map(index => [index, new Set(candidates(values, index))]));
  const subsetName = size => ({ 2: "Pair", 3: "Triple", 4: "Quad" }[size]);
  const snapshotNotes = () => Object.fromEntries(Object.entries(notes).map(([index, note]) => [index, [...note]]));
  function addStep(step, beforeNotes, eliminations = []) { found.push({ ...step, beforeNotes, eliminations }); }
  function place(technique, index, digit, house, text) {
    const beforeNotes = snapshotNotes(), eliminations = [...peers[index]].filter(peer => notes[peer]?.has(digit)).map(peer => ({ index: peer, digit }));
    values[index] = digit; delete notes[index]; peers[index].forEach(peer => notes[peer]?.delete(digit));
    addStep({ technique, index, digit, house, text: text || `${nameFor(index, house ? house.split(" ")[0] : "")} = ${digit}.${house ? ` It is the only possible location in ${house}.` : ""}` }, beforeNotes, eliminations);
  }
  function nakedSubset() { for (const [houseName, house] of units) { const blanks = house.filter(index => notes[index]); for (let size = 2; size <= 4; size += 1) for (const group of choose(blanks, size)) { const union = new Set(group.flatMap(index => [...notes[index]])); if (union.size !== size || group.some(index => notes[index].size < 2 || notes[index].size > size)) continue; const victims = blanks.filter(index => !group.includes(index) && [...notes[index]].some(digit => union.has(digit))); if (!victims.length) continue; const beforeNotes = snapshotNotes(), eliminations = victims.flatMap(index => [...union].filter(digit => notes[index].has(digit)).map(digit => ({ index, digit }))); victims.forEach(index => union.forEach(digit => notes[index].delete(digit))); const technique = `Naked ${subsetName(size)}`; addStep({ technique, index: null, digit: null, house: houseName, text: `${[...union].join(", ")} are confined to ${group.map(index => nameFor(index, houseName.split(" ")[0])).join(" and ")} in ${houseName}. Remove them from ${victims.map(index => nameFor(index, houseName.split(" ")[0])).join(", ")}.` }, beforeNotes, eliminations); return true; } } return false; }
  function hiddenSubset() { for (const [houseName, house] of units) { const blanks = house.filter(index => notes[index]), missing = digits.filter(digit => !house.some(index => values[index] === digit)); for (let size = 2; size <= 4; size += 1) for (const group of choose(missing, size)) { const cells = [...new Set(group.flatMap(digit => blanks.filter(index => notes[index].has(digit))))]; if (cells.length !== size) continue; const beforeNotes = snapshotNotes(), eliminations = cells.flatMap(index => [...notes[index]].filter(digit => !group.includes(digit)).map(digit => ({ index, digit }))); if (!eliminations.length) continue; cells.forEach(index => { notes[index] = new Set([...notes[index]].filter(digit => group.includes(digit))); }); const technique = `Hidden ${subsetName(size)}`; addStep({ technique, index: null, digit: null, house: houseName, text: `${group.join(", ")} can appear only in ${cells.map(index => nameFor(index, houseName.split(" ")[0])).join(" and ")} in ${houseName}. Remove every other candidate from those cells.` }, beforeNotes, eliminations); return true; } } return false; }
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
    if (nakedSubset() || hiddenSubset() || basicFish()) continue;
    const completed = solveExactly(values);
    if (!completed) return found;
    for (const index of active) if (!values[index]) place("Verified completion", index, completed[index], "", `${nameFor(index)} = ${completed[index]}. The verified unique completion fixes this remaining value after the listed named techniques have been exhausted.`);
    return found;
  }
}
let steps = deriveSteps(), mode = "human", stepIndex = 0, selectedCell = null, entryMode = "digit";
function currentValues() { const values = [...original]; if (mode === "human") human.forEach((value, index) => { if (value) values[index] = value; }); else steps.slice(0, stepIndex + 1).forEach(step => { if (step.index !== null) values[step.index] = step.digit; }); return values; }
function addBorders(cell, row, column) {
  if (!hasCell(row - 1, column)) cell.classList.add("edge-top"); if (!hasCell(row, column - 1)) cell.classList.add("edge-left"); if (!hasCell(row + 1, column)) cell.classList.add("edge-bottom"); if (!hasCell(row, column + 1)) cell.classList.add("edge-right");
  if (row % 3 === 0) cell.classList.add("box-top"); if (column % 3 === 0) cell.classList.add("box-left");
}
function makeCandidates(noteDigits, index, eliminations = []) {
  const notation = document.createElement("span"); notation.className = "snyder";
  const removed = new Set(eliminations.filter(item => item.index === index).map(item => item.digit));
  [...new Set([...noteDigits, ...removed])].sort((a, b) => a - b).forEach(digit => { const mark = document.createElement("i"); mark.className = `candidate-${digit}${removed.has(digit) ? " eliminated" : ""}`; mark.textContent = digit; notation.append(mark); });
  return notation;
}
function makeUserCandidates(index) { const notation = document.createElement("span"); notation.className = "snyder"; playNotes[index].forEach(digit => { const mark = document.createElement("i"); mark.className = `candidate-${digit}`; mark.textContent = digit; notation.append(mark); }); return notation; }
function snapshot() { histories[activeDay].push({ values: [...human], notes: playNotes.map(note => [...note]) }); }
function updateEntryControls() { document.querySelectorAll(".entry-button").forEach(button => { button.setAttribute("aria-pressed", String(button.dataset.entry === entryMode)); button.disabled = mode !== "human"; }); document.querySelectorAll(".numpad button, #eraseCell").forEach(button => button.disabled = mode !== "human"); document.querySelector("#undoMove").disabled = mode !== "human" || !histories[activeDay].length; document.querySelector("#resetGrid").disabled = mode !== "human"; }
function applyEntry(digit, index = selectedCell) {
  if (mode !== "human" || index === null || original[index] || (entryMode === "snyder" && human[index])) return;
  snapshot();
  if (entryMode === "snyder") { if (digit === 0) playNotes[index].clear(); else if (playNotes[index].has(digit)) playNotes[index].delete(digit); else playNotes[index].add(digit); }
  else { human[index] = digit; if (digit) playNotes[index].clear(); else playNotes[index].clear(); }
  refresh();
}
function eraseSelected() {
  if (mode !== "human" || selectedCell === null || original[selectedCell]) return;
  snapshot(); human[selectedCell] = 0; playNotes[selectedCell].clear(); refresh();
}
function undoMove() {
  const previous = histories[activeDay].pop(); if (!previous) return;
  human.splice(0, human.length, ...previous.values); previous.notes.forEach((note, index) => { playNotes[index].clear(); note.forEach(digit => playNotes[index].add(digit)); }); refresh();
}
function makeSelectable(cell, index) { cell.addEventListener("click", event => { event.preventDefault(); selectedCell = selectedCell === index ? null : index; board.querySelectorAll(".cell").forEach(item => item.classList.toggle("selected", Number(item.dataset.index) === selectedCell)); if (selectedCell !== null) cell.focus({ preventScroll: true }); }); }
function makeEditable(cell, index) {
  cell.classList.add("editable"); cell.tabIndex = 0; cell.setAttribute("aria-label", `${nameFor(index)}, enter or delete a digit`); makeSelectable(cell, index);
  cell.addEventListener("keydown", event => {
    if (event.key === "Backspace" || event.key === "Delete" || event.key === "0") { event.preventDefault(); applyEntry(0, index); return; }
    if (/^[1-9]$/.test(event.key)) { event.preventDefault(); applyEntry(Number(event.key), index); }
  });
  cell.addEventListener("paste", event => { event.preventDefault(); const digit = event.clipboardData.getData("text").match(/[1-9]/)?.[0]; if (digit) applyEntry(Number(digit), index); });
}
function renderStep() { const step = steps[stepIndex], tally = steps.reduce((counts, item) => ({ ...counts, [item.technique]: (counts[item.technique] || 0) + 1 }), {}); document.querySelector("#stepCount").textContent = `Step ${stepIndex + 1} of ${steps.length}`; document.querySelector("#stepTechnique").textContent = step.technique; document.querySelector("#stepReasoning").textContent = step.text; document.querySelector("#techniqueTally").textContent = `Technique tally: ${Object.entries(tally).map(([name, count]) => `${name} ${count}`).join(" · ")}`; document.querySelector("#firstStep").disabled = stepIndex === 0; document.querySelector("#previousStep").disabled = stepIndex === 0; document.querySelector("#nextStep").disabled = stepIndex === steps.length - 1; document.querySelector("#lastStep").disabled = stepIndex === steps.length - 1; }
function renderBoard() {
  const values = currentValues(), activeStep = mode === "solver" ? steps[stepIndex] : null, activeHouse = activeStep?.house || "", highlighted = activeStep?.highlight || (activeHouse ? units.find(([label]) => label === activeHouse)?.[1] || [] : []), solverNotes = activeStep?.beforeNotes || {};
  board.innerHTML = "";
  for (let row = 0; row < 12; row += 1) for (let column = 0; column < 12; column += 1) {
    if (!hasCell(row, column)) continue;
    const index = row * 12 + column, cell = document.createElement("div"); cell.className = "cell"; cell.dataset.index = index; cell.style.gridColumnStart = column + 1; cell.style.gridRowStart = row + 1;
    if (row >= 3 && column >= 3 && row < 9 && column < 9) cell.classList.add("shared"); if (original[index]) cell.classList.add("given"); if (mode === "human" && human[index] && [...peers[index]].some(peer => values[peer] === human[index])) cell.classList.add("conflict"); if (highlighted.includes(index)) cell.classList.add("affected-house"); if (mode === "solver" && steps[stepIndex].index === index) cell.classList.add("focus"); if (index === selectedCell) cell.classList.add("selected"); addBorders(cell, row, column);
    if (values[index]) { cell.textContent = values[index]; if (mode === "human" && !original[index]) makeEditable(cell, index); else makeSelectable(cell, index); } else if (mode === "solver") { cell.append(makeCandidates(solverNotes[index] || candidates(values, index), index, activeStep?.eliminations || [])); makeSelectable(cell, index); } else { if (playNotes[index].size) cell.append(makeUserCandidates(index)); makeEditable(cell, index); }
    board.append(cell);
  }
}
function refresh() { renderStep(); renderBoard(); const givens = original.filter((value, index) => active.includes(index) && value).length, rating = rateSteps(steps); givenCount.textContent = `${givens} given cells`; document.querySelector("#difficultyLabel").textContent = `Difficulty: ${rating.rating} (${rating.score})`; solutionToggle.setAttribute("aria-pressed", String(mode === "solver")); boardCard.classList.toggle("solver-active", mode === "solver"); updateEntryControls(); setTimerRunning(mode === "human"); }
function loadPuzzle(day) { activeDay = day; rows = puzzles[day].rows; puzzleDate = puzzles[day].date; original.fill(0); rows.forEach((row, r) => [...row].forEach((value, c) => { if (value !== ".") original[r * 12 + c] = Number(value); })); human = userInputs[day]; playNotes = userNotes[day]; selectedCell = null; steps = deriveSteps(); stepIndex = 0; document.querySelectorAll(".day-button").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.day === day))); refresh(); }
let elapsedSeconds = 0, timerBase = Date.now(), timerRunning = true;
function showTimer() { const minutes = Math.floor(elapsedSeconds / 60), seconds = elapsedSeconds % 60; document.querySelector("#timer").textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`; }
function setTimerRunning(running) { if (timerRunning === running) return; if (timerRunning) elapsedSeconds += Math.floor((Date.now() - timerBase) / 1000); timerRunning = running; timerBase = Date.now(); showTimer(); }
function resetTimer() { elapsedSeconds = 0; timerBase = Date.now(); showTimer(); }
setInterval(() => { if (timerRunning) { elapsedSeconds += Math.floor((Date.now() - timerBase) / 1000); timerBase = Date.now(); showTimer(); } }, 1000);
document.querySelector("#firstStep").addEventListener("click", () => { stepIndex = 0; refresh(); }); document.querySelector("#previousStep").addEventListener("click", () => { if (stepIndex > 0) { stepIndex -= 1; refresh(); } }); document.querySelector("#nextStep").addEventListener("click", () => { if (stepIndex < steps.length - 1) { stepIndex += 1; refresh(); } }); document.querySelector("#lastStep").addEventListener("click", () => { stepIndex = steps.length - 1; refresh(); });
solutionToggle.addEventListener("click", () => { mode = mode === "human" ? "solver" : "human"; guide.classList.toggle("hidden", mode === "human"); refresh(); });
document.querySelectorAll(".day-button").forEach(button => button.addEventListener("click", () => loadPuzzle(button.dataset.day)));
document.querySelectorAll(".entry-button").forEach(button => button.addEventListener("click", () => { entryMode = button.dataset.entry; updateEntryControls(); }));
document.querySelectorAll(".numpad [data-key]").forEach(button => button.addEventListener("click", () => applyEntry(Number(button.dataset.key))));
document.querySelectorAll("[data-action=erase]").forEach(button => button.addEventListener("click", eraseSelected));
document.querySelector("#undoMove").addEventListener("click", undoMove);
document.querySelector("#resetGrid").addEventListener("click", () => { human.fill(0); playNotes.forEach(note => note.clear()); histories[activeDay].length = 0; selectedCell = null; refresh(); });
document.addEventListener("keydown", event => { if ((event.key === "Backspace" || event.key === "Delete") && selectedCell !== null && !event.target.closest(".editable")) { event.preventDefault(); eraseSelected(); } });
document.querySelector("#resetTimer").addEventListener("click", resetTimer);
document.querySelectorAll(".grid-button").forEach(button => button.addEventListener("click", () => { const grid = button.dataset.grid, selected = button.getAttribute("aria-pressed") !== "true"; document.querySelectorAll(".grid-button").forEach(item => item.setAttribute("aria-pressed", "false")); board.querySelectorAll(".cell").forEach(cell => cell.classList.remove("grid-a", "grid-b")); if (selected) { board.querySelectorAll(".cell").forEach(cell => { const index = Number(cell.dataset.index), row = Math.floor(index / 12), column = index % 12; if ((grid === "a" && row < 9 && column < 9) || (grid === "b" && row >= 3 && column >= 3)) cell.classList.add(`grid-${grid}`); }); button.setAttribute("aria-pressed", "true"); } }));
document.querySelector("#copyPng").addEventListener("click", async () => {
  const scale = 60, gridSize = scale * 12, margin = gridSize / 18, canvas = document.createElement("canvas"), context = canvas.getContext("2d"), values = currentValues(); canvas.width = canvas.height = gridSize + margin * 2; context.fillStyle = "#fff"; context.fillRect(0, 0, canvas.width, canvas.height); context.translate(margin, margin);
  for (let row = 0; row < 12; row += 1) for (let column = 0; column < 12; column += 1) if (hasCell(row, column)) { context.fillStyle = row >= 3 && column >= 3 && row < 9 && column < 9 ? "#fff1c7" : "#fff"; context.fillRect(column * scale, row * scale, scale, scale); context.strokeStyle = "#9aa6a8"; context.lineWidth = 1; context.strokeRect(column * scale, row * scale, scale, scale); const value = values[row * 12 + column]; if (value) { context.fillStyle = original[row * 12 + column] ? "#111" : "#1c6fa1"; context.font = "28px sans-serif"; context.textAlign = "center"; context.textBaseline = "middle"; context.fillText(value, (column + .5) * scale, (row + .53) * scale); } }
  context.strokeStyle = "#173a4c"; context.lineWidth = 3; [[0, 0, 9, 9], [3, 3, 9, 9]].forEach(([x, y, width, height]) => context.strokeRect(x * scale, y * scale, width * scale, height * scale)); [3, 6].forEach(n => { context.beginPath(); context.moveTo(n * scale, 0); context.lineTo(n * scale, 9 * scale); context.stroke(); context.beginPath(); context.moveTo(0, n * scale); context.lineTo(9 * scale, n * scale); context.stroke(); }); [6, 9].forEach(n => { context.beginPath(); context.moveTo(n * scale, 3 * scale); context.lineTo(n * scale, 12 * scale); context.stroke(); context.beginPath(); context.moveTo(3 * scale, n * scale); context.lineTo(12 * scale, n * scale); context.stroke(); });
  context.fillStyle = "#52656b"; context.font = "12px sans-serif"; context.textAlign = "right"; context.textBaseline = "middle"; context.fillText("gattai-sudoku.vercel.app", gridSize, gridSize + margin * .55);
  const button = document.querySelector("#copyPng"); try { const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png")); await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]); button.textContent = "Image copied"; } catch { button.textContent = "Image copy unavailable"; } setTimeout(() => { button.textContent = "Copy as a picture"; }, 2000);
});
const howToPlayDialog = document.querySelector("#howToPlayDialog"); document.querySelector("#howToPlay").addEventListener("click", () => howToPlayDialog.showModal()); document.querySelector("#closeHowToPlay").addEventListener("click", () => howToPlayDialog.close()); howToPlayDialog.addEventListener("click", event => { if (event.target === howToPlayDialog) howToPlayDialog.close(); });
document.querySelector("#themeToggle").addEventListener("click", () => { const button = document.querySelector("#themeToggle"), dark = document.body.classList.toggle("dark"); button.classList.toggle("is-dark", dark); button.setAttribute("aria-label", dark ? "Use light mode" : "Use dark mode"); });
refresh();
