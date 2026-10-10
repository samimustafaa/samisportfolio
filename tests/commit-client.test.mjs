import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

// Run the real commit client with a small DOM and clock so polling needs no clicks.
async function client(reduced=false){
  const source=(await readFile(new URL('../dist/app.js',import.meta.url),'utf8')).split("const eye='")[0];
  const timers=new Map(),animations=[],storage=new Map();let nextTimer=0,now=Date.now(),requests=0;
  class Element{
    constructor(){this.children=[];this.style={};this.dataset={};}
    append(...children){this.children.push(...children);}
    replaceChildren(...children){this.children=children;}
    setAttribute(){}
    insertAdjacentHTML(){}
    querySelector(selector){return this.children.find(child=>'.'+child.className===selector)||null;}
    querySelectorAll(){return [];}
    animate(frames,options){const entry={color:this.style.backgroundColor,frames,options,canceled:false};animations.push(entry);return {cancel(){entry.canceled=true;}};}
  }
  const elements=Object.fromEntries(['github','latest-commits','commit-status'].map(id=>[id,new Element()]));
  const makeCommit=(sha,isPrivate=false)=>({sha:sha.repeat(40),repository:'samimustafaa/test',url:'https://github.com/samimustafaa/test/commit/'+sha.repeat(40),date:new Date(now+(sha.charCodeAt(0)-97)*60000).toISOString(),message:'feat: real commit',committer:'samimustafaa',private:isPrivate,branches:['main']});
  const baseline=makeCommit('a'),publicCommit=makeCommit('b'),privateCommit=makeCommit('c',true);
  const feeds=[baseline,{...baseline,stats:{additions:3,deletions:1}},publicCommit,{...publicCommit,stats:{additions:4,deletions:0}},privateCommit];
  const context={document:{hidden:false,getElementById(id){assert.notEqual(id,'header-privacy');return elements[id];},createElement(){return new Element();},addEventListener(){}},window:{},Intl,JSON,AbortController,matchMedia:()=>({matches:reduced}),Date:class extends Date{static now(){return now;}},sessionStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)},setTimeout:(fn,delay)=>{const id=++nextTimer;timers.set(id,{fn,delay});return id;},clearTimeout:id=>timers.delete(id),fetch:async()=>{requests++;return {ok:true,json:async()=>({commits:[feeds.shift()],privateAccess:true})};}};
  vm.runInNewContext(source,context);
  const settle=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
  await settle();
  return {animations,elements,get requests(){return requests;},async poll(){const next=[...timers].find(([,timer])=>timer.delay===30000);assert.ok(next,'a 30-second automatic poll is scheduled');timers.delete(next[0]);now+=30000;await next[1].fn();await settle();}};
}

test('automatic polling highlights only new commits, with public green and private orange fading in 3 seconds',async()=>{
  const page=await client();assert.equal(page.requests,1);assert.equal(page.animations.length,0);
  await page.poll();assert.equal(page.requests,2);assert.equal(page.animations.length,0,'metadata changes are not new commits');
  await page.poll();assert.equal(page.animations.length,1);assert.equal(page.animations[0].color,'#22c55e');assert.equal(page.animations[0].options.duration,3000);assert.equal(page.animations[0].frames.at(-1).opacity,0);
  await page.poll();assert.equal(page.animations.length,1,'metadata updates do not restart the active flash');
  await page.poll();assert.equal(page.requests,5);assert.equal(page.animations.length,2);assert.equal(page.animations[1].color,'#f97316');assert.equal(page.animations[0].canceled,true);assert.equal(page.animations[1].options.duration,3000);
});

test('reduced-motion visitors still receive automatic updates without animation',async()=>{
  const page=await client(true);for(let i=0;i<4;i++)await page.poll();assert.equal(page.requests,5);assert.equal(page.animations.length,0);
});
