"""Generate a unique Gattai Sudoku using human-style candidate logic only.

The dig retains a removal only when the result remains uniquely solvable by
the enabled logical techniques.  Search is used solely for the independent
uniqueness check, never to accept a logically unsolved board.
"""
import json, os, random, time
from itertools import combinations

N=12
ALL=set(range(1,10))
units=[]
for name,(ro,co) in (("G1",(0,0)),("G2",(3,3))):
    for i in range(9):
        units.append((f"{name} row {i+1}",[(ro+i)*N+co+j for j in range(9)]))
        units.append((f"{name} column {i+1}",[(ro+j)*N+co+i for j in range(9)]))
    for br in range(3):
        for bc in range(3):
            units.append((f"{name} box {br+1},{bc+1}",[(ro+br*3+i)*N+co+bc*3+j for i in range(3) for j in range(3)]))
active=sorted({x for _,u in units for x in u})
unit_of={x:[u for _,u in units if x in u] for x in active}
peers={x:set().union(*map(set,unit_of[x]))-{x} for x in active}
cell_unit_ids={cell:[unit_id for unit_id,(_,unit) in enumerate(units) if cell in unit] for cell in active}

def candidates(board,cell):
    return ALL-{board[p] for p in peers[cell] if board[p]}

def count_solutions(givens,limit=2):
    """Count up to ``limit`` with cached unit masks (the dig's hot path)."""
    board=givens[:];masks=[0]*len(units);full_mask=(1<<9)-1
    for unit_id,(_,unit) in enumerate(units):
        mask=0
        for cell in unit:
            value=board[cell]
            if not value: continue
            bit=1<<(value-1)
            if mask&bit:return 0
            mask|=bit
        masks[unit_id]=mask
    def visit():
        choice=None; choices_mask=0
        for cell in active:
            if board[cell]: continue
            used=0
            for unit_id in cell_unit_ids[cell]:used|=masks[unit_id]
            options=full_mask&~used
            if not options:return 0
            if choice is None or options.bit_count()<choices_mask.bit_count():
                choice,choices_mask=cell,options
                if options.bit_count()==1:break
        if choice is None:return 1
        total=0
        while choices_mask:
            bit=choices_mask&-choices_mask;choices_mask-=bit;value=bit.bit_length()
            board[choice]=value
            for unit_id in cell_unit_ids[choice]:masks[unit_id]|=bit
            total+=visit()
            for unit_id in cell_unit_ids[choice]:masks[unit_id]&=~bit
            board[choice]=0
            if total>=limit:return total
        return total
    return visit()

