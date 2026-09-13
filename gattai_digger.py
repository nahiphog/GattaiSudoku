"""Generate a locally minimal unique Gattai Sudoku.

A full Gattai grid is dug one clue at a time. A removal survives only if the
combined 126-cell puzzle still has exactly one solution. The result is an
exact 144-character string using digits for clues and periods for blanks.
"""

from __future__ import annotations

import argparse
import random
from collections.abc import Callable

from generate_logical_gattai import N, active as ACTIVE, count_solutions, make_full

Progress = Callable[[int, int], None]


def board_to_string(board: list[int]) -> str:
    """Encode a 12x12 board as exactly 144 characters."""
    active = set(ACTIVE)
    return "".join(
        str(board[cell]) if cell in active and board[cell] else "."
        for cell in range(N * N)
    )


def dig_unique_gattai(
    seed: int | None = None,
    progress: Progress | None = None,
    should_halt: Callable[[], bool] | None = None,
) -> str | None:
    """Return a locally minimal unique puzzle as a 144-character string.

    The progress callback receives remaining and tested clue counts. Returning
    true from should_halt stops construction and returns None.
    """
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
    return board_to_string(puzzle)


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate a minimal unique Gattai Sudoku.")
    parser.add_argument("--seed", type=int, help="Optional deterministic random seed.")
    args = parser.parse_args()

    def show_progress(remaining: int, tested: int) -> None:
        print(f"\rDigging: {remaining} clues remaining after {tested} tests", end="", flush=True)

    puzzle_string = dig_unique_gattai(seed=args.seed, progress=show_progress)
    print()
    if puzzle_string is not None:
        print(puzzle_string)


if __name__ == "__main__":
    main()
