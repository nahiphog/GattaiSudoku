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


def rotational_pair_groups(puzzle: list[int], rng: random.Random) -> list[list[int]]:
    """Return remaining clue groups paired by 180° board rotation.

    The 12×12 Gattai layout maps ``(row, column)`` to
    ``(13-row, 13-column)`` (one-based).  The partner is permitted to have
    been removed by an earlier successful pair test; in that case the
    remaining clue is tested by itself, but the geometric pair is still
    considered only once in that pass.
    """
    seen: set[int] = set()
    groups: list[list[int]] = []
    for cell in ACTIVE:
        if not puzzle[cell] or cell in seen:
            continue
        row, column = divmod(cell, N)
        partner = (N - 1 - row) * N + (N - 1 - column)
        if partner not in ACTIVE_SET:
            raise RuntimeError("Gattai rotation produced a non-playable partner.")
        seen.update((cell, partner))
        groups.append([index for index in (cell, partner) if puzzle[index]])
    rng.shuffle(groups)
    return groups


def dig_unique_gattai(
    seed: int | None = None,
    progress: Progress | None = None,
    should_halt: Callable[[], bool] | None = None,
    dual_cell: bool = False,
) -> DugPuzzle | None:
    """Return a locally minimal unique Gattai puzzle and its run statistics.

    ``progress`` receives ``(remaining_clues, tested_clues)`` after each
    uniqueness test.  If ``dual_cell`` is true, digging uses rotational pairs
    across the full 12×12 board instead of unrelated random cells. If
    ``should_halt`` ever returns true, the function returns ``None`` without
    claiming that an unfinished board is minimal.
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
        groups = rotational_pair_groups(puzzle, rng) if dual_cell else [[cell] for cell in ACTIVE if puzzle[cell]]
        if not dual_cell:
            rng.shuffle(groups)

        for group in groups:
            if should_halt and should_halt():
                return None
            group = [cell for cell in group if puzzle[cell]]
            if not group:
                continue
            values = [puzzle[cell] for cell in group]
            for cell in group:
                puzzle[cell] = 0
            tested += 1
            if unique_with_logic_fallback(puzzle, full):
                removed_any = True
            else:
                for cell, value in zip(group, values):
                    puzzle[cell] = value
            if progress:
                progress(sum(bool(puzzle[position]) for position in ACTIVE), tested)

        if not removed_any:
            break

    # Defend the stated invariant with a final exhaustive removal check. In
    # dual mode the invariant is pair-minimality, not single-clue minimality.
    final_groups = rotational_pair_groups(puzzle, rng) if dual_cell else [[cell] for cell in ACTIVE if puzzle[cell]]
    for group in final_groups:
        if should_halt and should_halt():
            return None
        group = [cell for cell in group if puzzle[cell]]
        if not group:
            continue
        values = [puzzle[cell] for cell in group]
        for cell in group:
            puzzle[cell] = 0
        still_unique = unique_with_logic_fallback(puzzle, full)
        for cell, value in zip(group, values):
            puzzle[cell] = value
        if still_unique:
            raise RuntimeError("Digging stopped before reaching the requested minimal unique-clue state.")

    if not unique_with_logic_fallback(puzzle, full):
        raise RuntimeError("Final puzzle failed uniqueness validation.")
    return DugPuzzle(
        given_cells=sum(bool(puzzle[cell]) for cell in ACTIVE),
        puzzle_string=board_to_string(puzzle),
        elapsed_seconds=time.perf_counter() - started,
    )

# print(dig_unique_gattai(seed=1, dual_cell=True))  # Run one paired digging trial.
