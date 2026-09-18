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
  const take = queue => queue.length ? queue.shift() : null;
  const scheduled = {};
  let current = new Date(Date.UTC(2026, 0, 1));
  const allScheduled = () => Object.values(queues).every(queue => queue.length === 0);

  // Wednesday remains available for future Easy or Medium additions.
  while (!allScheduled()) {
    const weekday = current.getUTCDay();
    let puzzle = null;
    if (weekday === 1 || weekday === 2) puzzle = take(queues.easy);
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
    starts: "2026-01-01",
    ends: new Date(current.getTime() - 86400000).toISOString().slice(0, 10),
    count: Object.keys(scheduled).length
  };
})();
