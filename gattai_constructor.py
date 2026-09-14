"""Standalone Gattai Sudoku constructor.

Run with ``python gattai_constructor.py``.  It has no third-party
dependencies: Tkinter provides the UI and the solver/generator is included.

Green cells are clues which must remain; red cells are positions which must
remain empty.  Custom construction retries fresh complete Gattai grids until
cancelled, adding at most the selected number of extra clues per attempt.
"""

from __future__ import annotations

import random
import threading
import time
import tkinter as tk
from dataclasses import dataclass
from tkinter import messagebox, ttk

N = 12
DIGITS = set(range(1, 10))


def make_units():
    result = []
    for name, row0, col0 in (("Grid 1", 0, 0), ("Grid 2", 3, 3)):
        for n in range(9):
            result.append((f"{name} row {n + 1}", [(row0 + n) * N + col0 + c for c in range(9)]))
            result.append((f"{name} column {n + 1}", [(row0 + r) * N + col0 + n for r in range(9)]))
        for box_r in range(3):
            for box_c in range(3):
                result.append((f"{name} house {box_r + 1},{box_c + 1}", [
                    (row0 + box_r * 3 + r) * N + col0 + box_c * 3 + c
                    for r in range(3) for c in range(3)
                ]))
    return result


UNITS = make_units()
# The 126 cells that belong to either 9×9 grid.  Keep this immutable: both
# the solver and the Tkinter board rely on these coordinates staying stable.
ACTIVE: tuple[int, ...] = tuple(sorted({cell for _, unit in UNITS for cell in unit}))
UNITS_FOR = {cell: [unit for _, unit in UNITS if cell in unit] for cell in ACTIVE}
PEERS = {cell: set().union(*map(set, UNITS_FOR[cell])) - {cell} for cell in ACTIVE}


def active_cells() -> tuple[int, ...]:
    """Return the 126 playable Gattai cell indexes.

    ``ACTIVE`` is a constant collection, not a function.  This accessor is
    provided for callers that need to retrieve the cell set explicitly.
    """
    return ACTIVE


def candidates(board, cell):
    return DIGITS - {board[peer] for peer in PEERS[cell] if board[peer]}


def count_solutions(givens, stop=None, limit=2):
    """Count solutions using MRV backtracking, stopping at ``limit``."""
    board = list(givens)
    for _, unit in UNITS:
        seen = [board[cell] for cell in unit if board[cell]]
        if len(seen) != len(set(seen)):
            return 0

    def search():
        if stop and stop.is_set():
            return 0
        choice, options = None, None
        for cell in ACTIVE:
            if board[cell]:
                continue
            possible = candidates(board, cell)
            if not possible:
                return 0
            if options is None or len(possible) < len(options):
                choice, options = cell, possible
        if choice is None:
            return 1
        total = 0
        for value in options:
            board[choice] = value
            total += search()
            board[choice] = 0
            if total >= limit:
                return total
        return total

    return search()


def solve_9x9(givens, rng):
    values = list(givens)

    def options(cell):
        row, col = divmod(cell, 9)
        used = {values[row * 9 + n] for n in range(9)} | {values[n * 9 + col] for n in range(9)}
        top, left = row // 3 * 3, col // 3 * 3
        used |= {values[(top + r) * 9 + left + c] for r in range(3) for c in range(3)}
        return list(DIGITS - used)

    def visit():
        choice, possible = None, None
        for cell in range(81):
            if values[cell]:
                continue
            current = options(cell)
            if not current:
                return False
            if possible is None or len(current) < len(possible):
                choice, possible = cell, current
        if choice is None:
            return True
        rng.shuffle(possible)
        for value in possible:
            values[choice] = value
            if visit():
                return True
        values[choice] = 0
        return False

    return values if visit() else None


def full_gattai(rng):
    """Create two compatible fully filled standard Sudoku grids."""
    first = solve_9x9([0] * 81, rng)
    shared = [0] * 81
    for r in range(6):
        for c in range(6):
            shared[r * 9 + c] = first[(r + 3) * 9 + c + 3]
    second = solve_9x9(shared, rng)
    board = [0] * (N * N)
    for r in range(9):
        for c in range(9):
            board[r * N + c] = first[r * 9 + c]
            board[(r + 3) * N + c + 3] = second[r * 9 + c]
    return board


