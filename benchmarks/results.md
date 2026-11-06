# Single-pass digging results

Measured on 2026-11-06 using Node.js v24.19.0. See [methodology and reproduction instructions](README.md).

Command: `node benchmarks/digging.mjs 5`

Five deterministic starting grids, each dug in both modes without a time cap
or target clue count. All ten old/new comparisons produced identical puzzles,
and every result passed a separate exact uniqueness check.

| Mode | Mean legacy time | Mean single-pass time | Time reduction | Mean legacy checks | Single-pass checks |
| --- | ---: | ---: | ---: | ---: | ---: |
| Single cell | 54.806 s | 15.594 s | 71.5% | 157.6 | 127 |
| Dual cell | 25.787 s | 3.491 s | 86.5% | 81.4 | 64 |

Check counts include the final uniqueness check. Times measure digging
computation, excluding full-grid construction, rendering, and timer delays.
These are five trials per mode, not a prediction of every browser session;
particularly expensive searches strongly influence the means.

| Seed | Mode | Final clues | Legacy time (ms) | Single-pass time (ms) | Legacy checks | Single-pass checks |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| 1 | Single | 30 | 108589.34 | 35695.89 | 157 | 127 |
| 1 | Dual | 34 | 3102.17 | 1272.72 | 81 | 64 |
| 2 | Single | 32 | 29246.40 | 18919.34 | 159 | 127 |
| 2 | Dual | 34 | 89015.65 | 5284.73 | 81 | 64 |
| 3 | Single | 30 | 105309.48 | 8187.67 | 157 | 127 |
| 3 | Dual | 36 | 3840.14 | 904.71 | 82 | 64 |
| 4 | Single | 30 | 8853.12 | 3267.41 | 157 | 127 |
| 4 | Dual | 36 | 10538.24 | 2599.90 | 82 | 64 |
| 5 | Single | 31 | 22030.37 | 11901.08 | 158 | 127 |
| 5 | Dual | 34 | 22437.35 | 7394.69 | 81 | 64 |

An additional `node benchmarks/digging.mjs 5 40` run verified identical,
unique results for all ten comparisons with a 40-clue target. Both versions
made identical numbers of uniqueness checks in that run, so no computational
retry savings are claimed for that early-stopping case. Its timing values are
not reported because another benchmark was running concurrently.

The harness also passed target-clue limits at 126, 125, and 100, Halt after
three attempts, a simulated time-cap boundary, dual-mode symmetry, and button
reset checks. These are automated handler checks, not a visual browser test.
