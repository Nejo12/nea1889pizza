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
const skip=pg.available()?false:'no PostgreSQL available (need initdb/pg_ctl or NEA_TEST_ADMIN_URL)';
let server,db,worker,base,log='';
const free=()=>new Promise(r=>{const s=net.createServer().listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p))})});
before(async()=>{
 if(skip)return;
 server=await pg.server();db=await pg.createDatabase(postgres,server.adminUrl);
 const port=await free();base=`http://127.0.0.1:${port}`;
 worker=spawn('npx',['--yes',WRANGLER,'dev','--local','--ip','127.0.0.1','--port',String(port),'--var',`DATABASE_URL:${db.runtimeUrl}`,'--var','NEA_DATABASE_SCHEMA:nea'],{cwd:here,env:{...process.env,WRANGLER_SEND_METRICS:'false',CI:'1'}});
 worker.stdout.on('data',d=>log+=d);worker.stderr.on('data',d=>log+=d);
 for(let i=0;i<240;i++){try{if((await fetch(base+'/probe/runtime')).ok)return;}catch{}await new Promise(r=>setTimeout(r,500));}
 throw Error('workerd did not start:\n'+log);
},{timeout:150000});
after(async()=>{worker?.kill('SIGTERM');await db?.drop();server?.stop();});
const post=(p,b,method='POST',token)=>fetch(base+p,{method,headers:{'content-type':'application/json',...(token?{'x-booking-token':token}:{})},...(b?{body:JSON.stringify(b)}:{})});
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
