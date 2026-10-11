'use strict';
document.title='Sami Mustafa | Developer & Instructor';
const projects = [
  {name:'Online Voting System',group:'tools',type:'Web application',url:'https://online-voting-system-theta.vercel.app/',description:'An online election platform with authentication and an organized voting process.',tech:['HTML','CSS','JavaScript']},
  {name:'BookShelf App',group:'tools',type:'Productivity',url:'https://bookshelf-app-eta.vercel.app/',description:'A personal library to add, organize, and keep track of your read and unread books.',tech:['HTML','CSS','JavaScript']},
  {name:'Story Builder',group:'creative',type:'Creative tool',url:'https://samicodess.github.io/storybuilder/',description:'Create and organize stories with customizable templates and interactive tools.',tech:['HTML','CSS','JavaScript'],unavailable:true},
  {name:'Recruiter Management',group:'tools',type:'Web application',url:'https://samicodess.github.io/recruiter-management/',description:'Manage candidates and keep track of who has been interviewed, all in one place.',tech:['HTML','CSS','JavaScript'],unavailable:true},
  {name:'Math Blitz Challenge',group:'games',type:'Interactive game',url:'https://math-blitz-challenge.vercel.app/',description:'Put your math skills to the test in Time Trial, Survival, and Hardcore modes.',tech:['HTML','CSS','JavaScript']},
  {name:'SuperHero App',group:'discovery',type:'API project',url:'https://github.com/samicodess/superhero-app',description:'Explore superhero power stats, biographies, appearances, and connections.',tech:['HTML','CSS','JavaScript','API'],repo:true},
  {name:'Giphy AI',group:'discovery',type:'Search & discovery',url:'https://giphyai.vercel.app/',description:'Find animated GIFs that match your search with a quick, focused discovery experience.',tech:['HTML','CSS','JavaScript','API']},
  {name:'Beat Maker',group:'creative',type:'Music tool',url:'https://task-manager-bot.github.io',description:'Experiment with sounds, beats, and rhythms to find your next musical idea.',tech:['HTML','CSS','JavaScript']},
  {name:'Nasheed Notes',group:'discovery',type:'Listening experience',url:'https://nasheed-notes.vercel.app/',description:'A curated collection of nasheeds with a simple, focused listening experience.',tech:['HTML','CSS','JavaScript']}
];
// A small same-origin response; credentials and GitHub requests stay on the server.
const commitSection=document.getElementById('github'),commitList=document.getElementById('latest-commits'),commitStatus=document.getElementById('commit-status');
let commitTimer,commitController,commitFingerprint='',commitStarted=false,commitRetry=0,commitIdentity='',commitDate=0,commitFlash;
const relativeTime=new Intl.RelativeTimeFormat('en',{numeric:'auto'});
function commitAge(value){
  const seconds=Math.round((Date.parse(value)-Date.now())/1000),absolute=Math.abs(seconds);
  if(absolute<60)return 'Just now';
  for(const [unit,size] of [['day',86400],['hour',3600],['minute',60]])if(absolute>=size)return relativeTime.format(Math.round(seconds/size),unit);
}
function renderCommit(item,isNew){
  const row=document.createElement('article');row.className='commit-row'+(isNew?' is-new':'');
  const top=document.createElement('div');top.className='commit-card-top';
  const repoLine=document.createElement('div');repoLine.className='commit-repo-line';
  const repo=document.createElement('a');repo.className='commit-repository';repo.href='https://github.com/'+item.repository;repo.target='_blank';repo.rel='noopener';repo.textContent=item.repository;
  if(item.private)repo.insertAdjacentHTML('afterbegin','<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4"/></svg>');
  const privacy=document.createElement('span');privacy.className='commit-privacy'+(item.private?' is-private':'');privacy.textContent=item.private?'Private':'Public';repoLine.append(repo,privacy);
  const branch=document.createElement('span');branch.className='commit-branch';branch.textContent='⑂ '+((item.branches||[]).join(', ')||'Branch unavailable');branch.title='Branch';repoLine.append(branch);
  if(item.stats){const stats=document.createElement('span');stats.className='commit-stats';const added=document.createElement('span'),removed=document.createElement('span');added.className='commit-added';removed.className='commit-removed';added.textContent='+'+item.stats.additions;removed.textContent='−'+item.stats.deletions;stats.append(added,removed);repoLine.append(stats);}
  const id=document.createElement('a');id.className='commit-id-link';id.href=item.url;id.target='_blank';id.rel='noopener';id.title='Full commit ID: '+item.sha;id.setAttribute('aria-label','Open commit '+item.sha);id.textContent=item.sha.slice(0,7);id.insertAdjacentHTML('beforeend','<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3h7v7m0-7L10 14M10 4H4v16h16v-6"/></svg>');top.append(repoLine,id);row.append(top);
  const message=document.createElement('a');message.className='commit-message';message.href=item.url;message.target='_blank';message.rel='noopener';message.textContent=item.message;row.append(message);
  const bottom=document.createElement('div');bottom.className='commit-byline';
  if(item.avatar){const avatar=document.createElement('img');avatar.src=item.avatar;avatar.width=20;avatar.height=20;avatar.alt='';avatar.loading='lazy';avatar.referrerPolicy='no-referrer';bottom.append(avatar);}
  const who=document.createElement('strong');who.textContent=item.committer||item.author||'Unknown';bottom.append(who);
  const label=document.createElement('span');label.textContent='committed';bottom.append(label);
  const relative=document.createElement('time');relative.className='commit-relative';relative.dateTime=item.date;relative.textContent=commitAge(item.date);bottom.append(relative);
  const exact=document.createElement('time');exact.className='commit-exact';exact.dateTime=item.date;exact.title=new Intl.DateTimeFormat('en-GB',{dateStyle:'full',timeStyle:'long'}).format(new Date(item.date));exact.textContent=new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeStyle:'short'}).format(new Date(item.date));bottom.append(exact);row.append(bottom);
  const details=document.createElement('details');details.className='commit-id-details';const summary=document.createElement('summary');summary.textContent='Full commit ID';const full=document.createElement('code');full.textContent=item.sha;details.append(summary,full);row.append(details);
  return row;
}
// One overlay survives metadata updates, so only a new commit triggers the highlight.
function highlightCommit(item){
  if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  let overlay=commitSection.querySelector('.commit-flash');
  if(!overlay){overlay=document.createElement('div');overlay.className='commit-flash';overlay.setAttribute('aria-hidden','true');commitSection.append(overlay);}
  commitFlash?.cancel();
  overlay.style.backgroundColor=item.private?'#f97316':'#22c55e';
  commitFlash=overlay.animate([{opacity:0},{opacity:.18,offset:.12},{opacity:.18,offset:.4},{opacity:0}],{duration:3000,easing:'ease-in-out'});
}
function updateCommitDates(){commitSection.querySelectorAll('.commit-relative').forEach(time=>{time.textContent=commitAge(time.dateTime);});}
async function syncCommits(){
  if(document.hidden||commitController)return;
  const pollStarted=Date.now();
  clearTimeout(commitTimer);commitController=new AbortController();
  const timeout=setTimeout(()=>commitController?.abort(),20000);
  try{
    const initial=window.initialCommitRequest;window.initialCommitRequest=null;
    const response=await (initial||fetch('/api/github/commits',{signal:commitController.signal,cache:'no-store'}));
    if(!response.ok)throw new Error('Unavailable');const data=await response.json();
    if(!Array.isArray(data.commits))throw new Error('Invalid feed');
    const latest=data.commits.slice(0,1);
    if(!latest.length&&data.refreshing){commitSection.dataset.refreshing='true';commitStatus.textContent=commitStarted?'Checking for a newer commit…':'Checking GitHub for the latest commit…';return;}
    if(!latest.length&&commitStarted){commitStatus.textContent='Keeping your last synced commit';return;}
    commitRetry=0;
    const item=latest[0],identity=item?item.repository+':'+item.sha:'';
    const isNew=Boolean(commitIdentity&&identity&&identity!==commitIdentity&&Date.parse(item.date)>=commitDate);
    const fingerprint=JSON.stringify(latest);
    if(fingerprint!==commitFingerprint||!commitStarted){
      commitList.replaceChildren();
      if(!latest.length){const empty=document.createElement('p');empty.className='commit-placeholder';empty.textContent='No commits found yet.';commitList.append(empty);}
      latest.forEach(item=>commitList.append(renderCommit(item,isNew)));
      commitFingerprint=fingerprint;
      if(isNew)highlightCommit(item);
      commitIdentity=identity;if(item)commitDate=Date.parse(item.date);
    }
    try{if(latest.length)sessionStorage.setItem('sami-latest-commit-v1',JSON.stringify({savedAt:Date.now(),commits:latest}));}catch{}
    commitStarted=true;
    if(data.refreshing)commitSection.dataset.refreshing='true';else delete commitSection.dataset.refreshing;
    commitSection.dataset.state=data.stale?'error':'live';commitStatus.textContent=data.stale?'Showing the last synced commit':!data.privateAccess?'Public activity · private activity needs GitHub access':'Synced with GitHub · public & private repositories';updateCommitDates();
  }catch(error){
    if(error.name==='AbortError'&&document.hidden)return;
    commitRetry=Math.min(commitRetry+1,4);commitSection.dataset.refreshing='true';
    commitSection.dataset.state='error';commitStatus.textContent=commitStarted?'Keeping your last update · retrying shortly':'GitHub is temporarily unavailable · retrying shortly';
    if(!commitStarted){const placeholder=commitList.querySelector('.commit-placeholder');if(placeholder)placeholder.textContent='You can still view my activity directly on GitHub.';}
  }finally{
    clearTimeout(timeout);commitController=null;
    if(!document.hidden)commitTimer=setTimeout(syncCommits,commitSection.dataset.refreshing==='true'?Math.min(2000*2**commitRetry,15000):Math.max(1000,30000-(Date.now()-pollStarted)));
  }
}
document.addEventListener('visibilitychange',()=>{
  clearTimeout(commitTimer);if(document.hidden){commitController?.abort();return;}
  updateCommitDates();if(commitStarted||commitSection.dataset.started==='true')syncCommits();
});
// The timer above polls while the page is visible; no click or reload is needed.
// Start once the page is ready, including when opened in the embedded Site preview.
// Restore only this tab's recent response; live GitHub validation starts immediately.
try{
  const saved=JSON.parse(sessionStorage.getItem('sami-latest-commit-v1'));
  if(saved&&Date.now()-saved.savedAt<86400000&&saved.commits?.length===1){
    const item=saved.commits[0];
    if(/^[a-f0-9]{40}$/i.test(item.sha)&&Number.isFinite(Date.parse(item.date))&&/^https:\/\/github\.com\//.test(item.url)){
      commitList.replaceChildren(renderCommit(item,false));commitFingerprint=JSON.stringify(saved.commits);commitStarted=true;commitIdentity=item.repository+':'+item.sha;commitDate=Date.parse(item.date);
      commitStatus.textContent='Checking for a newer commit…';
    }
  }
}catch{}
commitSection.dataset.started='true';
if(!document.hidden)syncCommits();
const eye='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
if(!document.getElementById('projects').children.length)document.getElementById('projects').innerHTML=projects.map((p,i)=>`<article class="project-card" data-project="${i}"><div class="project-top"><span class="project-index">${String(i+1).padStart(2,'0')} /</span><span class="project-category">${p.type}</span></div><h3><a href="${p.url}" target="_blank" rel="noopener">${p.name}</a></h3><p>${p.description}</p><div class="project-bottom"><div class="tech">${p.tech.map(t=>`<span>${t}</span>`).join('')}</div><a class="preview-trigger" href="${p.url}" target="_blank" rel="noopener" aria-label="Preview ${p.name} (opens in a new tab)">${eye} Preview</a></div></article>`).join('');
document.getElementById('year').textContent=new Date().getFullYear();
const coarse=matchMedia('(hover:none), (pointer:coarse)'), reduced=matchMedia('(prefers-reduced-motion:reduce)');
let scrollPending=false;const progress=document.querySelector('.progress');
window.addEventListener('scroll',()=>{if(scrollPending)return;scrollPending=true;requestAnimationFrame(()=>{const total=document.documentElement.scrollHeight-innerHeight;progress.style.transform=`scaleX(${total>0?scrollY/total:0})`;scrollPending=false;});},{passive:true});
if(!reduced.matches&&'IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}});},{threshold:.08});
  document.querySelectorAll('.project-card,.about-copy,.experience,.contact').forEach(el=>{el.classList.add('reveal-ready');observer.observe(el);});
}
const projectFilters=document.querySelector('.project-filters');
const projectCards=[...document.querySelectorAll('.project-card')];
document.getElementById('project-total').textContent=String(projects.length).padStart(2,'0');
projectFilters.addEventListener('click',event=>{
  const button=event.target.closest('[data-filter]');
  if(!button||button.getAttribute('aria-pressed')==='true')return;
  projectFilters.querySelectorAll('[data-filter]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
  let visible=0;
  projectCards.forEach(card=>{
    const show=button.dataset.filter==='all'||projects[Number(card.dataset.project)].group===button.dataset.filter;
    card.hidden=!show;
    if(show){visible++;card.classList.add('visible');if(!reduced.matches)card.animate([{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:220,easing:'ease-out'});}
  });
  document.getElementById('project-filter-status').textContent=`Showing ${visible} of ${projects.length} projects${button.dataset.filter==='all'?'':' · '+button.textContent.trim()}`;
});
const name=document.getElementById('hero-title');
const nameLetters=[...name.querySelectorAll('.name-letter')];
let nameAnimations=[];
function nameWave(){
  if(reduced.matches)return;
  nameAnimations.forEach(animation=>animation.cancel());
  nameAnimations=nameLetters.map((letter,i)=>letter.animate([
    {transform:'translateY(0) rotate(0)',color:'inherit'},
    {transform:'translateY(-9px) rotate(-3deg)',color:'#3068a4',offset:.4},
    {transform:'translateY(0) rotate(0)',color:'inherit'}
  ],{duration:430,delay:i*24,easing:'cubic-bezier(.22,1,.36,1)'}));
}
name.addEventListener('click',nameWave);
name.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();nameWave();}});
function trackPointer(el,update){
  let rect,point,pending=false;
  el.addEventListener('pointerenter',()=>{rect=el.getBoundingClientRect();});
  el.addEventListener('pointermove',e=>{
    point={x:e.clientX,y:e.clientY};if(pending)return;pending=true;
    requestAnimationFrame(()=>{pending=false;if(rect)update(point,rect);});
  });
  el.addEventListener('pointerleave',()=>{rect=null;});
}
if(!coarse.matches&&!reduced.matches){
  const portrait=document.querySelector('[data-tilt]');
  trackPointer(portrait,(p,r)=>{portrait.style.setProperty('--rx',((.5-(p.y-r.top)/r.height)*5)+'deg');portrait.style.setProperty('--ry',(((p.x-r.left)/r.width-.5)*6)+'deg');});
  portrait.addEventListener('pointerleave',()=>{portrait.style.setProperty('--rx','0deg');portrait.style.setProperty('--ry','0deg');});
  trackPointer(name,(p,r)=>{name.style.setProperty('--name-x',((p.x-r.left)/r.width-.5)*5+'px');name.style.setProperty('--name-y',((p.y-r.top)/r.height-.5)*3+'px');});
  name.addEventListener('pointerleave',()=>{name.style.setProperty('--name-x','0px');name.style.setProperty('--name-y','0px');});
  const hero=document.querySelector('.hero'),ambient=document.querySelector('.ambient-box');
  trackPointer(hero,p=>{ambient.style.translate=`${(p.x/innerWidth-.5)*26}px ${(p.y/innerHeight-.5)*26}px`;});
}