def simple_difficulty(givens):
    """A transparent basic rating; unsolved states are marked Over 9000."""
    board = list(givens)
    steps = 0
    changed = True
    while changed:
        changed = False
        # Full houses, naked singles, then hidden singles.
        for _, unit in UNITS:
            missing = DIGITS - {board[c] for c in unit if board[c]}
            empty = [c for c in unit if not board[c]]
            if len(empty) == len(missing) == 1:
                board[empty[0]] = next(iter(missing)); steps += 1; changed = True; break
        if changed:
            continue
        for cell in ACTIVE:
            if not board[cell] and len(candidates(board, cell)) == 1:
                board[cell] = next(iter(candidates(board, cell))); steps += 1; changed = True; break
        if changed:
            continue
        for _, unit in UNITS:
            missing = DIGITS - {board[c] for c in unit if board[c]}
            for value in missing:
                places = [c for c in unit if not board[c] and value in candidates(board, c)]
                if len(places) == 1:
                    board[places[0]] = value; steps += 1; changed = True; break
            if changed:
                break
    if any(not board[cell] for cell in ACTIVE):
        return "Over 9000", steps
    return ("Easy" if steps < 65 else "Medium"), steps


@dataclass
class Result:
    puzzle: list[int]
    solution: list[int]
    seconds: int
    difficulty: str
    steps: int


def build_custom(kept, forbidden, stop, progress, max_extra_clues=30):
    """Use one-cell adding to turn chosen keep-cells into a unique puzzle."""
    rng = random.Random()
    started = time.monotonic()
    attempt = 0
    while not stop.is_set():
        attempt += 1
        if stop.is_set():
            return None
        full = full_gattai(rng)
        puzzle = [full[cell] if cell in kept else 0 for cell in range(N * N)]
        if kept & forbidden:
            raise ValueError("A cell cannot be both green and red.")
        pool = [cell for cell in ACTIVE if cell not in kept and cell not in forbidden]
        rng.shuffle(pool)
        progress(f"Checking selected clues — attempt {attempt}", len(kept))
        # Reverse digging: add one eligible clue at a time until unique.
        added = 0
        while count_solutions(puzzle, stop) != 1:
            if stop.is_set():
                return None
            if added >= max_extra_clues or not pool:
                break
            cell = pool.pop()
            puzzle[cell] = full[cell]
            added += 1
            progress("Adding one clue", sum(1 for c in ACTIVE if puzzle[c]))
        clue_count = sum(1 for cell in ACTIVE if puzzle[cell])
        if count_solutions(puzzle, stop) == 1:
            difficulty, steps = simple_difficulty(puzzle)
            return Result(puzzle, full, round(time.monotonic() - started), difficulty, steps)
        progress("Restarting with a fresh 126-cell Gattai", clue_count)
    return None


