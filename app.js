const rows=["....12......",".17.46.39...",".98....64...","...19.....72","16.78.....14","35..........","......87....",".26...95.72.",".85......98.",".......34...","...31..69.58","...94.....61"];
const board=document.querySelector('#board');
const inGrid=(r,c)=>(r>=0&&r<9&&c>=0&&c<9)||(r>=3&&r<12&&c>=3&&c<12);
for(let r=0;r<12;r++)for(let c=0;c<12;c++){
  const a=r<9&&c<9,b=r>=3&&c>=3;
  const cell=document.createElement('div'); cell.className='cell';
  if(!a&&!b)cell.classList.add('empty');
  if(a&&b)cell.classList.add('shared');
  if((a||b)&&!inGrid(r-1,c))cell.classList.add('edge-t');
  if((a||b)&&!inGrid(r+1,c))cell.classList.add('edge-b');
  if((a||b)&&!inGrid(r,c-1))cell.classList.add('edge-l');
  if((a||b)&&!inGrid(r,c+1))cell.classList.add('edge-r');
  cell.dataset.a=a; cell.dataset.b=b;
  if((a&&[2,5,8].includes(c))||(b&&[5,8,11].includes(c)))cell.classList.add('thick-r');
  if((a&&[2,5,8].includes(r))||(b&&[5,8,11].includes(r)))cell.classList.add('thick-b');
  cell.textContent=rows[r][c]==='.'?'':rows[r][c]; board.append(cell);
}
const schedule=[['Monday','Beginner','Naked Singles'],['Tuesday','Easy','Full House · Hidden Singles'],['Wednesday','Easy–Intermediate','Pointing · Claiming'],['Thursday','Intermediate','Hidden Singles · Intersections'],['Friday','Intermediate–Advanced','Naked Pairs · Locked Candidates'],['Saturday','Advanced','X-Wing · XY-Wing'],['Sunday','Expert','Fish · Chains']];
document.querySelector('#days').innerHTML=schedule.map(([d,l,t])=>`<article class="day ${d==='Thursday'?'active':''}"><small>${d}</small><b>${l}</b><span>${t}</span></article>`).join('');
const guideButton=document.querySelector('#showGuide');
guideButton.onclick=()=>{const guide=document.querySelector('#guide');const hidden=guide.classList.toggle('hidden');guideButton.textContent=hidden?'Show teaching guide':'Hide teaching guide';guideButton.setAttribute('aria-expanded',String(!hidden));};
document.querySelectorAll('.grid-button').forEach(button=>button.onclick=()=>{const selected=button.dataset.grid;const already=button.getAttribute('aria-pressed')==='true';document.querySelectorAll('.grid-button').forEach(b=>b.setAttribute('aria-pressed','false'));document.querySelectorAll('.cell').forEach(cell=>cell.classList.remove('grid-a','grid-b'));if(!already){document.querySelectorAll(`.cell[data-${selected}="true"]`).forEach(cell=>cell.classList.add(`grid-${selected}`));button.setAttribute('aria-pressed','true');}});
