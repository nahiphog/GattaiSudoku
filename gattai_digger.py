"""Minimal-clue Gattai Sudoku generator.

This module creates a complete overlapping Gattai solution, then removes
clues one at a time.  A removal is kept only when the combined 126-cell
Gattai structure still has exactly one solution.  The ordered human solver is
always tried before exact backtracking; however, this unlimited-mode generator
has no technique gate, so a unique puzzle is retained even when search is
needed to certify it.

The public generator returns the clue count, the 144-character puzzle string,
and the elapsed generation time.
"""

from __future__ import annotations

import random
import time
from collections.abc import Callable
from dataclasses import dataclass

from generate_logical_gattai import N, active as ACTIVE, allowed_logic, count_solutions, make_full


Progress = Callable[[int, int], None]
ACTIVE_SET = frozenset(ACTIVE)


@dataclass(frozen=True)
class DugPuzzle:
    """The complete result of a successful uniqueness-only digging run."""

    given_cells: int
    puzzle_string: str
    elapsed_seconds: float


def board_to_string(board: list[int]) -> str:
    """Encode a 12×12 board as exactly 144 characters.

    The 18 non-Gattai corner cells and all removed clues are represented by
    periods, so the result can be imported directly by the website.
    """
    return "".join(str(board[cell]) if cell in ACTIVE_SET and board[cell] else "." for cell in range(N * N))


def unique_with_logic_fallback(puzzle: list[int], solution: list[int]) -> bool:
    """Certify uniqueness after first exhausting the ordered human solver."""
    logical, _steps, solved, *_families = allowed_logic(puzzle, record=True)
    if logical and solved == solution:
        return True
    return count_solutions(puzzle, limit=2) == 1


def dig_unique_gattai(
    seed: int | None = None,
    progress: Progress | None = None,
    should_halt: Callable[[], bool] | None = None,
) -> DugPuzzle | None:
    """Return a locally minimal unique Gattai puzzle and its run statistics.

    ``progress`` receives ``(remaining_clues, tested_clues)`` after each
    uniqueness test.  If ``should_halt`` ever returns true, the function
    returns ``None`` without claiming that an unfinished board is minimal.
    """
    started = time.perf_counter()
    rng = random.Random(seed)
    full = make_full(rng.randrange(1, 2**30))
    if full is None:
        raise RuntimeError("Could not construct a complete compatible Gattai grid.")

    puzzle = full[:]
    tested = 0

    # Repeating passes makes the terminal condition explicit: every retained
    # clue has been considered against the final board state.
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
            if unique_with_logic_fallback(puzzle, full):
                removed_any = True
            else:
                puzzle[cell] = value
            if progress:
                progress(sum(bool(puzzle[position]) for position in ACTIVE), tested)

        if not removed_any:
            break

    # Defend the stated invariant with a final exhaustive removal check.
    for cell in ACTIVE:
        if should_halt and should_halt():
            return None
        if not puzzle[cell]:
            continue
        value = puzzle[cell]
        puzzle[cell] = 0
        still_unique = unique_with_logic_fallback(puzzle, full)
        puzzle[cell] = value
        if still_unique:
            raise RuntimeError("Digging stopped before reaching a minimal unique-clue state.")

    if not unique_with_logic_fallback(puzzle, full):
        raise RuntimeError("Final puzzle failed uniqueness validation.")
    return DugPuzzle(
        given_cells=sum(bool(puzzle[cell]) for cell in ACTIVE),
        puzzle_string=board_to_string(puzzle),
        elapsed_seconds=time.perf_counter() - started,
    )

# print(dig_unique_gattai(seed=1))  # Run one reproducible digging trial.
