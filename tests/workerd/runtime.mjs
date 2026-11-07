// Opt-in runtime proof (npm run test:workerd): runs the real guest booking route + booking-store + pg adapter
// inside Cloudflare's workerd (the runtime family Lovable's TanStack Start/Nitro build targets) against a
// throwaway local PostgreSQL migrated with supabase/migrations and reached as the least-privilege nea_runtime role.
// Synthetic data only; no network credentials; wrangler is fetched via npx like the pinned Supabase CLI.
import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import net from 'node:net';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url),here=path.dirname(fileURLToPath(import.meta.url));
const pg=require('../support/realpg.cjs'),postgres=require('postgres');
const WRANGLER='wrangler@4.158.0';
// Hosted mode (npm run test:workerd:preview): the same suite against the approved Preview Supabase branch through
// its REAL transaction pooler, configured only via the gitignored .env.preflight. Guarded so it can never touch Production.
const PROD_REF='amfaldeqkqqovfggayoj';
const hosted=!!process.env.PREFLIGHT_RUNTIME_URL;
function hostedTarget(){
 const ref=process.env.NEA_PREFLIGHT_REF,admin=process.env.PREFLIGHT_ADMIN_URL,runtime=process.env.PREFLIGHT_RUNTIME_URL;
 if(!ref||!admin||!runtime)throw Error('hosted mode needs NEA_PREFLIGHT_REF, PREFLIGHT_ADMIN_URL and PREFLIGHT_RUNTIME_URL');
 for(const [k,v] of Object.entries(process.env))if(k.startsWith('PREFLIGHT_')||k.startsWith('NEA_PREFLIGHT')||k==='DATABASE_URL'||k==='MIGRATION_DATABASE_URL')if(String(v).includes(PROD_REF))throw Error(`ABORT: ${k} references the Production project`);
 if(ref===PROD_REF)throw Error('ABORT: Production ref');
 const ru=new URL(runtime),au=new URL(admin);
 if(!ru.username.endsWith('.'+ref)||!au.username.endsWith('.'+ref))throw Error('ABORT: connection user is not scoped to the Preview ref');
 if(ru.username.split('.')[0]!=='nea_runtime')throw Error('ABORT: runtime URL must use the nea_runtime role');
 if(ru.port!=='6543'||!ru.hostname.endsWith('.pooler.supabase.com'))throw Error('ABORT: runtime URL must be the transaction pooler (port 6543)');
 return {ref,admin,runtime};
}
const skip=hosted||pg.available()?false:'no PostgreSQL available (need initdb/pg_ctl or NEA_TEST_ADMIN_URL)';
// Rows this suite may create (synthetic, far-future dates). Anything else in the target aborts the run.
const TEST_DATES=['2099-11-02','2099-12-01','2099-12-02','2099-12-03'];
async function scrub(admin){for(const t of ['occupancy','bookings','blocked_days'])await admin.unsafe(`DELETE FROM nea.${t} WHERE date = ANY($1)`,[TEST_DATES]);}
let server,db,worker,base,log='';
const free=()=>new Promise(r=>{const s=net.createServer().listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p))})});
before(async()=>{
 if(skip)return;
 if(hosted){
  const t=hostedTarget(),admin=postgres(t.admin,{max:2,ssl:'require',onnotice:()=>{}});
  const foreign=Number((await admin.unsafe("SELECT (SELECT count(*) FROM nea.bookings WHERE date <> ALL($1)) + (SELECT count(*) FROM nea.blocked_days WHERE date <> ALL($1)) + (SELECT count(*) FROM nea.occupancy WHERE date <> ALL($1)) AS n",[TEST_DATES]))[0].n);
  if(foreign)throw Error('ABORT: target contains rows that are not this suite\'s synthetic data');
  await scrub(admin);
  db={admin,runtimeUrl:t.runtime,adminUrl:t.admin,async drop(){await scrub(admin);await admin.end();}};
 }else{server=await pg.server();db=await pg.createDatabase(postgres,server.adminUrl);}
 const port=await free();base=`http://127.0.0.1:${port}`;
 worker=spawn('npx',['--yes',WRANGLER,'dev','--local','--ip','127.0.0.1','--port',String(port),'--var',`DATABASE_URL:${db.runtimeUrl}`,'--var','NEA_DATABASE_SCHEMA:nea','--var',`AUTHORIZED_ORIGINS:${base}`],{cwd:here,detached:true,env:{...process.env,WRANGLER_SEND_METRICS:'false',CI:'1'}});
 worker.stdout.on('data',d=>log+=d);worker.stderr.on('data',d=>log+=d);
 for(let i=0;i<240;i++){try{if((await fetch(base+'/probe/runtime')).ok)return;}catch{}await new Promise(r=>setTimeout(r,500));}
 throw Error('workerd did not start:\n'+log);
},{timeout:150000});
after(async()=>{try{process.kill(-worker.pid,'SIGTERM');}catch{}   // whole process group: npx > wrangler > workerd
 await db?.drop();server?.stop();});
