"use strict";

// Pure, server-safe solver primitives.  There is deliberately no DOM, request,
// or global puzzle state in this module: every operation starts with `givens`.
const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const units = [];
for (const [grid, rowOffset, columnOffset] of [["G1", 0, 0], ["G2", 3, 3]]) {
  for (let n = 0; n < 9; n += 1) {
    units.push([`${grid} row ${n + 1}`, Array.from({ length: 9 }, (_, column) => (rowOffset + n) * 12 + columnOffset + column)]);
    units.push([`${grid} column ${n + 1}`, Array.from({ length: 9 }, (_, row) => (rowOffset + row) * 12 + columnOffset + n)]);
  }
  for (let boxRow = 0; boxRow < 3; boxRow += 1) for (let boxColumn = 0; boxColumn < 3; boxColumn += 1) {
    units.push([`${grid} box ${boxRow + 1},${boxColumn + 1}`, Array.from({ length: 9 }, (_, n) => (rowOffset + boxRow * 3 + Math.floor(n / 3)) * 12 + columnOffset + boxColumn * 3 + (n % 3))]);
  }
}
const active = [...new Set(units.flatMap(([, cells]) => cells))];
const peers = Object.fromEntries(active.map(index => [index, new Set(units.filter(([, cells]) => cells.includes(index)).flatMap(([, cells]) => cells).filter(cell => cell !== index))]));

function normalizePuzzle(puzzle) {
  const rows = Array.isArray(puzzle) ? puzzle : puzzle?.rows;
  if (!Array.isArray(rows) || rows.length !== 12 || rows.some(row => typeof row !== "string" || row.length !== 12 || /[^.1-9]/.test(row))) throw new Error("Puzzle must contain twelve 12-character rows.");
  const values = Array(144).fill(0);
  rows.forEach((row, rowIndex) => [...row].forEach((value, columnIndex) => { if (value !== ".") values[rowIndex * 12 + columnIndex] = Number(value); }));
  return values;
}

const candidates = (values, index) => digits.filter(digit => ![...peers[index]].some(peer => values[peer] === digit));
function findSolution(givens) {
  const values = [...givens];
  function search() {
    let choice = -1, options = null;
    for (const index of active) if (!values[index]) {
      const possible = candidates(values, index);
      if (!possible.length) return false;
      if (!options || possible.length < options.length) { choice = index; options = possible; }
    }
    if (choice === -1) return true;
    for (const digit of options) { values[choice] = digit; if (search()) return true; }
    values[choice] = 0;
    return false;
  }
  return search() ? values : null;
}
function nameFor(index, grid = "") {
  const row = Math.floor(index / 12), column = index % 12, names = [];
  if (row < 9 && column < 9 && grid !== "G2") names.push(`G1 R${row + 1}C${column + 1}`);
  if (row >= 3 && column >= 3 && grid !== "G1") names.push(`G2 R${row - 2}C${column - 2}`);
  return names.join(" / ");
}
const copyNotes = notes => Object.fromEntries(Object.entries(notes).map(([index, values]) => [index, [...values]]));

function deriveSteps(puzzle) {
  const values = normalizePuzzle(puzzle), solution = findSolution(values);
  if (!solution) throw new Error("Puzzle has no solution.");
  const notes = Object.fromEntries(active.filter(index => !values[index]).map(index => [index, new Set(candidates(values, index))]));
  const steps = [];
  const add = (step, beforeNotes, eliminations = []) => steps.push({ ...step, beforeNotes, eliminations, grid: step.grid || step.house?.slice(0, 2) || "G1" });
  const place = (technique, index, digit, house = "") => {
    const beforeNotes = copyNotes(notes), eliminations = [...peers[index]].filter(peer => notes[peer]?.has(digit)).map(peer => ({ index: peer, digit }));
    values[index] = digit; delete notes[index]; peers[index].forEach(peer => notes[peer]?.delete(digit));
    add({ technique, index, digit, house, text: `${nameFor(index, house.slice(0, 2))} = ${digit}.${house ? ` It is the only possible location in ${house}.` : ""}` }, beforeNotes, eliminations);
  };
  while (!active.every(index => values[index])) {
    let move = null;
    for (const [house, cells] of units) {
      const empty = cells.filter(index => !values[index]);
      const missing = digits.filter(digit => !cells.some(index => values[index] === digit));
      if (empty.length === 1 && missing.length === 1) { move = ["Full House", empty[0], missing[0], house]; break; }
    }
    if (!move) for (const index of active) if (!values[index] && notes[index].size === 1) { move = ["Naked Single", index, [...notes[index]][0]]; break; }
    if (!move) for (const [house, cells] of units) for (const digit of digits) {
      const positions = cells.filter(index => !values[index] && notes[index]?.has(digit));
      if (positions.length === 1) { move = ["Hidden Single", positions[0], digit, house]; break; }
    }
    if (move) { place(...move); continue; }
    // The initial server module deliberately records an explicit search step
    // instead of falsely labelling an unsupported advanced deduction.
    const index = active.filter(cell => !values[cell]).sort((left, right) => notes[left].size - notes[right].size || left - right)[0];
    const digit = solution[index], beforeNotes = copyNotes(notes), eliminations = [...notes[index]].filter(candidate => candidate !== digit).map(candidate => ({ index, digit: candidate }));
    values[index] = digit; delete notes[index]; peers[index].forEach(peer => notes[peer]?.delete(digit));
    add({ technique: "Trial and error", index, digit, text: `${nameFor(index)} = ${digit} is selected by a search branch after the available server deductions are exhausted.` }, beforeNotes, eliminations);
  }
  return { solution, steps };
}

module.exports = { deriveSteps, findSolution, normalizePuzzle };
