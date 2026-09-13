"""Tkinter Gattai Sudoku constructor.

Green cells are required clues and red cells are required blanks.  The builder
retries fresh full Gattai grids, adding one eligible clue at a time until a
unique puzzle is found or the user halts it.
"""

import random
import threading
import time
import tkinter as tk
from tkinter import messagebox, ttk

# The generator exposes the 126 active positions as lowercase "active".
# Alias it here so existing constructor code can keep using ACTIVE.
from generate_logical_gattai import (
    N, active as ACTIVE, allowed_logic, count_solutions, make_full,
)

PAPER = "#f7f5ef"
KEEP = "#91cf9b"
EMPTY = "#df7474"


def active_cells():
    """Return the 126 playable Gattai cell indexes."""
    return tuple(ACTIVE)


class Builder(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Gattai Sudoku Builder")
        self.configure(bg=PAPER)
        self.mode = tk.StringVar(value="keep")
        self.max_extra = tk.IntVar(value=30)
        self.keep, self.empty = set(), set()
        self.stop = threading.Event()
        self.running = False
        self.cells = {}
        self.status = tk.StringVar(value="Choose green required or red empty cells.")
        self._make_ui()

    def _make_ui(self):
        ttk.Label(self, text="Gattai Sudoku Builder", font=("TkDefaultFont", 18, "bold")).grid(row=0, column=0, pady=(12, 4))
        ttk.Label(self, text="Select constraints, then construct a unique puzzle.").grid(row=1, column=0)
        bar = ttk.Frame(self, padding=8)
        bar.grid(row=2, column=0)
        ttk.Radiobutton(bar, text="Green: must keep", variable=self.mode, value="keep").grid(row=0, column=0, padx=4)
        ttk.Radiobutton(bar, text="Red: must be empty", variable=self.mode, value="empty").grid(row=0, column=1, padx=4)
        ttk.Label(bar, text="Maximum extra clues:").grid(row=0, column=2, padx=(12, 2))
        ttk.Combobox(bar, textvariable=self.max_extra, values=list(range(31)), width=3, state="readonly").grid(row=0, column=3, padx=(0, 4))
        ttk.Button(bar, text="Clear selections", command=self.clear).grid(row=0, column=4, padx=4)
        self.go = ttk.Button(bar, text="Build puzzle", command=self.build)
        self.go.grid(row=0, column=5, padx=4)
        self.halt = ttk.Button(bar, text="Halt", command=self.stop.set, state="disabled")
        self.halt.grid(row=0, column=6, padx=4)

        self.canvas = tk.Canvas(self, width=612, height=612, bg=PAPER, highlightthickness=0)
        self.canvas.grid(row=3, column=0, padx=16, pady=8)
        self._draw_board()
        ttk.Label(self, textvariable=self.status, anchor="center", padding=10).grid(row=4, column=0, sticky="ew")

    def _draw_board(self):
        size = 51
        for row in range(12):
            for col in range(12):
                if not ((row < 9 and col < 9) or (row >= 3 and col >= 3)):
                    continue
                index = row * N + col
                button = tk.Button(self.canvas, text="", command=lambda cell=index: self.pick(cell), width=2, height=1, font=("Arial", 15, "bold"), relief="solid", bd=1, bg=PAPER, activebackground=PAPER)
                self.canvas.create_window(col * size + size // 2, row * size + size // 2, window=button, width=size, height=size)
                self.cells[index] = button
        # Exactly five horizontal and five vertical thick Gattai boundaries.
        for offset in (0, 3, 6, 9, 12):
            start = 0 if offset < 10 else 3 * size
            end = 9 * size if offset < 10 else 12 * size
            self.canvas.create_line(start, offset * size, end, offset * size, width=3)
            self.canvas.create_line(offset * size, start, offset * size, end, width=3)

    def pick(self, cell):
        if self.running:
            return
        selected, other = (self.keep, self.empty) if self.mode.get() == "keep" else (self.empty, self.keep)
        if cell in selected:
            selected.remove(cell)
        else:
            other.discard(cell)
            selected.add(cell)
        self.paint()

    def paint(self, puzzle=None):
        for cell, button in self.cells.items():
            if puzzle is not None and puzzle[cell]:
                button.configure(text=str(puzzle[cell]), fg="#111", bg=PAPER)
            elif cell in self.keep:
                button.configure(text="", bg=KEEP)
            elif cell in self.empty:
                button.configure(text="", bg=EMPTY)
            else:
                button.configure(text="", bg=PAPER)
        if puzzle is None:
            self.status.set(f"Green kept clues: {len(self.keep)}  •  Red empty cells: {len(self.empty)}")

    def clear(self):
        if self.running:
            return
        self.keep.clear()
        self.empty.clear()
        self.paint()

    def build(self):
        if self.keep & self.empty:
            messagebox.showerror("Conflicting selection", "A cell cannot be both green and red.")
            return
        self.running = True
        self.stop.clear()
        self.go.configure(state="disabled")
        self.halt.configure(state="normal")
        started = time.monotonic()
        maximum = self.max_extra.get()

        def report(text, clues):
            seconds = int(time.monotonic() - started)
            self.after(0, lambda: self.status.set(f"{text}  •  {clues} cells  •  {seconds} s"))

        def work():
            result = None
            attempt = 0
            try:
                while not self.stop.is_set() and result is None:
                    attempt += 1
                    full = make_full(random.randrange(1, 2**30))
                    puzzle = [full[cell] if cell in self.keep else 0 for cell in range(N * N)]
                    pool = [cell for cell in ACTIVE if cell not in self.keep and cell not in self.empty]
                    random.shuffle(pool)
                    added = 0
                    report(f"Checking selected clues — attempt {attempt}", len(self.keep))
                    # Reverse digging: add exactly one eligible clue per pass.
                    while not self.stop.is_set() and count_solutions(puzzle, 2) != 1:
                        if added >= maximum or not pool:
                            break
                        cell = pool.pop()
                        puzzle[cell] = full[cell]
                        added += 1
                        report("Adding one clue", sum(bool(puzzle[cell]) for cell in ACTIVE))
                    if count_solutions(puzzle, 2) == 1:
                        result = puzzle, full
                    else:
                        report("Restarting with a fresh 126-cell Gattai", sum(bool(puzzle[cell]) for cell in ACTIVE))
                if self.stop.is_set():
                    self.after(0, lambda: self.status.set("Construction halted."))
                elif result:
                    self.after(0, lambda: self.finish(*result, int(time.monotonic() - started)))
            except Exception as error:
                self.after(0, lambda: messagebox.showerror("Construction failed", str(error)))
            finally:
                self.after(0, self.unlock)

        threading.Thread(target=work, daemon=True).start()

    def finish(self, puzzle, solution, seconds):
        logical, steps, _solved, _subsets, _fish, _patterns, _wings = allowed_logic(puzzle, True)
        difficulty = "Easy" if logical else "Over 9000"
        self.paint(puzzle)
        self.status.set(f"Finished in {seconds} s  •  {sum(bool(puzzle[cell]) for cell in ACTIVE)} clues  •  Difficulty: {difficulty} ({len(steps)} named steps)")

    def unlock(self):
        self.running = False
        self.go.configure(state="normal")
        self.halt.configure(state="disabled")


if __name__ == "__main__":
    Builder().mainloop()
