"""Logic-first minimal Gattai Sudoku digging.

Every proposed clue removal is checked with the named human-style techniques
from ``generate_logical_gattai`` first.  Only when that solver cannot finish
the board does the module use exact backtracking to decide uniqueness.
"""

from __future__ import annotations

import random
import time
from collections.abc import Callable

from gattai_digger import DugPuzzle, board_to_string, rotational_pair_groups, unique_with_logic_fallback
from generate_logical_gattai import active as ACTIVE, make_full


Progress = Callable[[int, int], None]


def is_unique_logic_first(puzzle: list[int], solution: list[int]) -> bool:
    """Use human techniques when sufficient; otherwise verify by search.

    A completed human-technique solve contains only forced deductions, so it
    establishes uniqueness.  An incomplete technique solve is inconclusive,
    not a rejection: exact solution counting then makes the decision.
    """
    return unique_with_logic_fallback(puzzle, solution)


def dig_human_solver_first(
    seed: int | None = None,
    progress: Progress | None = None,
    should_halt: Callable[[], bool] | None = None,
    dual_cell: bool = False,
) -> DugPuzzle | None:
    """Return a logic-first, locally minimal unique Gattai puzzle.

    The returned ``DugPuzzle`` has ``given_cells``, ``puzzle_string``, and
    ``elapsed_seconds``. With ``dual_cell=True``, a clue and its 180° rotated
    partner on the full 12×12 Gattai board are tested together. ``None`` means
    the caller halted construction.
    """
    started = time.perf_counter()
    rng = random.Random(seed)
    solution = make_full(rng.randrange(1, 2**30))
    if solution is None:
        raise RuntimeError("Could not construct a complete compatible Gattai grid.")

    puzzle = solution[:]
    tested = 0
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
            if is_unique_logic_first(puzzle, solution):
                removed_any = True
            else:
                for cell, value in zip(group, values):
                    puzzle[cell] = value
            if progress:
                progress(sum(bool(puzzle[index]) for index in ACTIVE), tested)
        if not removed_any:
            break

    # Verify the terminal condition with the same logic-first rule. Paired
    # mode checks every remaining rotational pair, matching the web generator.
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
        removable = is_unique_logic_first(puzzle, solution)
        for cell, value in zip(group, values):
            puzzle[cell] = value
        if removable:
            raise RuntimeError("Digging stopped before the requested minimal unique-clue state.")

    return DugPuzzle(
        given_cells=sum(bool(puzzle[cell]) for cell in ACTIVE),
        puzzle_string=board_to_string(puzzle),
        elapsed_seconds=time.perf_counter() - started,
    )

# print(dig_human_solver_first(seed=1, dual_cell=True))  # Run one paired logic-first trial.
