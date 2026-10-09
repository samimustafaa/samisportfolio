import worker from '../dist/server/index.js';
let token='';for await(const chunk of process.stdin)token+=chunk;
const start=Date.now();
const response=await worker.fetch(new Request('https://portfolio.test/api/github/commits'),{GITHUB_USERNAME:'samimustafaa',GITHUB_TOKEN:token.trim()});
const data=await response.json();
if(response.status!==200){console.log(JSON.stringify({status:response.status,error:data.error}));process.exit(1);}
if(!data.commits.length)throw new Error('Expected live commit data');
if(token.trim()&&JSON.stringify(data).includes(token.trim()))throw new Error('Credential exposed');
console.log(JSON.stringify({status:response.status,username:data.username,commits:data.commits.length,latestRepository:data.commits[0].repository,latestDate:data.commits[0].date,durationMs:Date.now()-start}));
