import {readFile,mkdir,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import vm from 'node:vm';
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.woff':'font/woff','.pdf':'application/pdf','.txt':'text/plain; charset=utf-8','.png':'image/png','.xml':'application/xml; charset=utf-8'};
const assets={};
async function walk(directory){
  for(const entry of await readdir(directory,{withFileTypes:true})){
    if(entry.name==='server'||entry.name==='.openai')continue;
    const file=path.join(directory,entry.name);
    if(entry.isDirectory()){await walk(file);continue;}
    const data=await readFile(file),url='/'+path.relative('dist',file).split(path.sep).join('/');
    assets[url]={body:data.toString('base64'),type:types[path.extname(file)]||'application/octet-stream',etag:'"'+createHash('sha256').update(data).digest('hex').slice(0,24)+'"'};
  }
}
await walk('dist');
// Content versions allow long-lived JS/CSS caching without stale releases.
let html=Buffer.from(assets['/index.html'].body,'base64').toString('utf8');
// Publish project names and links in the initial HTML for crawlers and fast first paint.
const app=await readFile('dist/app.js','utf8');
const start=app.indexOf('const projects = ')+17,end=app.indexOf('];',start)+1;
const projects=vm.runInNewContext('('+app.slice(start,end)+')',Object.create(null),{timeout:1000});
const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const eye='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
const cards=projects.map((p,i)=>`<article class="project-card" data-project="${i}"><div class="project-top"><span class="project-index">${String(i+1).padStart(2,'0')} /</span><span class="project-category">${escape(p.type)}</span></div><h3><a href="${escape(p.url)}" target="_blank" rel="noopener">${escape(p.name)}</a></h3><p>${escape(p.description)}</p><div class="project-bottom"><div class="tech">${p.tech.map(t=>`<span>${escape(t)}</span>`).join('')}</div><button class="preview-trigger" aria-label="Preview ${escape(p.name)}" aria-controls="project-preview" aria-haspopup="dialog">${eye} Preview</button></div></article>`).join('');
html=html.replace('<div class="project-grid" id="projects"></div>','<div class="project-grid" id="projects">'+cards+'</div>');

for(const name of ['app.js','style.css'])html=html.replace('href="'+name+'"','href="'+name+'?v='+assets['/'+name].etag.slice(1,-1)+'"').replace('src="'+name+'"','src="'+name+'?v='+assets['/'+name].etag.slice(1,-1)+'"');
assets['/index.html'].body=Buffer.from(html).toString('base64');
assets['/index.html'].etag='"'+createHash('sha256').update(html).digest('hex').slice(0,24)+'"';
await mkdir('dist/server',{recursive:true});await mkdir('dist/.openai',{recursive:true});
const source=await readFile('worker/index.js','utf8');
await writeFile('dist/server/index.js',source.replace('/* SITE_ASSETS */ {}',JSON.stringify(assets)));
await writeFile('dist/.openai/hosting.json',await readFile('.openai/hosting.json'));
console.log(`Built Worker with ${Object.keys(assets).length} assets. No dependencies.`);
