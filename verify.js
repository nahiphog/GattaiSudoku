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
  const values = Array(144).fill(0);
  const board = document.querySelector("#verifyBoard");
  const status = document.querySelector("#verifyStatus");
  const stringBox = document.querySelector("#solutionString");
  const setStatus = (message, kind = "") => { status.textContent = message; status.className = `dialog-status ${kind}`; };
  const conflicts = () => {
    const found = new Set();
    for (const [, unit] of units) for (const digit of digits) {
      const matches = unit.filter(index => values[index] === digit);
      if (matches.length > 1) matches.forEach(index => found.add(index));
    }
    return found;
  };
  function drawBoundaries() {
    [["horizontal", "h-0"], ["horizontal", "h-3"], ["horizontal", "h-6"], ["horizontal", "h-9"], ["horizontal", "h-12"], ["vertical", "v-0"], ["vertical", "v-3"], ["vertical", "v-6"], ["vertical", "v-9"], ["vertical", "v-12"]].forEach(([direction, position]) => {
      const line = document.createElement("span"); line.className = `board-boundary ${direction} ${position}`; board.append(line);
    });
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
  function validate() {
    if (active.some(index => !values[index])) return "Enter a digit in every active cell before verifying.";
    for (const [label, unit] of units) {
      const seen = new Set(unit.map(index => values[index]));
      if (seen.size !== 9 || [...seen].some(value => !digits.includes(value))) return `${label} must contain 1–9 exactly once.`;
    }
    return "";
  }
  document.querySelector("#verifyGrid").addEventListener("click", () => { const issue = validate(); setStatus(issue || "Verified: this is a valid completed Gattai solution.", issue ? "error" : "success"); });
  document.querySelector("#clearGrid").addEventListener("click", () => { values.fill(0); setStatus(""); render(); });
  document.querySelector("#importString").addEventListener("click", () => { const issue = parseString(stringBox.value); setStatus(issue || "String imported. Fill or edit any cell, then verify.", issue ? "error" : "success"); render(); });
  document.querySelector("#exportString").addEventListener("click", async () => { const output = values.map((value, index) => activeSet.has(index) ? (value || ".") : ".").join(""); try { await navigator.clipboard.writeText(output); setStatus("144-character string copied.", "success"); } catch { setStatus("Unable to access the clipboard.", "error"); } });
  render();
})();
