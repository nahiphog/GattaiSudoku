"""Generate a locally minimal unique Gattai Sudoku.

A full Gattai grid is dug one clue at a time. A removal survives only if the
combined 126-cell puzzle still has exactly one solution. The public generator
returns the clue count, the 144-character puzzle string, and elapsed time.
"""

from __future__ import annotations

import random
import time
from collections.abc import Callable
from dataclasses import dataclass

from generate_logical_gattai import N, active as ACTIVE, count_solutions, make_full

Progress = Callable[[int, int], None]
ACTIVE_SET = frozenset(ACTIVE)


@dataclass(frozen=True)
class DugPuzzle:
    """The complete result of a successful uniqueness-only digging run."""

    given_cells: int
    puzzle_string: str
    elapsed_seconds: float


def board_to_string(board: list[int]) -> str:
    """Encode a 12x12 board as exactly 144 characters."""
    return "".join(
        str(board[cell]) if cell in ACTIVE_SET and board[cell] else "."
        for cell in range(N * N)
    )


def dig_unique_gattai(
    seed: int | None = None,
    progress: Progress | None = None,
    should_halt: Callable[[], bool] | None = None,
) -> DugPuzzle | None:
    """Return a locally minimal unique Gattai puzzle and its run statistics.

    The optional progress callback receives remaining and tested clue counts.
    Returning true from should_halt stops construction and returns None.
    """
    started = time.perf_counter()
    rng = random.Random(seed)
    full = make_full(rng.randrange(1, 2**30))
    if full is None:
        raise RuntimeError("Could not construct a complete compatible Gattai grid.")

    puzzle = full[:]
    tested = 0

    # Repeat passes so every retained clue is tested against the final board.
    while True:
        if should_halt and should_halt():
            return None
        removed_any = False
        order = [cell for cell in ACTIVE if puzzle[cell]]
        rng.shuffle(order)

        for cell in order:
            if should_halt and should_halt():
                return None
            value = puzzle[cell]
            puzzle[cell] = 0
            tested += 1
            if count_solutions(puzzle, limit=2) == 1:
                removed_any = True
            else:
                puzzle[cell] = value
            if progress:
                progress(sum(bool(puzzle[position]) for position in ACTIVE), tested)

        if not removed_any:
            break

    # Independently prove no retained clue can be removed while unique.
    for cell in ACTIVE:
        if should_halt and should_halt():
            return None
        if not puzzle[cell]:
            continue
        value = puzzle[cell]
        puzzle[cell] = 0
        still_unique = count_solutions(puzzle, limit=2) == 1
        puzzle[cell] = value
        if still_unique:
            raise RuntimeError("Digging stopped before a minimal unique-clue state.")

    if count_solutions(puzzle, limit=2) != 1:
        raise RuntimeError("Final puzzle failed uniqueness validation.")
    return DugPuzzle(
        given_cells=sum(bool(puzzle[cell]) for cell in ACTIVE),
        puzzle_string=board_to_string(puzzle),
        elapsed_seconds=time.perf_counter() - started,
    )