def allowed_logic(givens,record=False):
    """Human-style placements, subsets, and Basic Fish (X-Wing); no guessing."""
    board=givens[:];steps=[]
    used_subsets=set();allowed_logic.last_subsets=used_subsets
    used_fish=set();allowed_logic.last_fish=used_fish
    notes={cell:set(candidates(board,cell)) for cell in active if not board[cell]}
    def place(kind,cell,value,label):
        board[cell]=value;notes.pop(cell,None)
        for peer in peers[cell]:
            if peer in notes: notes[peer].discard(value)
        if record:steps.append((kind,cell,value,label))
    def naked_subset():
        for label,u in units:
            blanks=[x for x in u if x in notes]
            for size in range(2,5):
                for group in combinations(blanks,size):
                    union=set().union(*(notes[x] for x in group))
                    if len(union)!=size or any(len(notes[x])<2 or len(notes[x])>size for x in group): continue
                    changed=False
                    for cell in blanks:
                        if cell not in group:
                            before=len(notes[cell]);notes[cell]-=union;changed|=len(notes[cell])!=before
                    if changed:
                        used_subsets.add(f"Naked {('Pair','Triple','Quad')[size-2]}")
                        return True
        return False
    def hidden_subset():
        for label,u in units:
            blanks=[x for x in u if x in notes]
            missing=ALL-{board[x] for x in u if board[x]}
            for size in range(2,5):
                for group in combinations(sorted(missing),size):
                    digits=set(group);cells=set().union(*(set(x for x in blanks if digit in notes[x]) for digit in digits))
                    if len(cells)!=size: continue
                    changed=False
                    for cell in cells:
                        before=len(notes[cell]);notes[cell]&=digits;changed|=len(notes[cell])!=before
                    if changed:
                        used_subsets.add(f"Hidden {('Pair','Triple','Quad')[size-2]}")
                        return True
        return False
    def basic_fish():
        """Apply an X-Wing within either 9×9 grid and report its eliminations."""
        for grid,ro,co in (("G1",0,0),("G2",3,3)):
            for digit in range(1,10):
                # Row-based X-Wing: two rows share the same two candidate columns.
                patterns=[]
                for local_row in range(9):
                    row=[(ro+local_row)*N+co+local_col for local_col in range(9)]
                    cols=tuple(local_col for local_col,cell in enumerate(row) if cell in notes and digit in notes[cell])
                    if len(cols)==2: patterns.append((local_row,cols))
                for (row_a,cols_a),(row_b,cols_b) in combinations(patterns,2):
                    if cols_a != cols_b: continue
                    victims=[(ro+local_row)*N+co+local_col for local_row in range(9) if local_row not in (row_a,row_b) for local_col in cols_a if (ro+local_row)*N+co+local_col in notes and digit in notes[(ro+local_row)*N+co+local_col]]
                    if victims:
                        for cell in victims: notes[cell].discard(digit)
                        used_fish.add("X-Wing")
                        if record: steps.append(("X-Wing",None,digit,f"{grid} rows {row_a+1} and {row_b+1}"))
                        return True
                # Column-based X-Wing: two columns share the same two candidate rows.
                patterns=[]
                for local_col in range(9):
                    col=[(ro+local_row)*N+co+local_col for local_row in range(9)]
                    rows=tuple(local_row for local_row,cell in enumerate(col) if cell in notes and digit in notes[cell])
                    if len(rows)==2: patterns.append((local_col,rows))
                for (col_a,rows_a),(col_b,rows_b) in combinations(patterns,2):
                    if rows_a != rows_b: continue
                    victims=[(ro+local_row)*N+co+local_col for local_col in rows_a for local_col in range(9) if local_col not in (col_a,col_b) and (ro+local_row)*N+co+local_col in notes and digit in notes[(ro+local_row)*N+co+local_col]]
                    if victims:
                        for cell in victims: notes[cell].discard(digit)
                        used_fish.add("X-Wing")
                        if record: steps.append(("X-Wing",None,digit,f"{grid} columns {col_a+1} and {col_b+1}"))
                        return True
        return False
    while True:
        move=None
        # Full House: one empty cell in a complete row/column/box.
        for label,u in units:
            blanks=[x for x in u if not board[x]]
            if len(blanks)==1:
                missing=ALL-{board[x] for x in u if board[x]}
                if len(missing)==1:
                    move=("Full House",blanks[0],next(iter(missing)),label);break
        # Naked Single.
        if not move:
            for cell in active:
                if not board[cell]:
                    cs=notes[cell]
                    if len(cs)==1:
                        move=("Naked Single",cell,next(iter(cs)),"");break
        # Hidden Single.
        if not move:
            for label,u in units:
                missing=ALL-{board[x] for x in u if board[x]}
                for value in sorted(missing):
                    spots=[x for x in u if not board[x] and value in notes[x]]
                    if len(spots)==1:
                        move=("Hidden Single",spots[0],value,label);break
                if move:break
        if not move and (naked_subset() or hidden_subset() or basic_fish()):continue
        if not move:break
        kind,cell,value,label=move
        place(kind,cell,value,label)
    return (all(board[x] for x in active),steps,board)

def random_sudoku(seed, givens=None):
    rng=random.Random(seed);board=[0]*81
    if givens:
        for cell,value in givens.items():board[cell]=value
    def cs(cell):
        r,c=divmod(cell,9);used=set()
        used.update(board[r*9+i] for i in range(9))
        used.update(board[i*9+c] for i in range(9))
        br=r//3*3;bc=c//3*3
        used.update(board[(br+i)*9+bc+j] for i in range(3) for j in range(3))
        return ALL-used
    def visit():
        best=None;options=None
        for cell in range(81):
            if board[cell]:continue
            opts=cs(cell)
            if not opts:return False
            if options is None or len(opts)<len(options):best,options=cell,opts
        if best is None:return True
        opts=list(options);rng.shuffle(opts)
        for value in opts:
            board[best]=value
            if visit():return True
            board[best]=0
        return False
    if not visit():return None
    return board

