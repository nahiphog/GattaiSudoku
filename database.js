document.body.classList.toggle("dark", localStorage.getItem("gattai-theme") === "dark");
(() => {
  const difficultyRank = { Beginner: 0, Easy: 1, Medium: 2, Tricky: 3, Hard: 4, Unfair: 5, Extreme: 6, Nightmare: 7 };
  // The catalogue is ordered by difficulty band first, then by the exact
  // score inside that band.  A technique-class floor can make a lower numeric
  // score legitimately rate Medium instead of Easy, so score alone is not a
  // reliable difficulty order.
  const database = [...(window.ROTATIONAL_PUZZLE_DATABASE || [])]
    .sort((left, right) => (difficultyRank[left.rating] - difficultyRank[right.rating]) || left.score - right.score || left.givens - right.givens || Number(left.trial) - Number(right.trial) || left.id - right.id)
    .map((entry, index) => ({ ...entry, id: index + 1 }));
  const active = new Set();
  for (const [rowOffset, columnOffset] of [[0, 0], [3, 3]]) for (let row = 0; row < 9; row += 1) for (let column = 0; column < 9; column += 1) active.add((rowOffset + row) * 12 + columnOffset + column);
  const hasCell = (row, column) => active.has(row * 12 + column);
  const summary = document.querySelector("#databaseSummary"), rows = document.querySelector("#databaseRows"), title = document.querySelector("#databaseTitle"), attributes = document.querySelector("#databaseAttributes"), board = document.querySelector("#databaseBoard");
  const requested = Number(new URLSearchParams(window.location.search).get("puzzle"));
  let selected = database.find(entry => entry.id === requested) || database[0];
  const boundaries = [
    ["horizontal", "h-0"], ["horizontal", "h-3"], ["horizontal", "h-6"], ["horizontal", "h-9"], ["horizontal", "h-12"],
    ["vertical", "v-0"], ["vertical", "v-3"], ["vertical", "v-6"], ["vertical", "v-9"], ["vertical", "v-12"]
  ];
  const difficultyCounts = database.reduce((counts, item) => { counts[item.rating] = (counts[item.rating] || 0) + 1; return counts; }, {});
  summary.textContent = `${database.length} puzzles · ${Object.entries(difficultyCounts).map(([rating, count]) => `${count} ${rating}`).join(" · ")}`;
  function drawBoard(entry) {
    board.replaceChildren();
    entry.rows.forEach((line, row) => [...line].forEach((value, column) => {
      const cell = document.createElement("span");
      cell.className = "database-cell";
      cell.style.gridRowStart = String(row + 1); cell.style.gridColumnStart = String(column + 1);
      if (!hasCell(row, column)) cell.classList.add("inactive"); else cell.textContent = value === "." ? "" : value;
      board.append(cell);
    }));
    boundaries.forEach(([direction, position]) => { const line = document.createElement("span"); line.className = `database-boundary ${direction} ${position}`; board.append(line); });
  }
  function select(entry, updateRoute = true) {
    selected = entry;
    title.textContent = `Puzzle ${entry.id}`;
    attributes.innerHTML = `<span><strong>Difficulty</strong>${entry.rating} (${entry.score})</span><span><strong>Given cells</strong>${entry.givens}</span><span><strong>Trial-and-error</strong>${entry.trial ? "Yes" : "No"}</span>`;
    drawBoard(entry);
    rows.querySelectorAll("tr").forEach(row => row.classList.toggle("selected", Number(row.dataset.id) === entry.id));
    if (updateRoute) window.history.replaceState({ puzzle: entry.id }, "", `/database.html?puzzle=${entry.id}`);
  }
  database.forEach(entry => {
    const row = document.createElement("tr"); row.dataset.id = String(entry.id);
    row.innerHTML = `<td>${entry.id}</td><td>${entry.rating} <small>(${entry.score})</small></td><td>${entry.givens}</td><td>${entry.trial ? "Yes" : "No"}</td><td><button type="button">View</button></td>`;
    row.querySelector("button").addEventListener("click", () => select(entry));
    rows.append(row);
  });
  if (selected) select(selected, false);
})();
