# Digging benchmark

Run from the repository root with Node.js:

```sh
node benchmarks/digging.mjs 5
```

Arguments are the number of completed grids, an optional target clue count
(empty string for unrestricted digging), and an optional first seed. For
example, `node benchmarks/digging.mjs 5 40` compares early stopping at 40 clues.
Unrestricted runs can be slow because the existing exact solution counter
must search sparse grids, particularly during the legacy retry pass.

The benchmark executes the current browser click handler and a frozen copy of
the previous handler in `legacy-dig-handler.txt`. Both use the current shared
grid constructor, grouping functions, and exact solution counter extracted
from `generate.js`. Each comparison uses the same completed grid and seeded
first-pass removal order. Execution order alternates between seeds.

Reported durations include digging and the handler's final uniqueness check.
They exclude completed-grid construction, independent result validation, DOM
rendering, and timer delays. This measures computation in Node, not browser
wall-clock latency. Check counts include the final uniqueness check. The old
and new implementations are timed once per seed; small differences can be
measurement noise, especially when check counts are identical.

Every paired result must match cell for cell and pass a separate exact
uniqueness check. The harness also verifies retained clues against the starting
solution, dual-mode rotational symmetry, target clue limits (including an odd
target), Halt, time-cap boundaries, and button reset. It uses a fake clock for
the time-cap check. Like the browser, the cap and Halt are checked between
uniqueness searches; this change does not interrupt a search already running.

For unrestricted runs, single-pass digging must make 126 removal checks in
single-cell mode or 63 in dual-cell mode, plus the final uniqueness check.
Final-puzzle equivalence applies when both runs finish with the same initial
grid/order/settings. Runs interrupted by a wall-clock limit need not finish
at the same point.
