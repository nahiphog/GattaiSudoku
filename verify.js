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
  const walkthrough = document.querySelector("#walkthrough");
  const walkthroughRating = document.querySelector("#walkthroughRating");
  const walkthroughSteps = document.querySelector("#walkthroughSteps");
  const tallyButton = document.querySelector("#walkthroughTally");
  const tallyResults = document.querySelector("#tallyResults");
  let verifiedSolution = null, verifiedGivens = new Set();
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
  function clearResults() { solutionResults.replaceChildren(); verifiedSolution = null; verifiedGivens = new Set(); evaluateButton.hidden = true; walkthrough.hidden = true; tallyResults.hidden = true; }
  function cellName(index) { const row = Math.floor(index / 12), column = index % 12; return row < 9 && column < 9 ? `Grid 1: R${row + 1}C${column + 1}` : `Grid 2: R${row - 2}C${column - 2}`; }
  function buildWalkthrough(solution, givens) {
    const working = Array(144).fill(0); givens.forEach(index => { working[index] = solution[index]; }); const steps = [];
    const candidatesFor = index => { const used = new Set(); housesFor[index].forEach(house => house.forEach(other => { if (working[other]) used.add(working[other]); })); return digits.filter(digit => !used.has(digit)); };
    while (active.some(index => !working[index])) {
      let placed = false;
      for (const index of active) if (!working[index]) { const options = candidatesFor(index); if (options.length === 1) { working[index] = options[0]; steps.push({ technique: "Naked Single", index, digit: options[0], text: `${cellName(index)} has only one candidate: ${options[0]}.` }); placed = true; break; } }
      if (placed) continue;
      for (const [houseName, house] of units) {
        const missing = digits.filter(digit => !house.some(index => working[index] === digit));
        for (const digit of missing) { const locations = house.filter(index => !working[index] && candidatesFor(index).includes(digit)); if (locations.length === 1) { const index = locations[0]; working[index] = digit; steps.push({ technique: "Hidden Single", index, digit, text: `${digit} appears in only one open cell of ${houseName}: ${cellName(index)}.` }); placed = true; break; } }
        if (placed) break;
      }
      if (placed) continue;
      // The verified unique solution supplies the forced value. This is stated
      // plainly rather than mislabelling a search-derived value as a technique.
      const index = active.filter(cell => !working[cell]).sort((left, right) => candidatesFor(left).length - candidatesFor(right).length)[0];
      working[index] = solution[index]; steps.push({ technique: "Unique-solution deduction", index, digit: solution[index], text: `${cellName(index)} is fixed to ${solution[index]} by the verified unique completion.` });
    }
    return steps;
  }
  function renderWalkthrough() {
    const steps = buildWalkthrough(verifiedSolution, verifiedGivens), tally = new Map(); walkthroughSteps.replaceChildren();
    steps.forEach((step, index) => { tally.set(step.technique, [...(tally.get(step.technique) || []), index + 1]); const item = document.createElement("li"); item.innerHTML = `<strong>Step ${index + 1}: ${step.technique}</strong> — ${step.text}`; walkthroughSteps.append(item); });
    const usesSearch = tally.has("Unique-solution deduction"); walkthroughRating.textContent = usesSearch ? "Difficulty: Over 9000 (a named-technique-only path did not complete the grid)." : "Difficulty: Singles.";
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
    const result = countSolutions();
    clearResults();
    if (result.issue) setStatus(result.issue, "error");
    else if (result.count === 1) { verifiedSolution = result.solutions[0]; verifiedGivens = new Set(active.filter(index => values[index])); setStatus("Verified: this puzzle has exactly one solution.", "success"); showSolution(verifiedSolution, new Set(), "Completed grid", verifiedGivens); evaluateButton.hidden = false; }
    else if (result.count === 0) setStatus("This puzzle has no valid solution.", "error");
    else {
      setStatus("This puzzle has multiple solutions. The orange cells differ.", "error");
      const differences = new Set(active.filter(index => result.solutions[0][index] !== result.solutions[1][index]));
      const givens = new Set(active.filter(index => values[index])); showSolution(result.solutions[0], differences, "Solution 1", givens); showSolution(result.solutions[1], differences, "Solution 2", givens);
    }
  });
  evaluateButton.addEventListener("click", renderWalkthrough);
  tallyButton.addEventListener("click", () => { tallyResults.hidden = !tallyResults.hidden; tallyButton.textContent = tallyResults.hidden ? "Technique tally" : "Hide technique tally"; });
  document.querySelector("#clearGrid").addEventListener("click", () => { values.fill(0); clearResults(); setStatus(""); render(); });
  document.querySelector("#importString").addEventListener("click", () => { const issue = parseString(stringBox.value); clearResults(); setStatus(issue || "String imported. Fill or edit any cell, then check uniqueness.", issue ? "error" : "success"); render(); });
  document.querySelector("#exportString").addEventListener("click", async () => { const output = values.map((value, index) => activeSet.has(index) ? (value || ".") : ".").join(""); try { await navigator.clipboard.writeText(output); setStatus("144-character string copied.", "success"); } catch { setStatus("Unable to access the clipboard.", "error"); } });
  render();
})();
