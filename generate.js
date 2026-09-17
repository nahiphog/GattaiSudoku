(() => {
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9], units = [];
  for (const [name, rowOffset, columnOffset] of [["Grid 1", 0, 0], ["Grid 2", 3, 3]]) {
    for (let number = 0; number < 9; number += 1) {
      units.push([`${name} row ${number + 1}`, Array.from({ length: 9 }, (_, column) => (rowOffset + number) * 12 + columnOffset + column)]);
      units.push([`${name} column ${number + 1}`, Array.from({ length: 9 }, (_, row) => (rowOffset + row) * 12 + columnOffset + number)]);
    }
    for (let boxRow = 0; boxRow < 3; boxRow += 1) for (let boxColumn = 0; boxColumn < 3; boxColumn += 1) units.push([`${name} house ${boxRow + 1},${boxColumn + 1}`, Array.from({ length: 9 }, (_, cell) => (rowOffset + boxRow * 3 + Math.floor(cell / 3)) * 12 + columnOffset + boxColumn * 3 + cell % 3)]);
  }
  const active = [...new Set(units.flatMap(([, house]) => house))];
  const housesFor = Object.fromEntries(active.map(index => [index, units.filter(([, house]) => house.includes(index)).map(([, house]) => house)]));
  const hasCell = (row, column) => (row < 9 && column < 9) || (row >= 3 && column >= 3);
  const shuffle = items => { const result = [...items]; for (let index = result.length - 1; index > 0; index -= 1) { const pick = Math.floor(Math.random() * (index + 1)); [result[index], result[pick]] = [result[pick], result[index]]; } return result; };
  const pause = () => new Promise(resolve => window.setTimeout(resolve, 0));
  const countGivens = values => active.reduce((total, index) => total + Boolean(values[index]), 0);
  function candidates(values, index) { const used = new Set(); housesFor[index].forEach(house => house.forEach(other => { if (values[other]) used.add(values[other]); })); return digits.filter(digit => !used.has(digit)); }
  function countSolutions(givens, limit = 2) {
    const values = [...givens];
    function search() {
      let choice = -1, options = null;
      for (const index of active) if (!values[index]) { const possible = candidates(values, index); if (!possible.length) return 0; if (!options || possible.length < options.length) { choice = index; options = possible; } }
      if (choice === -1) return 1;
      let total = 0;
      for (const digit of options) { values[choice] = digit; total += search(); values[choice] = 0; if (total >= limit) return total; }
      return total;
    }
    return search();
  }
  function solveNine(givens) {
    const values = [...givens];
    function options(index) { const row = Math.floor(index / 9), column = index % 9, boxRow = Math.floor(row / 3) * 3, boxColumn = Math.floor(column / 3) * 3, used = new Set(); for (let n = 0; n < 9; n += 1) { used.add(values[row * 9 + n]); used.add(values[n * 9 + column]); } for (let r = 0; r < 3; r += 1) for (let c = 0; c < 3; c += 1) used.add(values[(boxRow + r) * 9 + boxColumn + c]); return shuffle(digits.filter(digit => !used.has(digit))); }
    function search() { let choice = -1, choices = null; for (let index = 0; index < 81; index += 1) if (!values[index]) { const possible = options(index); if (!possible.length) return false; if (!choices || possible.length < choices.length) { choice = index; choices = possible; } } if (choice === -1) return true; for (const digit of choices) { values[choice] = digit; if (search()) return true; } values[choice] = 0; return false; }
    return search() ? values : null;
  }
  function fullGattai() {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const one = solveNine(Array(81).fill(0)); if (!one) continue;
      const secondGivens = Array(81).fill(0); for (let row = 0; row < 6; row += 1) for (let column = 0; column < 6; column += 1) secondGivens[row * 9 + column] = one[(row + 3) * 9 + column + 3];
      const two = solveNine(secondGivens); if (!two) continue;
      const all = Array(144).fill(0); for (let row = 0; row < 9; row += 1) for (let column = 0; column < 9; column += 1) all[row * 12 + column] = one[row * 9 + column];
      for (let row = 0; row < 9; row += 1) for (let column = 0; column < 9; column += 1) all[(row + 3) * 12 + column + 3] = two[row * 9 + column];
      return all;
    }
    throw new Error("Could not construct a compatible Gattai solution.");
  }
  const addLines = grid => {
    [["h", 0, 0, 9], ["h", 3, 0, 12], ["h", 6, 0, 12], ["h", 9, 0, 12], ["h", 12, 3, 9]].forEach(([kind, position, start, length]) => { const line = document.createElement("span"); line.className = `generator-line ${kind}`; line.style.top = `${position / 12 * 100}%`; line.style.left = `${start / 12 * 100}%`; line.style.width = `${length / 12 * 100}%`; grid.append(line); });
    [["v", 0, 0, 9], ["v", 3, 0, 12], ["v", 6, 0, 12], ["v", 9, 0, 12], ["v", 12, 3, 9]].forEach(([kind, position, start, length]) => { const line = document.createElement("span"); line.className = `generator-line ${kind}`; line.style.left = `${position / 12 * 100}%`; line.style.top = `${start / 12 * 100}%`; line.style.height = `${length / 12 * 100}%`; grid.append(line); });
  };
  const buildGrid = document.querySelector("#buildGrid"), keep = new Set(), empty = new Set(), buildCounts = document.querySelector("#buildCounts"); let mark = "keep";
  function renderBuildGrid() { buildGrid.replaceChildren(); for (let row = 0; row < 12; row += 1) for (let column = 0; column < 12; column += 1) { const index = row * 12 + column, node = document.createElement("button"); node.type = "button"; node.className = "generator-cell pick"; node.style.gridRowStart = row + 1; node.style.gridColumnStart = column + 1; if (!hasCell(row, column)) node.classList.add("inactive"); else { if (keep.has(index)) node.classList.add("keep"); if (empty.has(index)) node.classList.add("empty"); node.addEventListener("click", () => { const target = mark === "keep" ? keep : empty, other = mark === "keep" ? empty : keep; target.has(index) ? target.delete(index) : (other.delete(index), target.add(index)); renderBuildGrid(); }); } buildGrid.append(node); } addLines(buildGrid); buildCounts.textContent = `${keep.size} must keep · ${empty.size} must be empty`; }
  function renderResult(target, values, clues, solved) { target.replaceChildren(); for (let row = 0; row < 12; row += 1) for (let column = 0; column < 12; column += 1) { const index = row * 12 + column, node = document.createElement("span"); node.className = "generator-cell"; node.style.gridRowStart = row + 1; node.style.gridColumnStart = column + 1; if (!hasCell(row, column)) node.classList.add("inactive"); else if (values[index]) { node.textContent = values[index]; if (solved && !clues[index]) node.classList.add("solved"); } target.append(node); } addLines(target); }
  const resultPanel = document.querySelector("#resultPanel"), resultPuzzle = document.querySelector("#puzzleResult"), resultSolution = document.querySelector("#solutionResult"), resultGivens = document.querySelector("#resultGivens"), resultUnique = document.querySelector("#resultUnique"); let lastPuzzle = null;
  function present(puzzle, solution) { renderResult(resultPuzzle, puzzle, puzzle, false); renderResult(resultSolution, solution, puzzle, true); resultGivens.textContent = `${countGivens(puzzle)} given cells`; resultUnique.textContent = "Unique solution: confirmed"; resultPanel.hidden = false; lastPuzzle = puzzle; }
  document.querySelector("#copyResult").addEventListener("click", async () => { if (!lastPuzzle) return; const text = lastPuzzle.map((value, index) => active.includes(index) ? value || "." : ".").join(""); try { await navigator.clipboard.writeText(text); document.querySelector("#copyResult").textContent = "Copied"; } catch { document.querySelector("#copyResult").textContent = "Copy unavailable"; } setTimeout(() => { document.querySelector("#copyResult").textContent = "Copy 144-character string"; }, 1500); });
  const digStatus = document.querySelector("#digStatus"), startDig = document.querySelector("#startDigging"), haltDig = document.querySelector("#haltDigging"); let stopDigging = false;
  haltDig.addEventListener("click", () => { stopDigging = true; haltDig.disabled = true; });
  startDig.addEventListener("click", async () => { const began = performance.now(), cap = Number(document.querySelector("#digTimeCap").value) || 0, stopText = document.querySelector("#digStopAt").value, stopAt = stopText === "" ? null : Math.max(0, Math.min(126, Number(stopText))), dual = document.querySelector("#digCellMode").value === "dual"; stopDigging = false; startDig.disabled = true; haltDig.disabled = false; resultPanel.hidden = true; try { const solution = fullGattai(), puzzle = [...solution]; let changed = true; while (changed && !stopDigging && (!cap || performance.now() - began < cap * 1000)) { changed = false; const cells = shuffle(active.filter(index => puzzle[index])); while (cells.length && !stopDigging && (!cap || performance.now() - began < cap * 1000)) { const group = cells.splice(0, dual ? 2 : 1).filter(index => puzzle[index]); if (!group.length || (stopAt !== null && countGivens(puzzle) - group.length < stopAt)) continue; const saved = group.map(index => puzzle[index]); group.forEach(index => { puzzle[index] = 0; }); if (countSolutions(puzzle, 2) === 1) changed = true; else group.forEach((index, position) => { puzzle[index] = saved[position]; }); digStatus.textContent = `Digging the puzzle now. ${countGivens(puzzle)} cells remaining · ${Math.floor((performance.now() - began) / 1000)}s`; await pause(); } } if (countSolutions(puzzle, 2) === 1) { present(puzzle, solution); digStatus.textContent = `Finished in ${Math.floor((performance.now() - began) / 1000)}s.`; } else digStatus.textContent = "Generation halted before a uniquely solvable puzzle was ready."; } catch { digStatus.textContent = "Generation failed. Please try again."; } finally { startDig.disabled = false; haltDig.disabled = true; } });
  const buildStatus = document.querySelector("#buildStatus"), startBuild = document.querySelector("#startBuild"), haltBuild = document.querySelector("#haltBuild"); let stopBuild = false;
  for (let extra = 0; extra <= 30; extra += 1) { const option = document.createElement("option"); option.value = extra; option.textContent = extra; if (extra === 30) option.selected = true; document.querySelector("#buildExtra").append(option); }
  document.querySelectorAll("[data-mark]").forEach(button => button.addEventListener("click", () => { mark = button.dataset.mark; document.querySelectorAll("[data-mark]").forEach(item => item.setAttribute("aria-pressed", String(item === button))); }));
  haltBuild.addEventListener("click", () => { stopBuild = true; haltBuild.disabled = true; });
  startBuild.addEventListener("click", async () => { const began = performance.now(), maximum = Number(document.querySelector("#buildExtra").value); stopBuild = false; startBuild.disabled = true; haltBuild.disabled = false; resultPanel.hidden = true; let attempt = 0; try { while (!stopBuild) { attempt += 1; const solution = fullGattai(), puzzle = Array(144).fill(0); keep.forEach(index => { puzzle[index] = solution[index]; }); const available = shuffle(active.filter(index => !keep.has(index) && !empty.has(index))); let added = 0; while (!stopBuild && countSolutions(puzzle, 2) !== 1 && available.length && added < maximum) { const cell = available.pop(); puzzle[cell] = solution[cell]; added += 1; buildStatus.textContent = `Building · attempt ${attempt} · ${countGivens(puzzle)} givens · ${Math.floor((performance.now() - began) / 1000)}s`; await pause(); } if (stopBuild) break; if (countSolutions(puzzle, 2) === 1) { present(puzzle, solution); buildStatus.textContent = `Finished with a verified unique solution in ${Math.floor((performance.now() - began) / 1000)}s.`; break; } buildStatus.textContent = `Restarting with a new solution · attempt ${attempt + 1}`; await pause(); } if (stopBuild) buildStatus.textContent = `Build halted after ${Math.floor((performance.now() - began) / 1000)}s.`; } catch { buildStatus.textContent = "Build failed. Please try again."; } finally { startBuild.disabled = false; haltBuild.disabled = true; } });
  document.querySelectorAll("[data-mode]").forEach(button => button.addEventListener("click", () => { const digging = button.dataset.mode === "digging"; document.querySelector("#diggingPanel").hidden = !digging; document.querySelector("#buildPanel").hidden = digging; document.querySelectorAll("[data-mode]").forEach(item => item.setAttribute("aria-selected", String(item === button))); resultPanel.hidden = true; }));
  renderBuildGrid();
})();
