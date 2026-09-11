import json, os, random
from itertools import combinations

N=12
ALL=set(range(1,10))
units=[]
for name,(ro,co) in (("G1",(0,0)),("G2",(3,3))):
    for i in range(9):
        units.append((f"{name} row {i+1}",[(ro+i)*N+co+j for j in range(9)]))
        units.append((f"{name} column {i+1}",[(ro+j)*N+co+i for j in range(9)]))
    for br in range(3):
        for bc in range(3): units.append((f"{name} box {br+1},{bc+1}",[(ro+br*3+i)*N+co+bc*3+j for i in range(3) for j in range(3)]))
active=sorted({x for _,u in units for x in u})
unit_of={x:[u for _,u in units if x in u] for x in active}
peers={x:set().union(*map(set,unit_of[x]))-{x} for x in active}
cell_unit_ids={cell:[unit_id for unit_id,(_,unit) in enumerate(units) if cell in unit] for cell in active}

def candidates(board,cell): return ALL-{board[p] for p in peers[cell] if board[p]}

def count_solutions(givens,limit=2):
    board=givens[:]; masks=[0]*len(units); full=(1<<9)-1
    for unit_id,(_,unit) in enumerate(units):
        for cell in unit:
            value=board[cell]
            if not value: continue
            bit=1<<(value-1)
            if masks[unit_id]&bit: return 0
            masks[unit_id]|=bit
    def visit():
        choice=None; choices=0
        for cell in active:
            if board[cell]: continue
            used=0
            for unit_id in cell_unit_ids[cell]: used|=masks[unit_id]
            options=full&~used
            if not options: return 0
            if choice is None or options.bit_count()<choices.bit_count(): choice,choices=cell,options
        if choice is None: return 1
        total=0
        while choices:
            bit=choices&-choices; choices-=bit; value=bit.bit_length(); board[choice]=value
            for unit_id in cell_unit_ids[choice]: masks[unit_id]|=bit
            total+=visit()
            for unit_id in cell_unit_ids[choice]: masks[unit_id]&=~bit
            board[choice]=0
            if total>=limit: return total
        return total
    return visit()

def allowed_logic(givens,record=False):
    board=givens[:]; steps=[]; used_subsets=set(); used_fish=set(); used_single_digit_patterns=set(); used_wings=set()
    notes={cell:set(candidates(board,cell)) for cell in active if not board[cell]}
    def place(kind,cell,value,label):
        board[cell]=value; notes.pop(cell,None)
        for peer in peers[cell]:
            if peer in notes: notes[peer].discard(value)
        if record: steps.append((kind,cell,value,label))
    def naked_subset():
        for _,unit in units:
            blanks=[x for x in unit if x in notes]
            for size in range(2,5):
                for group in combinations(blanks,size):
                    union=set().union(*(notes[x] for x in group))
                    if len(union)!=size or any(len(notes[x])<2 or len(notes[x])>size for x in group): continue
                    changed=False
                    for cell in blanks:
                        if cell not in group:
                            before=len(notes[cell]); notes[cell]-=union; changed|=len(notes[cell])!=before
                    if changed: used_subsets.add(f"Naked {('Pair','Triple','Quad')[size-2]}"); return True
        return False
    def hidden_subset():
        for _,unit in units:
            blanks=[x for x in unit if x in notes]; missing=ALL-{board[x] for x in unit if board[x]}
            for size in range(2,5):
                for group in combinations(sorted(missing),size):
                    digits=set(group); cells=set().union(*(set(x for x in blanks if digit in notes[x]) for digit in digits))
                    if len(cells)!=size: continue
                    changed=False
                    for cell in cells:
                        before=len(notes[cell]); notes[cell]&=digits; changed|=len(notes[cell])!=before
                    if changed: used_subsets.add(f"Hidden {('Pair','Triple','Quad')[size-2]}"); return True
        return False
    def xy_wing():
        for pivot in active:
            if pivot not in notes or len(notes[pivot])!=2: continue
            first,second=sorted(notes[pivot])
            for pivot_digit,other_digit in ((first,second),(second,first)):
                first_wings=[cell for cell in peers[pivot] if cell in notes and len(notes[cell])==2 and pivot_digit in notes[cell] and (extra:=next(iter(notes[cell]-{pivot_digit}),None))]
                for wing_a in first_wings:
                    shared=next(iter(notes[wing_a]-{pivot_digit}))
                    for wing_b in peers[pivot]:
                        if wing_b==wing_a or wing_b not in notes or len(notes[wing_b])!=2 or notes[wing_b]!={other_digit,shared}: continue
                        victims=[cell for cell in active if cell in notes and cell not in (pivot,wing_a,wing_b) and shared in notes[cell] and wing_a in peers[cell] and wing_b in peers[cell]]
                        if victims:
                            for cell in victims: notes[cell].discard(shared)
                            used_wings.add('XY-Wing')
                            if record: steps.append(('XY-Wing',None,shared,f'pivot {pivot}, wings {wing_a}/{wing_b}'))
                            return True
        return False
    def basic_fish():
        for grid,ro,co in (("G1",0,0),("G2",3,3)):
            for digit in range(1,10):
                patterns=[]
                for local_row in range(9):
                    cols=tuple(local_col for local_col in range(9) if (ro+local_row)*N+co+local_col in notes and digit in notes[(ro+local_row)*N+co+local_col])
                    if len(cols)==2: patterns.append((local_row,cols))
                for (row_a,cols_a),(row_b,cols_b) in combinations(patterns,2):
                    if cols_a!=cols_b: continue
                    victims=[(ro+local_row)*N+co+local_col for local_row in range(9) if local_row not in (row_a,row_b) for local_col in cols_a if (ro+local_row)*N+co+local_col in notes and digit in notes[(ro+local_row)*N+co+local_col]]
                    if victims:
                        for cell in victims: notes[cell].discard(digit)
                        used_fish.add("X-Wing")
                        if record: steps.append(("X-Wing",None,digit,f"{grid} rows {row_a+1} and {row_b+1}"))
                        return True
                patterns=[]
                for local_col in range(9):
                    rows=tuple(local_row for local_row in range(9) if (ro+local_row)*N+co+local_col in notes and digit in notes[(ro+local_row)*N+co+local_col])
                    if len(rows)==2: patterns.append((local_col,rows))
                for (col_a,rows_a),(col_b,rows_b) in combinations(patterns,2):
                    if rows_a!=rows_b: continue
                    victims=[(ro+local_row)*N+co+local_col for local_row in rows_a for local_col in range(9) if local_col not in (col_a,col_b) and (ro+local_row)*N+co+local_col in notes and digit in notes[(ro+local_row)*N+co+local_col]]
                    if victims:
                        for cell in victims: notes[cell].discard(digit)
                        used_fish.add("X-Wing")
                        if record: steps.append(("X-Wing",None,digit,f"{grid} columns {col_a+1} and {col_b+1}"))
                        return True
        return False
    while True:
        move=None
        for label,unit in units:
            blanks=[x for x in unit if not board[x]]
            if len(blanks)==1:
                missing=ALL-{board[x] for x in unit if board[x]}
                if len(missing)==1: move=("Full House",blanks[0],next(iter(missing)),label); break
        if not move:
            for cell in active:
                if not board[cell] and len(notes[cell])==1: move=("Naked Single",cell,next(iter(notes[cell])),""); break
        if not move:
            for label,unit in units:
                for value in sorted(ALL-{board[x] for x in unit if board[x]}):
                    places=[x for x in unit if not board[x] and value in notes[x]]
                    if len(places)==1: move=("Hidden Single",places[0],value,label); break
                if move: break
        if not move and (naked_subset() or hidden_subset() or basic_fish() or xy_wing()): continue
        if not move: break
        place(*move)
    return all(board[x] for x in active),steps,board,used_subsets,used_fish,used_single_digit_patterns,used_wings

