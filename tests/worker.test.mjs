import test from 'node:test';
import assert from 'node:assert/strict';
const a='a'.repeat(40),b='b'.repeat(40),privateSha='c'.repeat(40);
const commit=(sha,date,message)=>({sha,html_url:'https://github.com/samimustafaa/public/commit/'+sha,commit:{committer:{date},message}});
const old=commit(a,'2026-10-08T12:00:00Z','Older commit'),fresh=commit(b,'2026-10-09T12:00:00Z','New feature branch commit');
test('feed chooses the newest commit across branches and shares in-flight work',async()=>{
  const worker=(await import('../worker/index.js?test=feed')).default;
  const original=globalThis.fetch;let requests=0,searchRequests=0;
  let repoStarted;const repoLookup=new Promise(resolve=>{repoStarted=resolve;});
  globalThis.fetch=async(url,options)=>{
    requests++;assert.equal(options.headers.Authorization,'Bearer server-only-token');
    const u=new URL(url);let data;
    if(u.pathname==='/user/repos')repoStarted();
    if(u.pathname==='/search/commits'){searchRequests++;await repoLookup;} if(u.pathname==='/search/commits')data={items:[{...old,repository:{private:false,full_name:'samimustafaa/public'}},{...commit(privateSha,'2026-10-10T12:00:00Z','Private message'),repository:{private:true,full_name:'samimustafaa/private'}}]};
    else if(['/user/repos','/users/samimustafaa/repos'].includes(u.pathname))data=[{full_name:'samimustafaa/public',private:false,pushed_at:'2026-10-09T12:00:00Z'},{full_name:'samimustafaa/private',private:true,pushed_at:'2026-10-10T12:00:00Z'}];
    else if(u.pathname.endsWith('/branches'))data=[{name:'main',commit:{sha:a}},{name:'feature',commit:{sha:b}}];
    else if(u.pathname.endsWith('/commits'))data=u.searchParams.get('sha')===b?[fresh,old]:[old];
    else throw new Error('Unexpected API path');
    return Response.json(data);
  };
  try{
    const req=()=>worker.fetch(new Request('https://site.test/api/github/commits'),{GITHUB_USERNAME:'samimustafaa',GITHUB_TOKEN:'server-only-token'});
    const responses=await Promise.all([req(),req()]);const data=await responses[0].json();
    assert.equal(data.commits.length,1);assert.equal(data.commits[0].sha,b);assert.equal(data.refreshSeconds,30);
    assert.equal(searchRequests,1);const initialRequests=requests;await req();assert.equal(requests,initialRequests);
    const serialized=JSON.stringify(data);assert.ok(!serialized.includes('Private message'));assert.ok(!serialized.includes('server-only-token'));
  }finally{globalThis.fetch=original;}
});
test('upstream failures produce a safe recoverable response without credentials',async()=>{
  const worker=(await import('../worker/index.js?test=error')).default;const original=globalThis.fetch;
  globalThis.fetch=async()=>new Response('secret-server-response',{status:401});
  try{const response=await worker.fetch(new Request('https://site.test/api/github/commits'),{GITHUB_TOKEN:'secret-token'});assert.equal(response.status,503);const body=await response.text();assert.ok(!body.includes('secret'));}finally{globalThis.fetch=original;}
});
test('built site serves HTML and fonts with validators and rejects unwanted methods',async()=>{
  const worker=(await import('../dist/server/index.js?test=assets')).default;
  const page=await worker.fetch(new Request('https://site.test/'));assert.equal(page.status,200);const html=await page.text();assert.match(html,/Latest GitHub commit/);assert.ok(!html.includes('More recent commits'));
  for(const name of ['app.js','style.css']){
    const url=html.match(new RegExp(name.replace('.', '\\.')+'\\?v=[a-f0-9]+'))?.[0];assert.ok(url);
    const asset=await worker.fetch(new Request('https://site.test/'+url));assert.match(asset.headers.get('Cache-Control'),/immutable/);
    const plain=await worker.fetch(new Request('https://site.test/'+name));assert.match(plain.headers.get('Cache-Control'),/must-revalidate/);
  }
  const font=await worker.fetch(new Request('https://site.test/assets/fonts/manrope.woff'));assert.match(font.headers.get('Cache-Control'),/immutable/);
  const unchanged=await worker.fetch(new Request('https://site.test/assets/fonts/manrope.woff',{headers:{'If-None-Match':font.headers.get('ETag')}}));assert.equal(unchanged.status,304);
  assert.equal((await worker.fetch(new Request('https://site.test/no-such-file'))).status,404);
  assert.equal((await worker.fetch(new Request('https://site.test/api/github/commits',{method:'POST'}))).status,405);
});
test('an unavailable edge cache never prevents live commits from loading',async()=>{
  const worker=(await import('../worker/index.js?test=cache-unavailable')).default;
  const originalFetch=globalThis.fetch,originalCache=Object.getOwnPropertyDescriptor(globalThis,'caches');
  Object.defineProperty(globalThis,'caches',{configurable:true,value:{default:{async match(){throw new Error('Unsupported cache');},async put(){throw new Error('Unsupported cache');}}}});
  globalThis.fetch=async url=>Response.json(new URL(url).pathname==='/search/commits'?{items:[{...old,repository:{private:false,full_name:'samimustafaa/public'}}]}:[]);
  try{const response=await worker.fetch(new Request('https://site.test/api/github/commits'));assert.equal(response.status,200);assert.equal((await response.json()).commits[0].sha,a);}
  finally{globalThis.fetch=originalFetch;if(originalCache)Object.defineProperty(globalThis,'caches',originalCache);else delete globalThis.caches;}
});
test('revoked credentials fall back to unauthenticated public activity',async()=>{
  const worker=(await import('../worker/index.js?test=revoked-token')).default;const original=globalThis.fetch;let anonymous=0;
  globalThis.fetch=async(url,options)=>{
    if(options.headers.Authorization)return new Response(null,{status:401});
    anonymous++;
    return Response.json(new URL(url).pathname==='/search/commits'?{items:[{...old,repository:{private:false,full_name:'samimustafaa/public'}}]}:[]);
  };
  try{const response=await worker.fetch(new Request('https://site.test/api/github/commits'),{GITHUB_TOKEN:'revoked-test-token'});assert.equal(response.status,200);assert.equal((await response.json()).commits.length,1);assert.equal(anonymous,4);}
  finally{globalThis.fetch=original;}
});
test('authorized private activity includes branch and committer details without shared caching',async()=>{
  const worker=(await import('../worker/index.js?test=private-metadata')).default;
  const originalFetch=globalThis.fetch,originalCache=Object.getOwnPropertyDescriptor(globalThis,'caches');let cacheCalls=0;
  Object.defineProperty(globalThis,'caches',{configurable:true,value:{default:{async match(){cacheCalls++;},async put(){cacheCalls++;}}}});
  globalThis.fetch=async(url,options)=>{
    assert.equal(options.headers.Authorization,'Bearer private-test-token');
    const u=new URL(url);
    if(u.pathname==='/search/commits')return Response.json({items:[]});
    if(u.pathname==='/user/repos')return Response.json([{full_name:'samimustafaa/private',private:true,pushed_at:'2026-10-10T12:00:00Z',owner:{login:'samimustafaa'}}]);
    if(u.pathname.endsWith('/branches'))return Response.json([{name:'release/v2',commit:{sha:privateSha}}]);
    if(u.pathname.endsWith('/commits/'+privateSha))return Response.json({stats:{additions:521,deletions:9},committer:{avatar_url:'https://avatars.githubusercontent.com/u/123'}});
    if(u.pathname.endsWith('/commits'))return Response.json([{...commit(privateSha,'2026-10-10T12:00:00Z','Private update'),author:{login:'samimustafaa'},committer:{login:'samimustafaa'}}]);
    throw new Error('Unexpected route');
  };
  try{
    const response=await worker.fetch(new Request('https://site.test/api/github/commits'),{GITHUB_USERNAME:'samimustafaa',GITHUB_TOKEN:'private-test-token'});
    const data=await response.json();assert.equal(response.status,200);assert.equal(data.commits.length,1);
    const latest=data.commits[0];assert.equal(latest.private,true);assert.equal(latest.sha,privateSha);assert.equal(latest.committer,'samimustafaa');assert.deepEqual(latest.branches,['release/v2']);assert.equal(latest.date,'2026-10-10T12:00:00Z');assert.equal(data.privateAccess,true);assert.equal(cacheCalls,0);assert.deepEqual(latest.stats,{additions:521,deletions:9});assert.equal(latest.avatar,'https://avatars.githubusercontent.com/u/123');
    assert.ok(!JSON.stringify(data).includes('private-test-token'));
  }finally{globalThis.fetch=originalFetch;if(originalCache)Object.defineProperty(globalThis,'caches',originalCache);else delete globalThis.caches;}
});

