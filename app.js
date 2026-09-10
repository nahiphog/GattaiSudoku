const puzzles = {
  monday: { date: "Monday, September 7, 2026", difficulty: "Easy", rows: ["82......9...", "..7.........", ".9....1.....", "6...8...3...", "....53..14..", ".......2.8..", "...8..6..5.4", ".....7.3....", "....1..5....", "....9.......", "......4...3.", "....7....69."] },
  tuesday: { date: "Tuesday, September 8, 2026", difficulty: "Easy", rows: [".6..........", "8.4...96....", "5.7..4......", "4....2......", ".....859....", "...........3", "6........1.7", "...1.62....4", ".2......9...", ".....4..1...", "......38....", "...91....7.."] }
};
let activeDay = "tuesday", rows = puzzles.tuesday.rows, puzzleDate = puzzles.tuesday.date;
const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
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
const board = document.querySelector("#board"), guide = document.querySelector("#guide"), givenCount = document.querySelector("#givenCount"), solutionToggle = document.querySelector("#solutionToggle");
const original = Array(144).fill(0), userInputs = { monday: Array(144).fill(0), tuesday: Array(144).fill(0) }; let human = userInputs.tuesday;
rows.forEach((row, r) => [...row].forEach((value, c) => { if (value !== ".") original[r * 12 + c] = Number(value); }));
function hasCell(row, column) { return (row >= 0 && row < 9 && column >= 0 && column < 9) || (row >= 3 && row < 12 && column >= 3 && column < 12); }
function nameFor(index, preferredGrid = "") { const row = Math.floor(index / 12), column = index % 12, names = []; if (row < 9 && column < 9 && preferredGrid !== "G2") names.push(`G1 R${row + 1}C${column + 1}`); if (row >= 3 && column >= 3 && preferredGrid !== "G1") names.push(`G2 R${row - 2}C${column - 2}`); return names.join(" / "); }
function candidates(values, index) { return digits.filter(digit => ![...peers[index]].some(peer => values[peer] === digit)); }
function deriveSteps() {
  const values = [...original], found = [];
  while (true) {
    let move = null;
    for (const [label, house] of units) { const blanks = house.filter(index => !values[index]), missing = digits.filter(digit => !house.some(index => values[index] === digit)); if (blanks.length === 1 && missing.length === 1) { move = ["Full House", blanks[0], missing[0], label]; break; } }
    if (!move) for (const index of active) if (!values[index] && candidates(values, index).length === 1) { move = ["Naked Single", index, candidates(values, index)[0], ""]; break; }
    if (!move) for (const [label, house] of units) { for (const digit of digits) { if (house.some(index => values[index] === digit)) continue; const places = house.filter(index => !values[index] && candidates(values, index).includes(digit)); if (places.length === 1) { move = ["Hidden Single", places[0], digit, label]; break; } } if (move) break; }
    if (!move) return found;
    const [technique, index, digit, house] = move; values[index] = digit; found.push({ technique, index, digit, house, text: `${nameFor(index, house ? house.split(" ")[0] : "")} = ${digit}.${house ? ` It is the only possible location in ${house}.` : ""}` });
  }
}
let steps = deriveSteps(), mode = "human", stepIndex = 0;
function currentValues() { const values = [...original]; if (mode === "human") human.forEach((value, index) => { if (value) values[index] = value; }); else steps.slice(0, stepIndex + 1).forEach(step => { values[step.index] = step.digit; }); return values; }
function addBorders(cell, row, column) {
  if (!hasCell(row + 1, column)) cell.classList.add("edge-bottom"); if (!hasCell(row, column + 1)) cell.classList.add("edge-right");
  if (row % 3 === 0) cell.classList.add("box-top"); if (column % 3 === 0) cell.classList.add("box-left");
}
function makeCandidates(values, index) { const notation = document.createElement("span"); notation.className = "snyder"; candidates(values, index).forEach(digit => { const mark = document.createElement("i"); mark.className = `candidate-${digit}`; mark.textContent = digit; notation.append(mark); }); return notation; }
function makeEditable(cell, index) {
  cell.classList.add("editable"); cell.contentEditable = "true"; cell.setAttribute("aria-label", `${nameFor(index)}, enter or delete a digit`);
  cell.addEventListener("keydown", event => {
    if (event.key === "Backspace" || event.key === "Delete") { event.preventDefault(); human[index] = 0; refresh(); return; }
    if (/^[1-9]$/.test(event.key)) { event.preventDefault(); human[index] = Number(event.key); refresh(); }
  });
  cell.addEventListener("paste", event => { event.preventDefault(); const digit = event.clipboardData.getData("text").match(/[1-9]/)?.[0]; if (digit) { human[index] = Number(digit); refresh(); } });
}
function renderStep() { const step = steps[stepIndex]; document.querySelector("#stepCount").textContent = `Step ${stepIndex + 1} of ${steps.length}`; document.querySelector("#stepTechnique").textContent = step.technique; document.querySelector("#stepReasoning").textContent = step.text; document.querySelector("#firstStep").disabled = stepIndex === 0; document.querySelector("#previousStep").disabled = stepIndex === 0; document.querySelector("#nextStep").disabled = stepIndex === steps.length - 1; document.querySelector("#lastStep").disabled = stepIndex === steps.length - 1; }
function renderBoard() {
  const values = currentValues(), activeHouse = mode === "solver" ? steps[stepIndex].house : "", highlighted = activeHouse ? units.find(([label]) => label === activeHouse)?.[1] || [] : [];
  board.innerHTML = "";
  for (let row = 0; row < 12; row += 1) for (let column = 0; column < 12; column += 1) {
    if (!hasCell(row, column)) continue;
    const index = row * 12 + column, cell = document.createElement("div"); cell.className = "cell"; cell.dataset.index = index; cell.style.gridColumnStart = column + 1; cell.style.gridRowStart = row + 1;
    if (row >= 3 && column >= 3 && row < 9 && column < 9) cell.classList.add("shared"); if (original[index]) cell.classList.add("given"); if (highlighted.includes(index)) cell.classList.add("affected-house"); if (mode === "solver" && steps[stepIndex].index === index) cell.classList.add("focus"); addBorders(cell, row, column);
    if (values[index]) { cell.textContent = values[index]; if (mode === "human" && !original[index]) makeEditable(cell, index); } else if (mode === "solver") cell.append(makeCandidates(values, index)); else makeEditable(cell, index);
    board.append(cell);
  }
}
function refresh() { renderStep(); renderBoard(); const givens = original.filter((value, index) => active.includes(index) && value).length; givenCount.textContent = `${givens} given cells`; solutionToggle.setAttribute("aria-pressed", String(mode === "solver")); }
function loadPuzzle(day) { activeDay = day; rows = puzzles[day].rows; puzzleDate = puzzles[day].date; original.fill(0); rows.forEach((row, r) => [...row].forEach((value, c) => { if (value !== ".") original[r * 12 + c] = Number(value); })); human = userInputs[day]; steps = deriveSteps(); stepIndex = 0; document.querySelectorAll(".day-button").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.day === day))); refresh(); }
document.querySelector("#firstStep").addEventListener("click", () => { stepIndex = 0; refresh(); }); document.querySelector("#previousStep").addEventListener("click", () => { if (stepIndex > 0) { stepIndex -= 1; refresh(); } }); document.querySelector("#nextStep").addEventListener("click", () => { if (stepIndex < steps.length - 1) { stepIndex += 1; refresh(); } }); document.querySelector("#lastStep").addEventListener("click", () => { stepIndex = steps.length - 1; refresh(); });
solutionToggle.addEventListener("click", () => { mode = mode === "human" ? "solver" : "human"; guide.classList.toggle("hidden", mode === "human"); refresh(); });
document.querySelectorAll(".day-button").forEach(button => button.addEventListener("click", () => loadPuzzle(button.dataset.day)));
document.querySelectorAll(".grid-button").forEach(button => button.addEventListener("click", () => { const grid = button.dataset.grid, selected = button.getAttribute("aria-pressed") !== "true"; document.querySelectorAll(".grid-button").forEach(item => item.setAttribute("aria-pressed", "false")); board.querySelectorAll(".cell").forEach(cell => cell.classList.remove("grid-a", "grid-b")); if (selected) { board.querySelectorAll(".cell").forEach(cell => { const index = Number(cell.dataset.index), row = Math.floor(index / 12), column = index % 12; if ((grid === "a" && row < 9 && column < 9) || (grid === "b" && row >= 3 && column >= 3)) cell.classList.add(`grid-${grid}`); }); button.setAttribute("aria-pressed", "true"); } }));
document.querySelector("#copyPng").addEventListener("click", async () => {
  const scale = 60, gridSize = scale * 12, margin = gridSize / 18, canvas = document.createElement("canvas"), context = canvas.getContext("2d"), values = currentValues(); canvas.width = canvas.height = gridSize + margin * 2; context.fillStyle = "#fff"; context.fillRect(0, 0, canvas.width, canvas.height); context.translate(margin, margin);
  for (let row = 0; row < 12; row += 1) for (let column = 0; column < 12; column += 1) if (hasCell(row, column)) { context.fillStyle = row >= 3 && column >= 3 && row < 9 && column < 9 ? "#fff1c7" : "#fff"; context.fillRect(column * scale, row * scale, scale, scale); context.strokeStyle = "#9aa6a8"; context.lineWidth = 1; context.strokeRect(column * scale, row * scale, scale, scale); const value = values[row * 12 + column]; if (value) { context.fillStyle = original[row * 12 + column] ? "#111" : "#1c6fa1"; context.font = "28px sans-serif"; context.textAlign = "center"; context.textBaseline = "middle"; context.fillText(value, (column + .5) * scale, (row + .53) * scale); } }
  context.strokeStyle = "#173a4c"; context.lineWidth = 3; [[0, 0, 9, 9], [3, 3, 9, 9]].forEach(([x, y, width, height]) => context.strokeRect(x * scale, y * scale, width * scale, height * scale)); [3, 6].forEach(n => { context.beginPath(); context.moveTo(n * scale, 0); context.lineTo(n * scale, 9 * scale); context.stroke(); context.beginPath(); context.moveTo(0, n * scale); context.lineTo(9 * scale, n * scale); context.stroke(); }); [6, 9].forEach(n => { context.beginPath(); context.moveTo(n * scale, 3 * scale); context.lineTo(n * scale, 12 * scale); context.stroke(); context.beginPath(); context.moveTo(3 * scale, n * scale); context.lineTo(12 * scale, n * scale); context.stroke(); });
  context.fillStyle = "#52656b"; context.font = "12px sans-serif"; context.textAlign = "right"; context.textBaseline = "middle"; context.fillText("gattai-sudoku.vercel.app", gridSize, gridSize + margin * .55);
  const button = document.querySelector("#copyPng"); try { const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png")); await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]); button.textContent = "Image copied"; } catch { button.textContent = "Image copy unavailable"; } setTimeout(() => { button.textContent = "Copy as a picture"; }, 2000);
});
const howToPlayDialog = document.querySelector("#howToPlayDialog"); document.querySelector("#howToPlay").addEventListener("click", () => howToPlayDialog.showModal()); document.querySelector("#closeHowToPlay").addEventListener("click", () => howToPlayDialog.close()); howToPlayDialog.addEventListener("click", event => { if (event.target === howToPlayDialog) howToPlayDialog.close(); });
document.querySelector("#themeToggle").addEventListener("click", () => { const dark = document.body.classList.toggle("dark"); document.querySelector("#themeToggle").setAttribute("aria-label", dark ? "Use light mode" : "Use dark mode"); });
refresh();
