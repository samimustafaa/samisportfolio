const assets=/* SITE_ASSETS */ {};
const decoded=new Map();
const memory=new Map();
const flights=new Map();
const API='https://api.github.com';
const LIMIT=1;
let rejectedToken;
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff'}});}
async function cached(key,seconds,loader){
  const now=Date.now(),entry=memory.get(key);
  if(entry&&entry.until>now)return entry.value;
  if(flights.has(key))return flights.get(key);
  let cache;if(!key.startsWith('private-')){try{cache=globalThis.caches?.default;}catch{}}
  const request=new Request('https://sami-portfolio-studio.samimustafa072.chatgpt.site/__feed-cache/'+encodeURIComponent(key));
  const task=(async()=>{
    if(cache){try{const hit=await cache.match(request);if(hit){const value=await hit.json();const ttl=value.sourceMode==='public'?300:seconds;memory.set(key,{value,until:Date.now()+ttl*1000});return value;}}catch{}}
    const value=await loader(),ttl=value.sourceMode==='public'?300:seconds;
    memory.set(key,{value,until:Date.now()+ttl*1000});
    if(memory.size>120)memory.delete(memory.keys().next().value);
    if(cache){try{await cache.put(request,new Response(JSON.stringify(value),{headers:{'Content-Type':'application/json','Cache-Control':`public, max-age=${ttl}`}}));}catch{}}
    return value;
  })();
  flights.set(key,task);try{return await task;}finally{flights.delete(key);}
}
// Only ciphertext enters the internal edge cache; private metadata never uses a public response cache.
async function snapshotContext(username,env){
  if(!env.GITHUB_TOKEN||!globalThis.crypto?.subtle)return null;
  let cache;try{cache=globalThis.caches?.default;}catch{}if(!cache)return null;
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('portfolio-feed-v2:'+username+':'+env.GITHUB_TOKEN));
  const id=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
  const key=await crypto.subtle.importKey('raw',digest,'AES-GCM',false,['encrypt','decrypt']);
  return {cache,key,request:new Request('https://sami-portfolio-studio.samimustafa072.chatgpt.site/__feed-cache/encrypted-'+id)};
}
async function readSnapshot(context){
  if(!context)return null;
  try{
    const hit=await context.cache.match(context.request);if(!hit)return null;
    const bytes=new Uint8Array(await hit.arrayBuffer());
    const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes.slice(0,12)},context.key,bytes.slice(12));
    const data=JSON.parse(new TextDecoder().decode(plain));
    return data.commits?.length&&Date.now()-Date.parse(data.checkedAt)<86400000?data:null;
  }catch{return null;}
}
async function writeSnapshot(context,data){
  if(!context||!data.commits?.length)return;
  try{
    const iv=crypto.getRandomValues(new Uint8Array(12));
    const encrypted=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},context.key,new TextEncoder().encode(JSON.stringify(data))));
    const bytes=new Uint8Array(12+encrypted.length);bytes.set(iv);bytes.set(encrypted,12);
    await context.cache.put(context.request,new Response(bytes,{headers:{'Content-Type':'application/octet-stream','Cache-Control':'max-age=86400'}}));
  }catch{}
}
async function github(path,env,authenticatedOnly=false){
  const headers={'Accept':'application/vnd.github+json','User-Agent':'Sami-Mustafa-Portfolio','X-GitHub-Api-Version':'2022-11-28'};
  if(env.GITHUB_TOKEN&&env.GITHUB_TOKEN!==rejectedToken)headers.Authorization='Bearer '+env.GITHUB_TOKEN;
  if(authenticatedOnly&&!headers.Authorization)throw new Error('Private GitHub access unavailable');
  let response=await fetch(API+path,{headers,signal:AbortSignal.timeout(12000)});
  // Public activity still works when a token has expired or been revoked.
  if(headers.Authorization&&[401,403].includes(response.status)){
    if(response.status===401)rejectedToken=env.GITHUB_TOKEN;
    if(authenticatedOnly)throw new Error('Private GitHub access unavailable');
    delete headers.Authorization;
    response=await fetch(API+path,{headers,signal:AbortSignal.timeout(12000)});
  }
  if(response.status===409)return [];
  if(!response.ok){console.warn('GitHub feed upstream status',response.status);throw new Error('GitHub feed unavailable');}
  return response.json();
}
function normalize(item,repo,details={}){
  const date=item.commit?.committer?.date||item.commit?.author?.date;
  if(!/^[a-f0-9]{40}$/i.test(item.sha)||!date||!Number.isFinite(Date.parse(date)))return null;
  if(typeof item.html_url!=='string'||!item.html_url.startsWith('https://github.com/'))return null;
  return {sha:item.sha,message:String(item.commit?.message||'Commit').split('\n')[0].slice(0,250),repository:repo,url:item.html_url,date,private:details.private===true,branches:details.branch?[details.branch]:[],author:item.author?.login||item.commit?.author?.name||'Unknown author',committer:item.committer?.login||item.commit?.committer?.name||item.author?.login||item.commit?.author?.name||'Unknown committer'};
}
async function parallel(items,fn){
  const output=[];let next=0;
  await Promise.all(Array.from({length:Math.min(4,items.length)},async()=>{while(next<items.length){const index=next++;output[index]=await fn(items[index]);}}));
  return output;
}
function newest(items){const unique=new Map();for(const item of items.filter(Boolean)){const key=item.repository+':'+item.sha,existing=unique.get(key);if(existing){existing.branches=[...new Set([...existing.branches,...item.branches])];}else unique.set(key,{...item,branches:[...item.branches]});}return [...unique.values()].sort((a,b)=>Date.parse(b.date)-Date.parse(a.date)).slice(0,LIMIT);}
async function repositoryCommits(repo,username,env,onProgress=()=>{}){
  return cached('private-repo-v1:'+repo.full_name+':'+repo.pushed_at+':'+username,86400,async()=>{
    const base='/repos/'+repo.full_name;
    const branches=[];let page=1;
    while(true){const rows=await github(base+'/branches?per_page=100&page='+page,env,repo.private);branches.push(...rows);if(rows.length<100)break;page++;}
    const lists=await parallel(branches,async branch=>{
      const params=new URLSearchParams({sha:branch.commit.sha,author:username,per_page:String(LIMIT)});
      const rows=await github(base+'/commits?'+params,env,repo.private).catch(()=>[]);
      const commits=rows.map(item=>normalize(item,repo.full_name,{private:repo.private,branch:branch.name})).filter(Boolean);
      if(commits.length)onProgress(commits);return commits;
    });
    return newest(lists.flat());
  });
}
async function feed(username,env,onProgress=()=>{}){
  return cached('private-latest-card-v1:'+username,20,async()=>{
    const params=new URLSearchParams({q:'author:'+username+' is:public',sort:'committer-date',order:'desc',per_page:String(LIMIT)});
    // Search supplies history and contributions; direct branch requests catch fresh pushes before indexing.
    const getRepos=async page=>{
      try{return {repos:await github('/user/repos?affiliation=owner&visibility=all&sort=pushed&per_page=100&page='+page,env,true),privateAccess:true};}
      catch{return {repos:await github('/users/'+encodeURIComponent(username)+'/repos?sort=pushed&per_page=100&page='+page,env),privateAccess:false};}
    };
    // Start the two independent lookups together instead of waiting on search indexing.
    const [search,firstPage]=await Promise.all([
      github('/search/commits?'+params,env).catch(()=>({items:[]})).then(search=>{const commits=newest((search.items||[]).filter(item=>item.repository?.private===false).map(item=>normalize(item,item.repository.full_name)));if(commits.length)onProgress({username,commits,checkedAt:new Date().toISOString(),refreshSeconds:30,privateAccess:false,sourceMode:'public',refreshing:true});return search;}),
      getRepos(1).catch(()=>null)
    ]);
    let commits=newest((search.items||[]).filter(item=>item.repository?.private===false).map(item=>normalize(item,item.repository.full_name)));
    let privateAccess=false;
    let page=1;
    while(true){
      const result=page===1?firstPage:await getRepos(page).catch(()=>null);
      if(!result){if(commits.length)break;throw new Error('GitHub feed unavailable');}
      const {repos}=result;privateAccess=result.privateAccess;
      let reachedOlder=false;
      // Work in bounded groups: four repositories at a time, with a fresh cutoff per group.
      for(let offset=0;offset<repos.length;offset+=4){
        const cutoff=commits.length>=LIMIT?Date.parse(commits.at(-1).date):0;
        const eligible=[];
        for(const repo of repos.slice(offset,offset+4)){
          if(!repo.pushed_at||repo.owner?.login&&repo.owner.login.toLowerCase()!==username.toLowerCase()||repo.private&&!privateAccess)continue;
          if(cutoff&&Date.parse(repo.pushed_at)<cutoff){reachedOlder=true;break;}
          eligible.push(repo);
        }
        const rows=await parallel(eligible,repo=>repositoryCommits(repo,username,env,rows=>{commits=newest([...commits,...rows]);onProgress({username,commits,checkedAt:new Date().toISOString(),refreshSeconds:30,privateAccess,sourceMode:privateAccess?'authenticated':'public',refreshing:true});}).catch(()=>[]));
        commits=newest([...commits,...rows.flat()]);
        if(commits.length)onProgress({username,commits,checkedAt:new Date().toISOString(),refreshSeconds:30,privateAccess,sourceMode:privateAccess?'authenticated':'public',refreshing:true});
        if(reachedOlder)break;
      }
      if(reachedOlder||repos.length<100)break;page++;
    }
    if(commits[0]&&!commits[0].branches.length){try{const repo=await github('/repos/'+commits[0].repository,env,commits[0].private);if(repo.default_branch)commits[0].branches=[repo.default_branch];}catch{}}
    if(commits[0]){try{
      const latest=commits[0];
      const detail=await cached('private-detail-v1:'+latest.repository+':'+latest.sha,86400,()=>github('/repos/'+latest.repository+'/commits/'+latest.sha,env,latest.private));
      if(Number.isInteger(detail.stats?.additions)&&Number.isInteger(detail.stats?.deletions))latest.stats={additions:detail.stats.additions,deletions:detail.stats.deletions};
      const avatar=detail.committer?.avatar_url||detail.author?.avatar_url;
      if(typeof avatar==='string'&&avatar.startsWith('https://avatars.githubusercontent.com/'))latest.avatar=avatar;
    }catch{}}
    return {username,commits,checkedAt:new Date().toISOString(),refreshSeconds:30,privateAccess,sourceMode:env.GITHUB_TOKEN&&env.GITHUB_TOKEN!==rejectedToken?'authenticated':'public'};
  });
}
export default {
  async fetch(request,env={},ctx={}){
    const url=new URL(request.url);
    if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD'}});
    if(url.pathname==='/api/github/commits'){
      const username=env.GITHUB_USERNAME||'samimustafaa';
      if(!/^[a-z\d-]{1,39}$/i.test(username))return json({error:'GitHub feed not configured'},503);
      const key='private-latest-card-v1:'+username;
      let previous=memory.get(key);
      if(previous?.until>Date.now())return json(previous.value);
      const snapshot=await snapshotContext(username,env);
      if(!previous){const saved=await readSnapshot(snapshot);if(saved){previous={value:saved,until:Date.parse(saved.checkedAt)+20000};memory.set(key,previous);}}
      if(previous?.until>Date.now()&&!previous.value.refreshing)return json(previous.value);
      let firstResolve;
      const first=new Promise(resolve=>{firstResolve=resolve;});
      let partialWrite=Promise.resolve(),savedPartial=false;
      const task=feed(username,env,data=>{
        firstResolve({...data,refreshing:true});
        if(!savedPartial&&!previous?.value?.commits?.length){savedPartial=true;partialWrite=writeSnapshot(snapshot,data);}
        // Preserve the last result in memory while the full scan continues.
        if(!previous?.value?.commits?.length)memory.set(key,{value:data,until:0});
      }).then(async data=>{
        // An empty/error response must never erase a successfully synced card.
        if(!data.commits.length&&previous?.value?.commits?.length){data={...previous.value,stale:true,refreshing:false};memory.set(key,{value:data,until:Date.now()+15000});}
        await partialWrite;await writeSnapshot(snapshot,data);return data;
      }).catch(()=>{
        const last=memory.get(key)?.value||previous?.value;
        if(last?.commits?.length){const value={...last,stale:true,refreshing:false};memory.set(key,{value,until:Date.now()+15000});return value;}
        return {username,commits:[],refreshing:true,refreshSeconds:30};
      });
      if(ctx.waitUntil){
        ctx.waitUntil(task);
        if(previous?.value?.commits?.length)return json({...previous.value,refreshing:true});
        let timer;
        const pending=new Promise(resolve=>{timer=setTimeout(()=>resolve({username,commits:[],refreshing:true,refreshSeconds:30}),2000);});
        const result=await Promise.race([task,first,pending]);clearTimeout(timer);
        return json(result,result.commits.length?200:202);
      }
      const result=await task;
      return result.commits.length?json(result):json({error:'GitHub is temporarily unavailable. Please try again shortly.'},503);
    }
    if(url.pathname==='/index.html')return new Response(null,{status:308,headers:{Location:'/'}});
    const name=url.pathname==='/'?'/index.html':url.pathname;
    const asset=assets[name];if(!asset)return new Response('Page not found',{status:404});
    const headers={'Content-Type':asset.type,'ETag':asset.etag,'X-Content-Type-Options':'nosniff','Cache-Control':name==='/index.html'?'no-store':url.searchParams.get('v')===asset.etag.slice(1,-1)||name.startsWith('/assets/fonts/')||name.startsWith('/assets/tech/')?'public, max-age=31536000, immutable':name.startsWith('/assets/')?'public, max-age=86400':'public, max-age=0, must-revalidate'};
    if(request.headers.get('If-None-Match')===asset.etag)return new Response(null,{status:304,headers});
    if(request.method==='HEAD')return new Response(null,{headers});
    if(!decoded.has(name))decoded.set(name,Uint8Array.from(atob(asset.body),c=>c.charCodeAt(0)));
    return new Response(decoded.get(name),{headers});
  }
};