def random_sudoku(seed,givens=None):
    rng=random.Random(seed); board=[0]*81
    for cell,value in (givens or {}).items(): board[cell]=value
    def choices(cell):
        row,column=divmod(cell,9); used={board[row*9+i] for i in range(9)}|{board[i*9+column] for i in range(9)}
        box_row=row//3*3; box_column=column//3*3; used|={board[(box_row+i)*9+box_column+j] for i in range(3) for j in range(3)}
        return ALL-used
    def visit():
        choice=None; options=None
        for cell in range(81):
            if board[cell]: continue
            current=choices(cell)
            if not current: return False
            if options is None or len(current)<len(options): choice,options=cell,current
        if choice is None: return True
        values=list(options); rng.shuffle(values)
        for value in values:
            board[choice]=value
            if visit(): return True
            board[choice]=0
        return False
    return board if visit() else None

def make_full(seed):
    g1=random_sudoku(seed)
    forced={(row*9+column):g1[(row+3)*9+column+3] for row in range(6) for column in range(6)}
    g2=random_sudoku(seed+1,forced)
    if not g2: return None
    board=[0]*144
    for row in range(9):
        for column in range(9): board[row*N+column]=g1[row*9+column]
    for row in range(9):
        for column in range(9): board[(row+3)*N+column+3]=g2[row*9+column]
    return board

def generate(seed):
    full=make_full(seed)
    if not full: return None
    puzzle=full[:]; rng=random.Random(seed+2)
    changed=True
    while changed:
        changed=False; order=[cell for cell in active if puzzle[cell]]; rng.shuffle(order)
        for cell in order:
            value=puzzle[cell]; puzzle[cell]=0; logical,_,_,_,_,_,_=allowed_logic(puzzle)
            if logical and count_solutions(puzzle)==1: changed=True
            else: puzzle[cell]=value
    logical,steps,solved,subsets,fish,single_digit_patterns,wings=allowed_logic(puzzle,True)
    require_advanced=os.environ.get('GATTAI_REQUIRE_ADVANCED','1')=='1'
    advanced_family_used=bool(fish or single_digit_patterns or wings)
    if not (logical and solved==full and count_solutions(puzzle)==1 and (advanced_family_used or not require_advanced)): return None
    return [''.join(str(puzzle[row*N+column]) if puzzle[row*N+column] else '.' for column in range(N)) for row in range(N)], sorted(subsets), sorted(fish), sorted(single_digit_patterns), sorted(wings)

seed=int(os.environ.get('GATTAI_SEED','9000'))
attempts=int(os.environ.get('GATTAI_ATTEMPTS','100'))
for offset in range(attempts):
    result=generate(seed+offset*31)
    if result:
        rows,subsets,fish,single_digit_patterns,wings=result
        print(json.dumps({'seed':seed+offset*31,'rows':rows,'subsets':subsets,'fish':fish,'single_digit_patterns':single_digit_patterns,'wings':wings}))
        break
