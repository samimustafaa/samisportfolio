import {readFile,mkdir,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.woff':'font/woff','.pdf':'application/pdf','.txt':'text/plain; charset=utf-8'};
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
for(const name of ['app.js','style.css'])html=html.replace('href="'+name+'"','href="'+name+'?v='+assets['/'+name].etag.slice(1,-1)+'"').replace('src="'+name+'"','src="'+name+'?v='+assets['/'+name].etag.slice(1,-1)+'"');
assets['/index.html'].body=Buffer.from(html).toString('base64');
assets['/index.html'].etag='"'+createHash('sha256').update(html).digest('hex').slice(0,24)+'"';
await mkdir('dist/server',{recursive:true});await mkdir('dist/.openai',{recursive:true});
const source=await readFile('worker/index.js','utf8');
await writeFile('dist/server/index.js',source.replace('/* SITE_ASSETS */ {}',JSON.stringify(assets)));
await writeFile('dist/.openai/hosting.json',await readFile('.openai/hosting.json'));
console.log(`Built Worker with ${Object.keys(assets).length} assets. No dependencies.`);