const host=hosted?{skip:false}:{skip:'hosted pooler only (npm run test:workerd:preview)'};
const post=(p,b,method='POST',token)=>fetch(base+p,{method,headers:{'content-type':'application/json',origin:base,...(token?{'x-booking-token':token}:{})},...(b?{body:JSON.stringify(b)}:{})});
const hex=()=>crypto.randomUUID().replaceAll('-','')+crypto.randomUUID().replaceAll('-','');
const booking=(patch={})=>({requestId:crypto.randomUUID(),token:hex(),name:'Test Gast',email:`g${Math.random()}@example.com`,phone:'+49 12345678',date:'2099-11-02',time:'19:00',guests:4,notes:'',website:'',accepted:true,...patch});
const count=async(q)=>Number((await db.admin.unsafe(q))[0].n);

test('code executes in workerd, not Node',{skip},async()=>{
 const r=await (await fetch(base+'/probe/runtime')).json();
 assert.equal(r.ua,'Cloudflare-Workers');assert.equal(r.hasProcessEnv,true);
});
test('multiple sequential requests reuse no cross-request I/O (create, idempotent replay, status, cancel)',{skip},async()=>{
 const p=booking();
 assert.equal((await post('/api/booking',p)).status,201);
 assert.equal((await post('/api/booking',p)).status,200);
 const s=await post('/api/booking',null,'GET',p.token);assert.equal(s.status,200);
 const body=await s.json();assert.equal(body.status,'pending');assert.equal('token_hash' in body,false);assert.equal('email' in body,false);
 assert.equal((await post('/api/booking',null,'GET',hex())).status,404);
 assert.equal((await post('/api/booking',null,'PATCH',p.token)).status,200);
 assert.equal((await (await post('/api/booking',null,'GET',p.token)).json()).status,'cancelled');
 assert.equal(await count("SELECT count(*) n FROM nea.bookings WHERE id='"+p.requestId+"'"),1);
});
test('parallel identical submissions create exactly one booking',{skip},async()=>{
 const p=booking({time:'20:00'});
 const rs=await Promise.all(Array.from({length:8},()=>post('/api/booking',p)));
 assert.ok(rs.every(r=>[200,201].includes(r.status)),'statuses '+rs.map(r=>r.status));
 assert.equal(await count("SELECT count(*) n FROM nea.bookings WHERE id='"+p.requestId+"'"),1);
});
test('concurrent confirmations of overlapping bookings on one table: exactly one wins, no partial occupancy',{skip},async()=>{
 const a=booking({date:'2099-12-01',time:'19:00'}),b=booking({date:'2099-12-01',time:'19:30'});
 await post('/api/booking',a);await post('/api/booking',b);
 const rs=await Promise.all([a,b].map(x=>post('/probe/confirm',{id:x.requestId,tables:['Tisch 1']})));
 const ok=(await Promise.all(rs.map(r=>r.json()))).filter(x=>x.ok).length;
 assert.equal(ok,1,'exactly one confirmation must succeed');
 assert.equal(await count("SELECT count(*) n FROM nea.occupancy WHERE date='2099-12-01'"),5);
 assert.equal(await count("SELECT count(*) n FROM nea.bookings WHERE date='2099-12-01' AND status='confirmed'"),1);
 assert.equal(await count("SELECT count(*) n FROM nea.bookings WHERE date='2099-12-01' AND status='pending'"),1);
});
test('adjacent bookings on one table both confirm; different tables never conflict',{skip},async()=>{
 const a=booking({date:'2099-12-02',time:'12:00'}),b=booking({date:'2099-12-02',time:'13:30'}),c=booking({date:'2099-12-02',time:'12:00'});
 for(const x of [a,b,c])await post('/api/booking',x);
 const rs=await Promise.all([[a,'Tisch 1'],[b,'Tisch 1'],[c,'Tisch 2']].map(([x,t])=>post('/probe/confirm',{id:x.requestId,tables:[t]})));
 assert.deepEqual((await Promise.all(rs.map(r=>r.json()))).map(x=>x.ok),[true,true,true]);
});
test('blocked day is honoured by the guest route in the worker',{skip},async()=>{
 await db.admin.unsafe("INSERT INTO nea.blocked_days(id,owner,date) VALUES ('nea-1889:2099-12-03','nea-1889','2099-12-03')");
 assert.equal((await post('/api/booking',booking({date:'2099-12-03'}))).status,409);
});
test('validation and abuse limits hold: bad consent, honeypot, oversize body',{skip},async()=>{
 assert.equal((await post('/api/booking',booking({accepted:false}))).status,400);
 assert.equal((await post('/api/booking',booking({website:'x'}))).status,400);
 assert.equal((await post('/api/booking',booking({notes:'x'.repeat(13000)}))).status,413);
});
test('runtime role is least-privilege inside the worker (no DDL, TRUNCATE, legacy table, role creation)',{skip},async()=>{
 const r=await (await fetch(base+'/probe/privileges')).json();
 assert.deepEqual({ddl:r.ddl,legacy:r.legacy,truncate:r.truncate,role:r.role},{ddl:'denied',legacy:'denied',truncate:'denied',role:'denied'});
 assert.match(r.user,/^nea_runtime$/);assert.equal(r.searchPath.replaceAll('"',''),'nea');
});
test('no secret is reflected in any response body or header, including errors',{skip},async()=>{
 const secret=new URL(db.runtimeUrl).password;
 for(const res of [await post('/api/booking',booking()),await post('/api/booking',null,'GET',hex()),await fetch(base+'/probe/privileges'),await post('/api/booking',{bad:true})]){
  const text=await res.text()+JSON.stringify([...res.headers]);assert.equal(text.includes(secret),false);assert.equal(text.includes(db.runtimeUrl),false);
 }
});