class GattaiConstructor(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Gattai Sudoku Constructor")
        self.configure(bg="#f5f3ec")
        self.resizable(False, False)
        self.kept, self.forbidden = set(), set()
        self.mode = tk.StringVar(value="keep")
        self.max_extra_clues = tk.IntVar(value=30)
        self.stop = threading.Event()
        self.running = False
        self.solution = None
        self.buttons = {}
        self.status = tk.StringVar(value="Green = must remain. Red = must be empty.")
        self._make_ui()

    def _make_ui(self):
        header = ttk.Frame(self, padding=(16, 14, 16, 4)); header.grid(row=0, column=0, sticky="ew")
        ttk.Label(header, text="Gattai Sudoku Constructor", font=("TkDefaultFont", 18, "bold")).pack()
        ttk.Label(header, text="Choose constraints, then construct a minimal unique puzzle.").pack(pady=(3, 0))
        controls = ttk.Frame(self, padding=(16, 6)); controls.grid(row=1, column=0)
        ttk.Radiobutton(controls, text="Green: must remain", variable=self.mode, value="keep").grid(row=0, column=0, padx=6)
        ttk.Radiobutton(controls, text="Red: must be empty", variable=self.mode, value="forbid").grid(row=0, column=1, padx=6)
        ttk.Label(controls, text="Maximum extra clues:").grid(row=0, column=2, padx=(14, 2))
        ttk.Combobox(controls, textvariable=self.max_extra_clues, values=list(range(31)), state="readonly", width=3).grid(row=0, column=3, padx=(0, 6))
        ttk.Button(controls, text="Clear selections", command=self.clear).grid(row=0, column=4, padx=6)
        self.go = ttk.Button(controls, text="Construct puzzle", command=self.construct)
        self.go.grid(row=0, column=5, padx=6)
        self.halt = ttk.Button(controls, text="Halt", command=self.stop.set, state="disabled")
        self.halt.grid(row=0, column=6, padx=6)

        self.canvas = tk.Canvas(self, width=612, height=612, bg="#f5f3ec", highlightthickness=0)
        self.canvas.grid(row=2, column=0, padx=16, pady=8)
        self._draw_board()
        ttk.Label(self, textvariable=self.status, anchor="center", padding=(16, 8)).grid(row=3, column=0, sticky="ew")

    def _draw_board(self):
        cell = 51
        for row in range(12):
            for col in range(12):
                if (row >= 9 or col >= 9) and not (row >= 3 and col >= 3):
                    continue
                index = row * N + col
                button = tk.Button(self.canvas, text="", command=lambda i=index: self.toggle(i), width=2,
                                   height=1, font=("TkDefaultFont", 15, "bold"), relief="solid", bd=1,
                                   bg="#f5f3ec", activebackground="#f5f3ec")
                self.canvas.create_window(col * cell + cell // 2, row * cell + cell // 2, window=button, width=cell, height=cell)
                self.buttons[index] = button
        # Five horizontal and five vertical Sudoku boundaries.
        for offset in (0, 3, 6, 9, 12):
            y = offset * cell
            self.canvas.create_line(0 if offset < 10 else 3 * cell, y, 9 * cell if offset < 10 else 12 * cell, y, width=3)
            x = offset * cell
            self.canvas.create_line(x, 0 if offset < 10 else 3 * cell, x, 9 * cell if offset < 10 else 12 * cell, width=3)

    def toggle(self, index):
        if self.running:
            return
        selected = self.kept if self.mode.get() == "keep" else self.forbidden
        other = self.forbidden if selected is self.kept else self.kept
        if index in selected:
            selected.remove(index)
        else:
            other.discard(index); selected.add(index)
        self.paint()

    def paint(self, puzzle=None):
        for index, button in self.buttons.items():
            if puzzle is not None and puzzle[index]:
                button.configure(text=str(puzzle[index]), fg="#111", bg="#f5f3ec")
            elif index in self.kept:
                button.configure(text="", bg="#89c88d")
            elif index in self.forbidden:
                button.configure(text="", bg="#d56a6a")
            else:
                button.configure(text="", bg="#f5f3ec")
        self.status.set(f"Green kept clues: {len(self.kept)}   •   Red empty cells: {len(self.forbidden)}")

    def clear(self):
        self.kept.clear(); self.forbidden.clear(); self.paint()

    def construct(self):
        self.running = True; self.stop.clear(); self.go.configure(state="disabled"); self.halt.configure(state="normal")
        started = time.monotonic()
        max_extra_clues = self.max_extra_clues.get()

        def progress(message, clues):
            seconds = int(time.monotonic() - started)
            self.after(0, lambda: self.status.set(f"{message} — {clues} clues — {seconds} s"))

        def work():
            try:
                result = build_custom(self.kept, self.forbidden, self.stop, progress, max_extra_clues)
                if result is None:
                    self.after(0, lambda: self.status.set("Construction halted."))
                else:
                    self.solution = result.solution
                    self.after(0, lambda: self.finish(result))
            except Exception as error:
                self.after(0, lambda: messagebox.showerror("Construction failed", str(error)))
            finally:
                self.after(0, self.unlock)
        threading.Thread(target=work, daemon=True).start()

    def finish(self, result):
        self.paint(result.puzzle)
        self.status.set(f"Finished in {result.seconds} s • {sum(1 for c in ACTIVE if result.puzzle[c])} clues • Difficulty: {result.difficulty} ({result.steps} basic steps)")

    def unlock(self):
        self.running = False; self.go.configure(state="normal"); self.halt.configure(state="disabled")


if __name__ == "__main__":
    GattaiConstructor().mainloop()

# GattaiConstructor().mainloop()  # Run one interactive constructor trial.