test('an expired feed returns immediately while exactly one background refresh runs',async()=>{
  const worker=(await import('../worker/index.js?test=background-refresh')).default;
  const originalFetch=globalThis.fetch,originalNow=Date.now;let now=originalNow(),requests=0;
  Date.now=()=>now;
  const request=()=>new Request('https://site.test/api/github/commits');
  globalThis.fetch=async url=>{requests++;return Response.json(new URL(url).pathname==='/search/commits'?{items:[{...old,repository:{private:false,full_name:'samimustafaa/public'}}]}:[]);};
  try{
    await worker.fetch(request(),{GITHUB_TOKEN:'test'});
    now+=21000;let release;const blocked=new Promise(resolve=>{release=resolve;});
    const fetchFast=globalThis.fetch;globalThis.fetch=async(...args)=>{await blocked;return fetchFast(...args);};
    const tasks=[],ctx={waitUntil(task){tasks.push(task);}};
    const first=await worker.fetch(request(),{GITHUB_TOKEN:'test'},ctx);
    const second=await worker.fetch(request(),{GITHUB_TOKEN:'test'},ctx);
    assert.equal((await first.json()).refreshing,true);assert.equal((await second.json()).commits[0].sha,a);
    const before=requests;release();await Promise.all(tasks);
    assert.equal(requests-before,3); // One search, repository list, and branch fallback; details stay cached.
    const refreshed=await worker.fetch(request(),{GITHUB_TOKEN:'test'},ctx);
    assert.equal((await refreshed.json()).refreshing,undefined);
  }finally{globalThis.fetch=originalFetch;Date.now=originalNow;}
});
