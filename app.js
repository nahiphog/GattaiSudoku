const rows=["3.......4...","....9.......","...51..3....",".48.........","......57...9","..7.3..62..7","..6..7......","..........83","...34.....2.","...2.......4","....6.8...1.",".........5.."];
const board=document.querySelector('#board');
const inGrid=(r,c)=>(r>=0&&r<9&&c>=0&&c<9)||(r>=3&&r<12&&c>=3&&c<12);
for(let r=0;r<12;r++)for(let c=0;c<12;c++){
  const a=r<9&&c<9,b=r>=3&&c>=3,cell=document.createElement('div');
  cell.className='cell';cell.style.gridColumnStart=String(c+1);cell.style.gridRowStart=String(r+1);cell.dataset.a=a;cell.dataset.b=b;
  if(!a&&!b)cell.classList.add('empty');if(a&&b)cell.classList.add('shared');
  if((a||b)&&!inGrid(r-1,c))cell.classList.add('edge-t');if((a||b)&&!inGrid(r+1,c))cell.classList.add('edge-b');if((a||b)&&!inGrid(r,c-1))cell.classList.add('edge-l');if((a||b)&&!inGrid(r,c+1))cell.classList.add('edge-r');
  if((a&&[2,5,8].includes(c))||(b&&[5,8,11].includes(c)))cell.classList.add('thick-r');if((a&&[2,5,8].includes(r))||(b&&[5,8,11].includes(r)))cell.classList.add('thick-b');
  cell.textContent=rows[r][c]==='.'?'':rows[r][c];board.append(cell);
}
const guideButton=document.querySelector('#showGuide');guideButton.onclick=()=>{const guide=document.querySelector('#guide'),hidden=guide.classList.toggle('hidden');guideButton.textContent=hidden?'Show teaching guide':'Hide teaching guide';guideButton.setAttribute('aria-expanded',String(!hidden));};
document.querySelectorAll('.grid-button').forEach(button=>button.onclick=()=>{const selected=button.dataset.grid,already=button.getAttribute('aria-pressed')==='true';document.querySelectorAll('.grid-button').forEach(b=>b.setAttribute('aria-pressed','false'));document.querySelectorAll('.cell').forEach(cell=>cell.classList.remove('grid-a','grid-b'));if(!already){document.querySelectorAll(`.cell[data-${selected}="true"]`).forEach(cell=>cell.classList.add(`grid-${selected}`));button.setAttribute('aria-pressed','true');}});
