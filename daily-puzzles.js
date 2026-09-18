/*
  Daily schedule derived from the rotational-pair database.

  Every published board is used at most once. The schedule begins on
  1 January 2026 and assigns a board only when its assessed difficulty
  meets that weekday's stated range. Dates without a matching board stay empty.
*/
(() => {
  const source = [...(window.ROTATIONAL_PUZZLE_DATABASE || [])];
  const byRating = rating => source.filter(item => item.rating === rating);
  const queues = {
    easy: byRating("Easy"),
    medium: byRating("Medium"),
    tricky: byRating("Tricky"),
    hard: byRating("Hard"),
    sunday: [...byRating("Unfair"), ...byRating("Extreme"), ...byRating("Nightmare")]
  };
  const dateFormat = new Intl.DateTimeFormat("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC"
  });
  // Preserve puzzle validity while varying a repeated clue mask through the
  // Gattai layout's four symmetries: identity, transpose, half-turn, and
  // anti-diagonal reflection.  Each maps both 9x9 grids cleanly onto grids.
  const transforms = {
    identity: (row, column) => [row, column],
    transpose: (row, column) => [column, row],
    halfTurn: (row, column) => [11 - row, 11 - column],
    antiDiagonal: (row, column) => [11 - column, 11 - row]
  };
  const transformedRows = (rows, transform) => {
    const output = Array.from({ length: 12 }, () => Array(12).fill("."));
    rows.forEach((line, row) => [...line].forEach((value, column) => {
      if (value === ".") return;
      const [targetRow, targetColumn] = transforms[transform](row, column);
      output[targetRow][targetColumn] = value;
    }));
    return output.map(line => line.join(""));
  };
  const layoutOf = rows => rows.join("").replace(/[1-9]/g, "#");
  const usedLayouts = new Set(), usedPuzzleIds = new Set();
  const take = queue => {
    for (let index = 0; index < queue.length; index += 1) {
      const puzzle = queue[index];
      if (usedPuzzleIds.has(puzzle.id)) continue;
      const variant = Object.keys(transforms)
        .map(transform => transformedRows(puzzle.rows, transform))
        .find(rows => !usedLayouts.has(layoutOf(rows)));
      if (!variant) continue;
      queue.splice(index, 1);
      usedPuzzleIds.add(puzzle.id);
      usedLayouts.add(layoutOf(variant));
      return { ...puzzle, rows: variant };
    }
    return null;
  };
  const scheduled = {};
  let current = new Date(Date.UTC(2026, 7, 1));
  const ends = new Date(Date.UTC(2026, 11, 1));

  // Assign chronologically, one date at a time, with the weekday's intended
  // difficulty band. This deliberately leaves later dates to a future run.
  while (current <= ends) {
    const weekday = current.getUTCDay();
    let puzzle = null;
    if (weekday === 1 || weekday === 2) puzzle = take(queues.easy);
    else if (weekday === 3) puzzle = take(queues.easy) || take(queues.medium);
    else if (weekday === 4) puzzle = take(queues.medium);
    else if (weekday === 5) puzzle = take(queues.medium) || take(queues.tricky);
    else if (weekday === 6) puzzle = take(queues.tricky) || take(queues.hard);
    else if (weekday === 0) puzzle = take(queues.sunday);
    if (puzzle) {
      const key = current.toISOString().slice(0, 10);
      scheduled[key] = {
        date: dateFormat.format(current),
        rows: puzzle.rows,
        scheduledRating: puzzle.rating,
        scheduledScore: puzzle.score,
        scheduledTrial: puzzle.trial
      };
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  window.ROTATIONAL_ARCHIVE = scheduled;
  window.ROTATIONAL_ARCHIVE_SCHEDULE = {
    starts: "2026-08-01",
    ends: "2026-12-01",
    count: Object.keys(scheduled).length
  };
})();
