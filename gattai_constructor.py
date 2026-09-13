"""Tkinter Gattai Sudoku constructor. Run: python gattai_constructor.py
Requires the bundled generate_logical_gattai.py in this repository.
"""
import random, threading, time
import tkinter as tk
from tkinter import messagebox, ttk
from generate_logical_gattai import N, ACTIVE, make_full, count_solutions, allowed_logic

KEEP, EMPTY, PAPER = "#91cf9b", "#df7474", "#f7f5ef"

class Constructor(tk.Tk):
    def __init__(self):
        super().__init__(); self.title("Gattai Sudoku Constructor"); self.configure(bg=PAPER)
        self.mode=tk.StringVar(value="keep"); self.kept=set(); self.empty=set(); self.cells={}; self.stop=threading.Event(); self.running=False
        self.status=tk.StringVar(value="Select green or red cells, then construct."); self.ui()

    def ui(self):
        ttk.Label(self,text="Gattai Sudoku Constructor",font=("TkDefaultFont",18,"bold")).grid(row=0,column=0,pady=(12,2))
        ttk.Label(self,text="Green cells must remain • Red cells must be empty").grid(row=1,column=0)
        bar=ttk.Frame(self,padding=8); bar.grid(row=2,column=0)
        ttk.Radiobutton(bar,text="Green: must remain",variable=self.mode,value="keep").grid(row=0,column=0,padx=5)
        ttk.Radiobutton(bar,text="Red: must be empty",variable=self.mode,value="empty").grid(row=0,column=1,padx=5)
        ttk.Button(bar,text="Clear",command=self.clear).grid(row=0,column=2,padx=5)
        self.build=ttk.Button(bar,text="Construct puzzle",command=self.construct); self.build.grid(row=0,column=3,padx=5)
        self.halt=ttk.Button(bar,text="Halt",command=self.stop.set,state="disabled"); self.halt.grid(row=0,column=4,padx=5)
        board=tk.Frame(self,bg="#111",padx=3,pady=3); board.grid(row=3,column=0,padx=16,pady=8)
        for r in range(12):
            for c in range(12):
                if not ((r<9 and c<9) or (r>=3 and c>=3)): continue
                cell=r*N+c; top=3 if r in (0,3,6,9) else 1; left=3 if c in (0,3,6,9) else 1
                b=tk.Button(board,text="",width=2,height=1,font=("Arial",16,"bold"),bg=PAPER,relief="solid",bd=1,command=lambda i=cell:self.toggle(i))
                b.grid(row=r,column=c,ipadx=7,ipady=7,padx=(left,0),pady=(top,0)); self.cells[cell]=b
        ttk.Label(self,textvariable=self.status,anchor="center",padding=8).grid(row=4,column=0,sticky="ew")

    def toggle(self,cell):
        if self.running:return
        chosen,other=(self.kept,self.empty) if self.mode.get()=="keep" else (self.empty,self.kept)
        if cell in chosen: chosen.remove(cell)
        else: other.discard(cell); chosen.add(cell)
        self.paint()

    def paint(self,puzzle=None):
        for cell,button in self.cells.items():
            if puzzle is not None and puzzle[cell]: button.configure(text=str(puzzle[cell]),fg="#111",bg=PAPER)
            elif cell in self.kept: button.configure(text="",bg=KEEP)
            elif cell in self.empty: button.configure(text="",bg=EMPTY)
            else: button.configure(text="",bg=PAPER)
        if puzzle is None:self.status.set(f"Green kept clues: {len(self.kept)} • Red empty cells: {len(self.empty)}")

    def clear(self): self.kept.clear(); self.empty.clear(); self.paint()

    def construct(self):
        if len(self.kept)>45: messagebox.showwarning("Too many clues","Choose 45 or fewer green cells."); return
        self.running=True; self.stop.clear(); self.build.configure(state="disabled"); self.halt.configure(state="normal"); started=time.monotonic()
        def report(text,clues): self.after(0,lambda:self.status.set(f"{text} • {clues} clues • {int(time.monotonic()-started)} s"))
        def worker():
            answer=None
            try:
                for attempt in range(1,41):
                    if self.stop.is_set(): break
                    full=make_full(random.randrange(1,2**30))
                    if not full: continue
                    puzzle=[full[i] if i in self.kept else 0 for i in range(N*N)]
                    pool=[i for i in ACTIVE if i not in self.kept and i not in self.empty]; random.shuffle(pool)
                    while not self.stop.is_set() and count_solutions(puzzle,2)!=1:
                        if len([i for i in ACTIVE if puzzle[i]])>=45 or not pool: break
                        pair=[pool.pop() for _ in range(min(2,len(pool)))]
                        for cell in pair:puzzle[cell]=full[cell]
                        report(f"Dual-cell adding, attempt {attempt}",sum(bool(puzzle[i]) for i in ACTIVE))
                    if not self.stop.is_set() and count_solutions(puzzle,2)==1: answer=(puzzle,full); break
                if self.stop.is_set(): self.after(0,lambda:self.status.set("Construction halted."))
                elif answer is None: self.after(0,lambda:self.status.set("No unique result within 45 clues; a fresh grid is needed."))
                else:
                    puzzle,_=answer; logical,steps,_,_,_,_,_=allowed_logic(puzzle,True)
                    difficulty="Over 9000" if not logical else ("Easy" if len(steps)<70 else "Medium" if len(steps)<110 else "Hard")
                    seconds=int(time.monotonic()-started); self.after(0,lambda:self.done(puzzle,difficulty,len(steps),seconds))
            finally:self.after(0,self.unlock)
        threading.Thread(target=worker,daemon=True).start()

    def done(self,puzzle,difficulty,steps,seconds):
        self.paint(puzzle); self.status.set(f"Finished in {seconds} s • {sum(bool(puzzle[i]) for i in ACTIVE)} clues • Difficulty: {difficulty} ({steps} steps)")
    def unlock(self): self.running=False; self.build.configure(state="normal"); self.halt.configure(state="disabled")

if __name__=="__main__": Constructor().mainloop()
