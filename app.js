const rows=["....12......",".17.46.39...",".98....64...","...19.....72","16.78.....14","35..........","......87....",".26...95.72.",".85......98.",".......34...","...31..69.58","...94.....61"];
const board=document.querySelector('#board');
for(let r=0;r<12;r++)for(let c=0;c<12;c++){
  const a=r<9&&c<9,b=r>=3&&c>=3;
  const cell=document.createElement('div'); cell.className='cell';
  if(!a&&!b)cell.classList.add('empty');
  if(a&&b)cell.classList.add('shared');
  if((a&&[2,5,8].includes(c))||(b&&[5,8,11].includes(c)))cell.classList.add('thick-r');
  if((a&&[2,5,8].includes(r))||(b&&[5,8,11].includes(r)))cell.classList.add('thick-b');
  cell.textContent=rows[r][c]==='.'?'':rows[r][c]; board.append(cell);
}
const schedule=[['Monday','Beginner','Naked Singles'],['Tuesday','Easy','Full House · Hidden Singles'],['Wednesday','Easy–Intermediate','Pointing · Claiming'],['Thursday','Intermediate','Hidden Singles · Intersections'],['Friday','Intermediate–Advanced','Naked Pairs · Locked Candidates'],['Saturday','Advanced','X-Wing · XY-Wing'],['Sunday','Expert','Fish · Chains']];
document.querySelector('#days').innerHTML=schedule.map(([d,l,t])=>`<article class="day ${d==='Thursday'?'active':''}"><small>${d}</small><b>${l}</b><span>${t}</span></article>`).join('');
document.querySelector('#showGuide').onclick=()=>document.querySelector('#guide').classList.toggle('hidden');
