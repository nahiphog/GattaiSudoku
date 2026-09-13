"""Tkinter Gattai builder — one-cell addition, unlimited retry, and halt."""
import random,threading,time,tkinter as tk
from tkinter import ttk,messagebox
from generate_logical_gattai import N,ACTIVE,make_full,count_solutions,allowed_logic
PAPER='#f7f5ef';KEEP='#91cf9b';EMPTY='#df7474'
class Builder(tk.Tk):
 def __init__(self):
  super().__init__();self.title('Gattai Sudoku Builder');self.mode=tk.StringVar(value='keep');self.keep=set();self.empty=set();self.stop=threading.Event();self.running=False;self.cells={};self.status=tk.StringVar(value='Choose green required or red empty cells.')
  ttk.Label(self,text='Gattai Sudoku Builder',font=('TkDefaultFont',18,'bold')).grid(row=0,column=0,pady=10)
  bar=ttk.Frame(self,padding=6);bar.grid(row=1,column=0);ttk.Radiobutton(bar,text='Green: must keep',variable=self.mode,value='keep').grid(row=0,column=0);ttk.Radiobutton(bar,text='Red: must be empty',variable=self.mode,value='empty').grid(row=0,column=1);ttk.Button(bar,text='Clear',command=self.clear).grid(row=0,column=2);self.go=ttk.Button(bar,text='Build puzzle',command=self.build);self.go.grid(row=0,column=3);self.halt=ttk.Button(bar,text='Halt',command=self.stop.set,state='disabled');self.halt.grid(row=0,column=4)
  b=tk.Frame(self,bg='#111',padx=3,pady=3);b.grid(row=2,column=0,padx=14,pady=8)
  for r in range(12):
   for c in range(12):
    if not((r<9 and c<9)or(r>=3 and c>=3)):continue
    i=r*N+c;w=tk.Button(b,width=2,height=1,font=('Arial',16,'bold'),bg=PAPER,command=lambda x=i:self.pick(x));w.grid(row=r,column=c,ipadx=7,ipady=7,padx=(3 if c in(0,3,6,9)else 1,0),pady=(3 if r in(0,3,6,9)else 1,0));self.cells[i]=w
  ttk.Label(self,textvariable=self.status,padding=8).grid(row=3,column=0)
 def pick(self,i):
  if self.running:return
  a,b=(self.keep,self.empty)if self.mode.get()=='keep'else(self.empty,self.keep)
  if i in a:a.remove(i)
  else:b.discard(i);a.add(i)
  self.paint()
 def paint(self,p=None):
  for i,w in self.cells.items():w.configure(text=str(p[i])if p and p[i]else'',bg=PAPER if p else KEEP if i in self.keep else EMPTY if i in self.empty else PAPER)
  if not p:self.status.set(f'Green kept clues: {len(self.keep)} • Red empty cells: {len(self.empty)}')
 def clear(self):self.keep.clear();self.empty.clear();self.paint()
 def build(self):
  if len(self.keep)>45:messagebox.showwarning('Limit','Use at most 45 green clues.');return
  self.running=True;self.stop.clear();self.go.configure(state='disabled');self.halt.configure(state='normal');start=time.monotonic()
  def report(text,n):self.after(0,lambda:self.status.set(f'{text} • {n} cells • {int(time.monotonic()-start)} s'))
  def work():
   result=None;attempt=0
   try:
    while not self.stop.is_set() and result is None:
     attempt+=1;full=make_full(random.randrange(1,2**30));p=[full[i]if i in self.keep else 0 for i in range(N*N)];pool=[i for i in ACTIVE if i not in self.keep and i not in self.empty];random.shuffle(pool)
     while not self.stop.is_set() and count_solutions(p,2)!=1:
      if not pool or sum(bool(p[i])for i in ACTIVE)>=45:break
      i=pool.pop();p[i]=full[i];report('Adding one clue',sum(bool(p[j])for j in ACTIVE))
     if not self.stop.is_set() and count_solutions(p,2)==1:result=p
     else:report('Restarting with a fresh 126-cell Gattai',sum(bool(p[i])for i in ACTIVE))
    if result:
     ok,steps,*_=allowed_logic(result,True);d='Over 9000'if not ok else('Easy'if len(steps)<70 else'Medium'if len(steps)<110 else'Hard');self.after(0,lambda:self.finish(result,d,int(time.monotonic()-start)))
    elif self.stop.is_set():self.after(0,lambda:self.status.set('Building halted.'))
   finally:self.after(0,self.unlock)
  threading.Thread(target=work,daemon=True).start()
 def finish(self,p,d,s):self.paint(p);self.status.set(f'Finished in {s} s • Final grid: {sum(bool(p[i])for i in ACTIVE)} cells • Difficulty: {d}')
 def unlock(self):self.running=False;self.go.configure(state='normal');self.halt.configure(state='disabled')
if __name__=='__main__':Builder().mainloop()