// ---- hosted transaction-pooler checks (Preview only) ----
test('pooler: SET LOCAL search_path never leaks across pooled backends (transaction mode)',host,async()=>{
 assert.equal(new URL(db.runtimeUrl).port,'6543');
 const infos=[];for(let i=0;i<30;i++)infos.push(await (await fetch(base+'/probe/info')).json());
 for(const i of infos){assert.equal(i.user,'nea_runtime');assert.equal(i.searchPath.replaceAll('"',''),'nea');assert.equal(i.statementTimeout,'15s');}
 // Same pooler, same role, from Node. Mirrors the adapter: every client holds ONE connection and issues statements
 // strictly one after another (never pipelined: Supavisor's transaction mode stalls when several statements are queued
 // on one connection). 6 independent clients alternate SET LOCAL transactions with bare statements; a leaked
 // session-level setting would show 'nea' on a bare statement served by a backend that previously ran a transaction.
 const seen=new Set();
 await Promise.all(Array.from({length:6},async()=>{
  const sql=postgres(db.runtimeUrl,{max:1,ssl:'require',prepare:false,connect_timeout:10,onnotice:()=>{}});
  try{
   for(let i=0;i<10;i++){
    await sql.begin(async tx=>{await tx.unsafe('SET LOCAL search_path TO "nea"');await tx.unsafe('SELECT 1 FROM bookings LIMIT 1');});
    seen.add((await sql.unsafe('SHOW search_path'))[0].search_path.replaceAll('"',''));
   }
  }finally{await sql.end({timeout:2});}
 }));
 assert.ok(!seen.has('nea'),'search_path leaked: '+[...seen]);
});
test('pooler: statement_timeout of nea_runtime (15 s) is enforced through the pooler',host,async()=>{
 const t0=Date.now(),r=await (await fetch(base+'/probe/sleep',{signal:AbortSignal.timeout(35000)})).json();
 assert.equal(r.cancelled,true);assert.ok(Date.now()-t0<25000,'took '+(Date.now()-t0));
},{timeout:40000});
test('pooler: connections are released after a 60-request burst (no per-request leak)',host,async()=>{
 const count=async()=>Number((await db.admin.unsafe("SELECT count(*) n FROM pg_stat_activity WHERE usename='nea_runtime'"))[0].n);
 const before=await count(),lat=[];
 for(let b=0;b<6;b++)await Promise.all(Array.from({length:10},async()=>{const t=Date.now();const r=await post('/api/booking',null,'GET',hex());assert.equal(r.status,404);lat.push(Date.now()-t);}));
 await new Promise(r=>setTimeout(r,3000));const after=await count();
 lat.sort((a,b)=>a-b);console.log(`# pooler burst: backends before=${before} after=${after}; latency ms p50=${lat[30]} p95=${lat[57]} max=${lat[59]}`);
 assert.ok(after<=before+10,`backends grew from ${before} to ${after}`);assert.ok(lat[57]<5000);
});
