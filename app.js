const baseRows=["....12......",".17.46.39...",".98....64...","...19.....72","16.78.....14","35..........","......87....",".26...95.72.",".85......98.",".......34...","...31..69.58","...94.....61"];
const solvedRows=["643912587...","517846239...","298357164...","872193645872","164785392614","359264718539","431529876143","726438951726","985671423985","...856134297","...317269458","...942587361"];
const days=[
  {name:'Monday',level:'Beginner',offset:1,extra:[[0,0],[0,1],[0,2],[0,3],[0,6],[0,7],[0,8],[1,0],[1,3],[1,6],[2,0],[2,3],[2,4],[2,5],[2,6],[3,0],[3,1],[3,2]]},
  {name:'Tuesday',level:'Easy',offset:3,extra:[[0,0],[0,1],[0,2],[0,3],[0,6],[1,0],[1,3],[1,6],[2,0],[2,3],[2,4],[3,0]]},
  {name:'Wednesday',level:'Easy–Intermediate',offset:5,extra:[[0,0],[0,1],[0,2],[1,0],[2,0],[3,0]]},
  {name:'Thursday',level:'Intermediate',offset:0,extra:[]},
  {name:'Friday',level:'Intermediate–Advanced',offset:2,extra:[]},
  {name:'Saturday',level:'Advanced',offset:4,extra:[]},
  {name:'Sunday',level:'Expert',offset:6,extra:[]}
];
const board=document.querySelector('#board');
const inGrid=(r,c)=>(r>=0&&r<9&&c>=0&&c<9)||(r>=3&&r<12&&c>=3&&c<12);
const shift=(value,offset)=>value==='.'?'.':String((Number(value)-1+offset)%9+1);
const makePuzzle=day=>{const cells=baseRows.map(row=>row.split(''));day.extra.forEach(([r,c])=>cells[r][c]=solvedRows[r][c]);return cells.map(row=>row.map(value=>shift(value,day.offset)).join(''));};
const buildBoard=rows=>{board.replaceChildren();for(let r=0;r<12;r++)for(let c=0;c<12;c++){
  const a=r<9&&c<9,b=r>=3&&c>=3;const cell=document.createElement('div');cell.className='cell';cell.style.gridColumnStart=String(c+1);cell.style.gridRowStart=String(r+1);cell.dataset.a=a;cell.dataset.b=b;
  if(!a&&!b)cell.classList.add('empty');if(a&&b)cell.classList.add('shared');
  if((a||b)&&!inGrid(r-1,c))cell.classList.add('edge-t');if((a||b)&&!inGrid(r+1,c))cell.classList.add('edge-b');if((a||b)&&!inGrid(r,c-1))cell.classList.add('edge-l');if((a||b)&&!inGrid(r,c+1))cell.classList.add('edge-r');
  if((a&&[2,5,8].includes(c))||(b&&[5,8,11].includes(c)))cell.classList.add('thick-r');if((a&&[2,5,8].includes(r))||(b&&[5,8,11].includes(r)))cell.classList.add('thick-b');
  cell.textContent=rows[r][c]==='.'?'':rows[r][c];board.append(cell);
}};
const dayContainer=document.querySelector('#days');
const clueCount=rows=>rows.join('').replaceAll('.','').length;
const renderDay=index=>{const day=days[index],rows=makePuzzle(day);buildBoard(rows);document.querySelector('#dayLabel').textContent=`${day.name.toUpperCase()} · THIS WEEK`;document.querySelector('#puzzleTitle').innerHTML=`${day.level}<br><em>Gattai</em> puzzle.`;document.querySelector('#puzzleMeta').textContent=`${day.name} · ${day.level} · ${clueCount(rows)} clues`;dayContainer.querySelectorAll('.day').forEach((button,i)=>button.classList.toggle('active',i===index));};
dayContainer.innerHTML=days.map((day,index)=>`<button class="day ${index===3?'active':''}" data-day="${index}"><small>${day.name}</small><b>${day.level}</b><span>${index<3?'More guided clues':index===3?'Core puzzle':'New daily board'}</span></button>`).join('');
dayContainer.querySelectorAll('.day').forEach(button=>button.onclick=()=>renderDay(Number(button.dataset.day)));
const guideButton=document.querySelector('#showGuide');guideButton.onclick=()=>{const guide=document.querySelector('#guide'),hidden=guide.classList.toggle('hidden');guideButton.textContent=hidden?'Show teaching guide':'Hide teaching guide';guideButton.setAttribute('aria-expanded',String(!hidden));};
document.querySelectorAll('.grid-button').forEach(button=>button.onclick=()=>{const selected=button.dataset.grid,already=button.getAttribute('aria-pressed')==='true';document.querySelectorAll('.grid-button').forEach(b=>b.setAttribute('aria-pressed','false'));document.querySelectorAll('.cell').forEach(cell=>cell.classList.remove('grid-a','grid-b'));if(!already){document.querySelectorAll(`.cell[data-${selected}="true"]`).forEach(cell=>cell.classList.add(`grid-${selected}`));button.setAttribute('aria-pressed','true');}});
renderDay(3);
