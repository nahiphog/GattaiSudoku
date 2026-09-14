"""Build a constrained unique Gattai puzzle by adding clues one at a time."""

from __future__ import annotations

import random
import time
from collections.abc import Callable, Iterable

from gattai_digger import DugPuzzle, board_to_string
from gattai_digger_human_solver_first import is_unique_logic_first
from generate_logical_gattai import N, active as ACTIVE, make_full


Progress = Callable[[int, int], None]


def build_a_puzzle(
    must_keep: Iterable[int] = (),
    must_be_empty: Iterable[int] = (),
    max_extra_clues: int = 30,
    seed: int | None = None,
    progress: Progress | None = None,
    should_halt: Callable[[], bool] | None = None,
) -> DugPuzzle | None:
    """Build a unique Gattai puzzle satisfying selected cell constraints.

    Green ``must_keep`` cells remain clues.  Red ``must_be_empty`` cells never
    receive a clue.  Fresh full Gattai grids are retried indefinitely until
    uniqueness is achieved with at most ``max_extra_clues`` one-cell additions.
    """
    keep, empty = set(must_keep), set(must_be_empty)
    active_set = set(ACTIVE)
    if not keep <= active_set or not empty <= active_set:
        raise ValueError("Constraints may contain only playable Gattai cells.")
    if keep & empty:
        raise ValueError("A cell cannot be both must-keep and must-be-empty.")
    if not 0 <= max_extra_clues <= len(ACTIVE):
        raise ValueError("max_extra_clues must be between 0 and 126.")

    started = time.perf_counter()
    rng = random.Random(seed)
    attempt = 0
    while not (should_halt and should_halt()):
        attempt += 1
        solution = make_full(rng.randrange(1, 2**30))
        if solution is None:
            continue
        puzzle = [solution[cell] if cell in keep else 0 for cell in range(N * N)]
        candidates = [cell for cell in ACTIVE if cell not in keep and cell not in empty]
        rng.shuffle(candidates)
        added = 0
        if progress:
            progress(sum(bool(puzzle[cell]) for cell in ACTIVE), attempt)

        while not is_unique_logic_first(puzzle, solution):
            if should_halt and should_halt():
                return None
            if added >= max_extra_clues or not candidates:
                break
            cell = candidates.pop()
            puzzle[cell] = solution[cell]
            added += 1
            if progress:
                progress(sum(bool(puzzle[index]) for index in ACTIVE), attempt)

        if is_unique_logic_first(puzzle, solution):
            return DugPuzzle(
                given_cells=sum(bool(puzzle[cell]) for cell in ACTIVE),
                puzzle_string=board_to_string(puzzle),
                elapsed_seconds=time.perf_counter() - started,
            )

    return None