def make_full(seed):
    g1=random_sudoku(seed)
    # G2's upper-left 6x6 area is the shared G1 rows 4-9, columns 4-9.
    forced={(r*9+c):g1[(r+3)*9+(c+3)] for r in range(6) for c in range(6)}
    g2=random_sudoku(seed+1,forced)
    if not g2: return None
    board=[0]*144
    for r in range(9):
        for c in range(9):board[r*N+c]=g1[r*9+c]
    for r in range(9):
        for c in range(9):board[(r+3)*N+c+3]=g2[r*9+c]
    return board

def label(cell):
    if cell is None:return "candidate elimination"
    r,c=divmod(cell,N);names=[]
    if r<9 and c<9:names.append(f"G1 R{r+1}C{c+1}")
    if r>=3 and c>=3:names.append(f"G2 R{r-2}C{c-2}")
    return " / ".join(names)

def generate(seed):
    full=make_full(seed)
    if not full: return None
    puzzle=full[:];rng=random.Random(seed+2);removed=0
    # Repeated random passes implement the required 'try every remaining clue'
    # process while preserving uniqueness and allowed-method solvability.
    changed=True
    while changed:
        changed=False;order=[x for x in active if puzzle[x]];rng.shuffle(order)
        for cell in order:
            value=puzzle[cell];puzzle[cell]=0
            logical,_,_=allowed_logic(puzzle)
            if logical and count_solutions(puzzle)==1:
                removed+=1;changed=True
            else:puzzle[cell]=value
    # No remaining clue may be removable subject to both requested constraints.
    for cell in active:
        if puzzle[cell]:
            value=puzzle[cell];puzzle[cell]=0
            assert not (allowed_logic(puzzle)[0] and count_solutions(puzzle)==1)
            puzzle[cell]=value
    logical,steps,solved=allowed_logic(puzzle,True)
    subsets=sorted(allowed_logic.last_subsets)
    fish=sorted(allowed_logic.last_fish)
    require_subsets=os.environ.get("GATTAI_REQUIRE_SUBSET","1") == "1"
    require_fish=os.environ.get("GATTAI_REQUIRE_FISH","0") == "1"
    if require_subsets and not subsets:return None
    if require_fish and not fish:return None
    # A candidate-rule implementation is allowed to reject an unsuitable
    # candidate, never to publish one.  Keep only a logic trace that reaches
    # the independently generated completion and retains one solution.
    if not (logical and solved==full and count_solutions(puzzle)==1): return None
    rows=[''.join(str(puzzle[r*N+c]) if puzzle[r*N+c] else '.' for c in range(N)) for r in range(N)]
    solution=[''.join(str(full[r*N+c]) if full[r*N+c] else '.' for c in range(N)) for r in range(N)]
    return {"rows":rows,"solution":solution,"initialClues":126,"removed":removed,"finalClues":126-removed,
            "unique":True,"allowedTechniqueSolve":True,"requiresSubsetTechnique":bool(subsets),"subsetTechniques":subsets,"requiresFishTechnique":bool(fish),"fishTechniques":fish,"techniques":sorted(set(x[0] for x in steps)),
            "steps":[{"technique":k,"cell":label(c),"value":v,"unit":u} for k,c,v,u in steps]}

start=time.time()
base_seed=int(os.environ.get("GATTAI_SEED", "9000"))
for offset in range(int(os.environ.get("GATTAI_ATTEMPTS", "30"))):
    result=generate(base_seed+offset*31)
    if result:
        result["seed"]=base_seed+offset*31
        with open(os.environ.get("GATTAI_OUTPUT", "logical-gattai-result.json"),"w",encoding="utf-8") as f:json.dump(result,f,indent=2)
        print(json.dumps({k:result[k] for k in ("seed","initialClues","removed","finalClues","subsetTechniques","fishTechniques","techniques")},indent=2))
        print("seconds",round(time.time()-start,2))
        break
