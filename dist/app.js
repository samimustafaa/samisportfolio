'use strict';
document.title='Sami Mustafa | Developer & Instructor';
const projects = [
  {name:'Online Voting System',type:'Web application',url:'https://online-voting-system-theta.vercel.app/',description:'An online election platform with authentication and an organized voting process.',tech:['HTML','CSS','JavaScript']},
  {name:'BookShelf App',type:'Productivity',url:'https://bookshelf-app-eta.vercel.app/',description:'A personal library to add, organize, and keep track of your read and unread books.',tech:['HTML','CSS','JavaScript']},
  {name:'Story Builder',type:'Creative tool',url:'https://samicodess.github.io/storybuilder/',description:'Create and organize stories with customizable templates and interactive tools.',tech:['HTML','CSS','JavaScript'],unavailable:true},
  {name:'Recruiter Management',type:'Web application',url:'https://samicodess.github.io/recruiter-management/',description:'Manage candidates and keep track of who has been interviewed, all in one place.',tech:['HTML','CSS','JavaScript'],unavailable:true},
  {name:'Math Blitz Challenge',type:'Interactive game',url:'https://math-blitz-challenge.vercel.app/',description:'Put your math skills to the test in Time Trial, Survival, and Hardcore modes.',tech:['HTML','CSS','JavaScript']},
  {name:'SuperHero App',type:'API project',url:'https://github.com/samicodess/superhero-app',description:'Explore superhero power stats, biographies, appearances, and connections.',tech:['HTML','CSS','JavaScript','API'],repo:true},
  {name:'Giphy AI',type:'Search & discovery',url:'https://giphyai.vercel.app/',description:'Find animated GIFs that match your search with a quick, focused discovery experience.',tech:['HTML','CSS','JavaScript','API']},
  {name:'Beat Maker',type:'Music tool',url:'https://task-manager-bot.github.io',description:'Experiment with sounds, beats, and rhythms to find your next musical idea.',tech:['HTML','CSS','JavaScript']},
  {name:'Nasheed Notes',type:'Listening experience',url:'https://nasheed-notes.vercel.app/',description:'A curated collection of nasheeds with a simple, focused listening experience.',tech:['HTML','CSS','JavaScript']}
];
// A small same-origin response; credentials and GitHub requests stay on the server.
const commitSection=document.getElementById('github'),commitList=document.getElementById('latest-commits'),commitStatus=document.getElementById('commit-status');
let commitTimer,commitController,commitFingerprint='',commitStarted=false,commitRetry=0;
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
  const badge=document.getElementById('header-privacy');badge.hidden=false;badge.className='commit-privacy'+(item.private?' is-private':'');badge.textContent=item.private?'Private repo':'Public repo';
  return row;
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
    const fingerprint=JSON.stringify(latest);
    if(fingerprint!==commitFingerprint||!commitStarted){
      commitList.replaceChildren();
      if(!latest.length){const empty=document.createElement('p');empty.className='commit-placeholder';empty.textContent='No commits found yet.';commitList.append(empty);}
      latest.forEach(item=>commitList.append(renderCommit(item,commitStarted)));
      commitFingerprint=fingerprint;
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
// Start once the page is ready, including when opened in the embedded Site preview.
// Restore only this tab's recent response; live GitHub validation starts immediately.
try{
  const saved=JSON.parse(sessionStorage.getItem('sami-latest-commit-v1'));
  if(saved&&Date.now()-saved.savedAt<86400000&&saved.commits?.length===1){
    const item=saved.commits[0];
    if(/^[a-f0-9]{40}$/i.test(item.sha)&&Number.isFinite(Date.parse(item.date))&&/^https:\/\/github\.com\//.test(item.url)){
      commitList.replaceChildren(renderCommit(item,false));commitFingerprint=JSON.stringify(saved.commits);commitStarted=true;
      commitStatus.textContent='Checking for a newer commit…';
    }
  }
}catch{}
commitSection.dataset.started='true';
if(!document.hidden)syncCommits();
const eye='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
if(!document.getElementById('projects').children.length)document.getElementById('projects').innerHTML=projects.map((p,i)=>`<article class="project-card" data-project="${i}"><div class="project-top"><span class="project-index">${String(i+1).padStart(2,'0')} /</span><span class="project-category">${p.type}</span></div><h3><a href="${p.url}" target="_blank" rel="noopener">${p.name}</a></h3><p>${p.description}</p><div class="project-bottom"><div class="tech">${p.tech.map(t=>`<span>${t}</span>`).join('')}</div><button class="preview-trigger" aria-label="Preview ${p.name}" aria-controls="project-preview" aria-haspopup="dialog">${eye} Preview</button></div></article>`).join('');
document.getElementById('year').textContent=new Date().getFullYear();
const preview=document.getElementById('project-preview'), screen=document.getElementById('preview-screen');
const coarse=matchMedia('(hover:none), (pointer:coarse)'), reduced=matchMedia('(prefers-reduced-motion:reduce)');
let current=-1, hideTimer, trigger, locked=false, suppressFocus=false, previewAnimation, lastPoint={x:0,y:0};
const frames=new Map();
const loading=document.createElement('div');loading.className='preview-loading';loading.setAttribute('aria-live','polite');
const loadingTitle=document.createElement('strong'),loadingNote=document.createElement('span');
loading.append(loadingTitle,loadingNote);screen.append(loading);
let overview;
function getFrame(i){
  const cached=frames.get(i);
  if(cached){frames.delete(i);frames.set(i,cached);return cached;}
  const p=projects[i],frame=document.createElement('iframe');
  frame.hidden=true;frame.title=p.name+' live preview';frame.tabIndex=-1;
  frame.setAttribute('sandbox','allow-scripts allow-same-origin');frame.setAttribute('referrerpolicy','no-referrer');frame.setAttribute('aria-hidden','true');
  frame.addEventListener('load',()=>frame.classList.add('is-ready'),{once:true});
  frame.src=p.url;screen.append(frame);frames.set(i,frame);
  // Retain at most two live previews so revisits are fast without keeping every app running.
  while(frames.size>2){const oldest=frames.keys().next().value;frames.get(oldest).remove();frames.delete(oldest);}
  return frame;
}
function positionPreview(x,y){
  if(locked)return;
  const width=preview.offsetWidth||380,height=preview.offsetHeight||430;
  let left=x+24;if(left+width>innerWidth-16)left=x-width-24;
  left=Math.max(12,Math.min(left,innerWidth-width-12));
  let top=y-110;top=Math.max(12,Math.min(top,innerHeight-height-12));
  preview.style.left=left+'px';preview.style.top=top+'px';
}
function showPreview(i,button,point,touch=false){
  const changed=current!==i;
  clearTimeout(hideTimer);trigger=button;locked=touch;
  preview.classList.toggle('touch-open',touch);preview.setAttribute('aria-modal',String(touch));
  if(current!==i){
    current=i;const p=projects[i];
    document.getElementById('preview-title').textContent=p.name;
    document.getElementById('preview-type').textContent=p.repo?'SOURCE CODE / API PROJECT':p.unavailable?'PROJECT OVERVIEW':p.type;
    document.getElementById('preview-description').textContent=p.description;
    document.getElementById('preview-domain').textContent=new URL(p.url).hostname;
    const link=document.getElementById('preview-link');link.href=p.url;link.textContent=p.repo?'View on GitHub':'Open project';
    for(const frame of frames.values())frame.hidden=true;
    overview?.remove();overview=null;
    loading.hidden=false;loadingTitle.textContent=p.name;loadingNote.textContent='Loading live preview…';
    if(p.repo||p.unavailable){
      const info=document.createElement('div');info.className='repo-preview';
      info.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 8 4 12l4 4m8-8 4 4-4 4m-3-10-2 16"/></svg>';
      const title=document.createElement('strong');title.textContent=p.name;info.append(title);
      const note=document.createElement('span');note.textContent=p.repo?'samicodess / superhero-app':'The original live demo is currently unavailable.';info.append(note);
      const tech=document.createElement('span');tech.textContent=p.tech.join(' · ');info.append(tech);screen.append(info);overview=info;loading.hidden=true;
    }else{
      getFrame(i).hidden=false;
    }
  }
  const opening=!preview.matches(':popover-open');
  if(opening)preview.showPopover();
  screen.style.setProperty('--preview-scale',String(screen.clientWidth/1280));
  if(!touch){const rect=button.closest('.project-card').getBoundingClientRect();positionPreview(point?.x??rect.right-100,point?.y??rect.top+60);}else{preview.querySelector('.close-preview').focus();}
  if((opening||changed)&&!reduced.matches){previewAnimation?.cancel();previewAnimation=preview.animate([{opacity:0,transform:'translateY(8px) scale(.97)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:220,easing:'cubic-bezier(.22,1,.36,1)'});}
}
function closePreview(restore=false){clearTimeout(hideTimer);if(preview.matches(':popover-open'))preview.hidePopover();preview.classList.remove('touch-open');locked=false;if(restore&&trigger){suppressFocus=true;trigger.focus({preventScroll:true});suppressFocus=false;}}
function scheduleClose(){if(!locked){clearTimeout(hideTimer);hideTimer=setTimeout(()=>closePreview(),180);}}
document.querySelectorAll('.project-card').forEach((card,i)=>{
  const button=card.querySelector('.preview-trigger');
  card.addEventListener('pointerenter',e=>{if(coarse.matches||locked)return;lastPoint={x:e.clientX,y:e.clientY};showPreview(i,button,lastPoint);});
  card.addEventListener('pointerleave',scheduleClose);
  button.addEventListener('click',e=>{e.preventDefault();showPreview(i,button,null,true);});
  button.addEventListener('focus',()=>{if(!suppressFocus&&!locked&&!coarse.matches)showPreview(i,button);});
  card.addEventListener('focusout',e=>{if(!card.contains(e.relatedTarget)&&!preview.contains(e.relatedTarget))scheduleClose();});
});
preview.addEventListener('pointerenter',()=>clearTimeout(hideTimer));preview.addEventListener('pointerleave',scheduleClose);
preview.addEventListener('focusin',()=>clearTimeout(hideTimer));
preview.addEventListener('focusout',e=>{if(!preview.contains(e.relatedTarget))scheduleClose();});
preview.querySelector('.close-preview').addEventListener('click',()=>closePreview(true));
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&preview.matches(':popover-open')){e.preventDefault();closePreview(true);}
  if(e.key==='Tab'&&locked){const items=preview.querySelectorAll('button,a'),first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
});
document.addEventListener('pointerdown',e=>{if(locked&&preview.matches(':popover-open')&&!preview.contains(e.target)&&!e.target.closest('.preview-trigger'))closePreview(true);});
let scrollPending=false;const progress=document.querySelector('.progress');
window.addEventListener('scroll',()=>{if(!locked&&current!==-1)closePreview();if(scrollPending)return;scrollPending=true;requestAnimationFrame(()=>{const total=document.documentElement.scrollHeight-innerHeight;progress.style.transform=`scaleX(${total>0?scrollY/total:0})`;scrollPending=false;});},{passive:true});
window.addEventListener('resize',()=>closePreview());
// Warm one demo only when visitors reach the projects, after the main page is ready.
if(!coarse.matches&&'IntersectionObserver' in window&&!navigator.connection?.saveData&&!/2g/.test(navigator.connection?.effectiveType||'')){
  const warm=new IntersectionObserver(entries=>{
    if(!entries.some(e=>e.isIntersecting))return;warm.disconnect();
    const warmFirst=()=>{if(!frames.size)getFrame(0);};
    const scheduleWarm=()=>{if('requestIdleCallback' in window)requestIdleCallback(warmFirst);else setTimeout(warmFirst,1000);};
    if(document.readyState==='complete')scheduleWarm();else window.addEventListener('load',scheduleWarm,{once:true});
  },{threshold:.01});warm.observe(document.getElementById('work'));
}
if(!reduced.matches&&'IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}});},{threshold:.08});
  document.querySelectorAll('.project-card,.about-copy,.experience,.contact').forEach(el=>{el.classList.add('reveal-ready');observer.observe(el);});
}
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
