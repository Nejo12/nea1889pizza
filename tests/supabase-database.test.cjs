// Real PostgreSQL tests for the Supabase migration, privilege model and booking concurrency.
// Runs on an ephemeral local server, or on NEA_TEST_ADMIN_URL (e.g. `npm run db:local`).
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawnSync}=require('node:child_process');
const support=require('./support/realpg.cjs'),postgres=require('postgres');
const skip=support.available()?false:'No PostgreSQL available: install initdb/pg_ctl or set NEA_TEST_ADMIN_URL.';
let srv,db,rules,store,api,admin,adapter,gate=null,staff=true;
const real=()=>adapter.database();
// Lets a test freeze updateBooking between its read and its transaction to force a genuine race.
const staffModule={isStaff:async()=>staff,staffFromRequest:async()=>staff?{ok:true,staff:{id:'u',email:'s@example.com',role:'staff'}}:{ok:false,status:401},database:()=>({prepare:q=>{const s=real().prepare(q);if(gate&&/^SELECT \* FROM bookings WHERE id=\?$/.test(q)&&gate.armed){const first=s.first.bind(s);s.first=async()=>{const r=await first();gate.armed=false;gate.reached();await gate.release;return r};}return s},batch:c=>real().batch(c)})};
before(async()=>{
 if(skip)return;
 srv=await support.server();db=await support.createDatabase(postgres,srv.adminUrl);
 process.env.DATABASE_URL=db.runtimeUrl;process.env.NEA_DATABASE_SCHEMA='nea';
 adapter=support.load('lib/database.ts',{postgres});
 rules=support.load('lib/reservation-rules.ts');
 store=support.load('lib/booking-store.ts',{'./staff':staffModule,'./reservation-rules':rules,'./email':require('./support/no-email.cjs')});
 process.env.AUTHORIZED_ORIGINS='https://test.example';const imports={'@/lib/staff':staffModule,'@/lib/booking-store':store,'@/lib/email':require('./support/no-email.cjs'),'@/lib/reservation-rules':rules,'@/lib/request-security':support.load('lib/request-security.ts',{'./trusted-origins':support.load('lib/trusted-origins.ts')})};
 api=support.load('app/api/booking/route.ts',imports);admin=support.load('app/api/reservations/route.ts',imports);
});
after(async()=>{if(skip)return;await db.drop();srv.stop();});
const token=()=>crypto.randomUUID().replaceAll('-','')+crypto.randomUUID().replaceAll('-','');
const payload=(patch={})=>({requestId:crypto.randomUUID(),token:token(),name:'Test Gast',email:'t'+Math.random().toString(36).slice(2)+'@example.com',phone:'+49 12345678',date:'2099-11-02',time:'19:00',guests:4,notes:'',accepted:true,website:'',...patch});
const req=(p,method='POST',body=true)=>new Request('https://test.example/api/booking',{method,headers:{'Content-Type':'application/json',Origin:'https://test.example','X-Booking-Token':p.token},...(method==='POST'&&body?{body:JSON.stringify(p)}:{})});
const staffReq=body=>new Request('https://test.example/api/reservations',{method:'PATCH',headers:{'Content-Type':'application/json',Origin:'https://test.example'},body:JSON.stringify(body)});
const create=async patch=>{const p=payload(patch);assert.equal((await api.POST(req(p))).status,201);return p;};
const rows=async(sql,...a)=>db.admin.unsafe(sql,a);
const occupancyOf=async id=>(await rows('SELECT count(*)::int n FROM nea.occupancy WHERE booking_id=$1',id))[0].n;
const statusOf=async id=>(await rows('SELECT status FROM nea.bookings WHERE id=$1',id))[0].status;
const revision=async id=>(await rows('SELECT updated,status FROM nea.bookings WHERE id=$1',id))[0];

test('migration creates the schema, keys, indexes and unchanged column types',{skip},async()=>{
 const cols=await rows("SELECT table_name,column_name,data_type,is_nullable,column_default FROM information_schema.columns WHERE table_schema='nea' ORDER BY table_name,ordinal_position");
 const shape=t=>cols.filter(c=>c.table_name===t).map(c=>`${c.column_name}:${c.data_type}${c.is_nullable==='NO'?'!':''}`).join(',');
 assert.equal(shape('bookings'),'id:text!,token_hash:text!,name:text!,email:text!,phone:text!,date:text!,time:text!,guests:integer!,notes:text!,status:text!,table_ids:text!,duration:integer!,created:text!,updated:text!');
 assert.equal(shape('occupancy'),'id:text!,booking_id:text!,table_id:text!,date:text!,minute:integer!');
 assert.equal(shape('blocked_days'),'id:text!,owner:text!,date:text!');
 assert.equal(shape('reservations'),'id:text!,owner:text!,name:text!,email:text!,phone:text!,date:text!,time:text!,guests:integer!,notes:text!,status:text!,created:text!');
 assert.equal(cols.find(c=>c.table_name==='bookings'&&c.column_name==='table_ids').column_default,"'[]'::text");
 assert.equal(cols.find(c=>c.table_name==='bookings'&&c.column_name==='duration').column_default,'75');
 const pks=await rows("SELECT conrelid::regclass::text t FROM pg_constraint WHERE contype='p' AND connamespace='nea'::regnamespace ORDER BY 1");
 assert.deepEqual(pks.map(r=>r.t),['nea.blocked_days','nea.bookings','nea.email_events','nea.occupancy','nea.reservations','nea.staff_members']);
 const idx=(await rows("SELECT indexname FROM pg_indexes WHERE schemaname='nea'")).map(r=>r.indexname);
 for(const i of ['bookings_date_time','bookings_token','occupancy_booking'])assert.ok(idx.includes(i),i);
 const rls=await rows("SELECT relname,relrowsecurity FROM pg_class WHERE relnamespace='nea'::regnamespace AND relkind='r'");
 assert.ok(rls.length===6&&rls.every(r=>r.relrowsecurity));
});

test('migration files are versioned, non-empty and contain no secrets',{skip},()=>{
 const files=support.migrations();assert.ok(files.length>=1);
 for(const m of files){assert.match(m.file,/^\d{14}_[a-z0-9_]+\.sql$/);assert.doesNotMatch(m.sql,/PASSWORD\s+'[^<']/i);assert.doesNotMatch(m.sql,/BYPASSRLS(?<!NOBYPASSRLS)/);}
});

test('runtime role: data access only, no DDL, no legacy table, API roles locked out',{skip},async()=>{
 const rt=postgres(db.runtimeUrl,{max:1,onnotice:()=>{}});
 try{
  assert.equal((await rt.unsafe('SELECT count(*)::int n FROM nea.bookings'))[0].n>=0,true);
  for(const sql of ['CREATE TABLE nea.evil(id int)','DROP TABLE nea.bookings','TRUNCATE nea.bookings','ALTER TABLE nea.bookings ADD COLUMN x int','SELECT * FROM nea.reservations','CREATE SCHEMA evil','CREATE ROLE evil','ALTER TABLE nea.bookings DISABLE ROW LEVEL SECURITY'])
   await assert.rejects(()=>rt.unsafe(sql),/permission denied|must be owner|must have/i,sql);
  const me=(await rt.unsafe("SELECT rolsuper,rolcreaterole,rolcreatedb,rolbypassrls FROM pg_roles WHERE rolname=current_user"))[0];
  assert.deepEqual(me,{rolsuper:false,rolcreaterole:false,rolcreatedb:false,rolbypassrls:false});
 }finally{await rt.end();}
 for(const role of ['anon','authenticated','service_role']){
  await assert.rejects(()=>db.admin.begin(async tx=>{await tx.unsafe(`SET LOCAL ROLE ${role}`);await tx.unsafe('SELECT * FROM nea.bookings');}),/permission denied/,role);
  const [g]=await rows("SELECT has_schema_privilege($1,'nea','USAGE') u,has_table_privilege($1,'nea.bookings','SELECT') s,has_table_privilege($1,'nea.occupancy','SELECT') o",role);
  assert.deepEqual(g,{u:false,s:false,o:false},role);
 }
 // Defence in depth: even a mistaken grant yields no rows because only nea_runtime has a policy.
 await db.admin.begin(async tx=>{await tx.unsafe('GRANT USAGE ON SCHEMA nea TO anon; GRANT SELECT ON nea.bookings TO anon');await tx.unsafe('SET LOCAL ROLE anon');assert.equal((await tx.unsafe('SELECT count(*)::int n FROM nea.bookings'))[0].n,0);await tx.unsafe('RESET ROLE');throw Error('rollback');}).catch(e=>assert.equal(e.message,'rollback'));
});

test('public booking API on real PostgreSQL: create, repeat, token status, wrong token',{skip},async()=>{
 const p=payload({date:'2099-11-03',name:"O'Brien; DROP TABLE nea.bookings;--"});
 assert.equal((await api.POST(req(p))).status,201);assert.equal((await api.POST(req(p))).status,200);
 assert.equal((await api.POST(req({...p,token:'a'.repeat(64)}))).status,409);
 const status=await(await api.GET(req(p,'GET'))).json();assert.equal(status.status,'pending');assert.equal(status.name,"O'Brien; DROP TABLE nea.bookings;--");
 assert.equal((await api.GET(req({token:'b'.repeat(64)},'GET'))).status,404);
 assert.equal((await rows('SELECT count(*)::int n FROM nea.bookings WHERE id=$1',p.requestId))[0].n,1);
});

test('overlapping confirmations are rejected atomically; adjacent visits are allowed',{skip},async()=>{
 const a=await create({date:'2099-12-01'}),b=await create({date:'2099-12-01',time:'19:30'}),c=await create({date:'2099-12-01',time:'20:30'});
 await store.updateBooking(a.requestId,'confirmed',['Tisch 1']);
 await assert.rejects(()=>store.updateBooking(b.requestId,'confirmed',['Tisch 1']),/belegt/);
 assert.equal(await statusOf(b.requestId),'pending');assert.equal(await occupancyOf(b.requestId),0);
 await store.updateBooking(c.requestId,'confirmed',['Tisch 1']);          // 19:00 + 75 min ends 20:15, before 20:30
 await store.updateBooking(b.requestId,'confirmed',['Tisch 2']);
 assert.equal((await rows("SELECT count(*)::int n FROM nea.occupancy WHERE date='2099-12-01' AND table_id='Tisch 1'"))[0].n,10);
 await store.updateBooking(a.requestId,'cancelled',[]);                  // cancellation frees the slots
 assert.equal(await occupancyOf(a.requestId),0);
});

test('multi-table confirmation rolls back every row when one table conflicts',{skip},async()=>{
 const a=await create({date:'2099-12-02'}),b=await create({date:'2099-12-02',time:'19:30',guests:6});
 await store.updateBooking(a.requestId,'confirmed',['Tisch 1']);
 await assert.rejects(()=>store.updateBooking(b.requestId,'confirmed',['Tisch 5','Tisch 6','Tisch 1']));
 assert.equal(await occupancyOf(b.requestId),0);assert.equal(await statusOf(b.requestId),'pending');
 assert.equal((await rows("SELECT count(*)::int n FROM nea.occupancy WHERE date='2099-12-02'"))[0].n,5);
});

test('adapter batch is one transaction: a failing statement undoes earlier statements',{skip},async()=>{
 const id=crypto.randomUUID(),d=real();
 await assert.rejects(()=>d.batch([
  d.prepare("INSERT INTO bookings (id,token_hash,name,email,phone,date,time,guests,notes,status,created,updated) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)").bind(id,'h','n','e@x.de','1234567','2099-12-03','19:00',2,'','pending','c','u'),
  d.prepare("INSERT INTO occupancy (id,booking_id,table_id,date,minute) VALUES ('dup',?, 'Tisch 1','2099-12-03',1140)").bind(id),
  d.prepare("INSERT INTO occupancy (id,booking_id,table_id,date,minute) VALUES ('dup',?, 'Tisch 1','2099-12-03',1140)").bind(id),
 ]));
 assert.equal((await rows('SELECT count(*)::int n FROM nea.bookings WHERE id=$1',id))[0].n,0);
 assert.equal((await rows("SELECT count(*)::int n FROM nea.occupancy WHERE id='dup'"))[0].n,0);
});

test('capacity: seats must cover the party; unknown tables and empty selections are rejected',{skip},async()=>{
 const five=await create({date:'2099-12-04',guests:5});
 for(const tables of [['Tisch 3'],['Tisch 3','Tisch 4'],[],['Tisch 99'],['Tisch 3','Tisch 3']])await assert.rejects(()=>store.updateBooking(five.requestId,'confirmed',tables),/Tisch|Plätze/);
 assert.equal(await occupancyOf(five.requestId),0);assert.equal(await statusOf(five.requestId),'pending');
 await store.updateBooking(five.requestId,'confirmed',['Tisch 1','Tisch 3']);   // 4 + 2 seats
 assert.equal(await occupancyOf(five.requestId),10);
 assert.equal(rules.restaurantTables.length,20);
 assert.equal((await api.POST(req(payload({guests:13})))).status,400);
});

test('concurrent confirms for one table: exactly one wins, no partial occupancy',{skip},async()=>{
 const bookings=await Promise.all(Array.from({length:6},()=>create({date:'2099-12-05'})));
 const res=await Promise.allSettled(bookings.map(b=>store.updateBooking(b.requestId,'confirmed',['Tisch 1'])));
 assert.equal(res.filter(r=>r.status==='fulfilled').length,1);
 const confirmed=await rows("SELECT id FROM nea.bookings WHERE date='2099-12-05' AND status='confirmed'");assert.equal(confirmed.length,1);
 assert.equal((await rows("SELECT count(*)::int n FROM nea.occupancy WHERE date='2099-12-05'"))[0].n,5);
 assert.equal((await rows("SELECT count(*)::int n FROM nea.occupancy WHERE date='2099-12-05' AND booking_id<>$1",confirmed[0].id))[0].n,0);
});

test('repeated identical requests create one booking',{skip},async()=>{
 const p=payload({date:'2099-12-06'});
 const res=await Promise.all(Array.from({length:8},()=>api.POST(req(p))));
 assert.equal(res.filter(r=>r.status===201).length,1);assert.equal(res.filter(r=>r.status===200).length,7);
 assert.equal((await rows('SELECT count(*)::int n FROM nea.bookings WHERE id=$1',p.requestId))[0].n,1);
});

async function frozenConfirm(id,tables){ // starts a confirm, pauses after its read, returns {promise, release}
 let reached,release;const hit=new Promise(r=>reached=r),wait=new Promise(r=>release=r);
 gate={armed:true,reached,release:wait};const promise=store.updateBooking(id,'confirmed',tables).then(()=>({ok:true}),e=>({ok:false,error:e.message}));await hit;gate=null;
 return {promise,release};
}
test('edit versus confirm: a confirm based on the pre-edit booking is rejected',{skip},async()=>{
 const p=await create({date:'2099-12-07'});
 const f=await frozenConfirm(p.requestId,['Tisch 1']);
 const before=await revision(p.requestId);
 assert.equal((await admin.PATCH(staffReq({...p,action:'edit',id:p.requestId,expectedUpdated:before.updated,expectedStatus:before.status,date:'2099-12-08',time:'20:00'}))).status,200);
 f.release();const out=await f.promise;
 assert.equal(out.ok,false);assert.match(out.error,/geändert/);
 assert.equal(await occupancyOf(p.requestId),0);
 const [b]=await rows('SELECT status,date,time FROM nea.bookings WHERE id=$1',p.requestId);assert.deepEqual({...b},{status:'pending',date:'2099-12-08',time:'20:00'});
});
test('cancel versus confirm: a cancelled booking is never resurrected',{skip},async()=>{
 const p=await create({date:'2099-12-09'});
 const f=await frozenConfirm(p.requestId,['Tisch 1']);
 assert.equal((await api.PATCH(req(p,'PATCH'))).status,200);
 f.release();const out=await f.promise;
 assert.equal(out.ok,false);assert.equal(await statusOf(p.requestId),'cancelled');assert.equal(await occupancyOf(p.requestId),0);
});
test('randomised edit/confirm/cancel races never leave occupancy that disagrees with the booking',{skip},async()=>{
 for(let i=0;i<12;i++){
  const p=await create({date:'2099-12-10'});
  const before=await revision(p.requestId);
  await Promise.allSettled([store.updateBooking(p.requestId,'confirmed',['Tisch 2']),admin.PATCH(staffReq({...p,action:'edit',id:p.requestId,expectedUpdated:before.updated,expectedStatus:before.status,time:'20:00'})),api.PATCH(req(p,'PATCH'))]);
 }
 const bad=await rows(`SELECT b.id FROM nea.bookings b WHERE b.date='2099-12-10' AND (
   (b.status IN ('confirmed','arrived') AND (SELECT count(*) FROM nea.occupancy o WHERE o.booking_id=b.id AND o.date=b.date)<>5)
   OR (b.status NOT IN ('confirmed','arrived') AND EXISTS (SELECT 1 FROM nea.occupancy o WHERE o.booking_id=b.id)))`);
 assert.equal(bad.length,0);
 assert.equal((await rows('SELECT o.id FROM nea.occupancy o LEFT JOIN nea.bookings b ON b.id=o.booking_id WHERE b.id IS NULL')).length,0);
});

test('blocked day: closing is honoured and never races past new requests',{skip},async()=>{
 for(let i=0;i<8;i++){
  const date=`2099-11-${String(10+i).padStart(2,'0')}`,p=payload({date});
  const [pub,blk]=await Promise.all([api.POST(req(p)),admin.PATCH(staffReq({action:'block',date}))]);
  assert.equal(blk.status,200);assert.ok([201,409].includes(pub.status));
  assert.equal((await rows('SELECT count(*)::int n FROM nea.bookings WHERE id=$1',p.requestId))[0].n,pub.status===201?1:0);
  assert.equal((await api.POST(req(payload({date})))).status,409);        // after the block, always refused
  await admin.PATCH(staffReq({action:'unblock',date}));assert.equal((await api.POST(req(payload({date})))).status,201);
 }
});

test('legacy export import: old token links, occupancy and legacy rows survive; re-import is idempotent; conflicts abort',{skip},async()=>{
 const legacyToken=token(),hash=crypto.createHash('sha256').update(legacyToken).digest('hex');
 const id=crypto.randomUUID(),other=crypto.randomUUID();
 const row={id,token_hash:hash,name:'Alt Gast',email:'alt@example.com',phone:'+49 5555555',date:'2099-10-01',time:'19:00',guests:4,notes:'Fenster',status:'confirmed',table_ids:'["Tisch 1"]',duration:75,created:'2026-11-01T10:00:00.000Z',updated:'2026-11-01T10:05:00.000Z'};
 const data={bookings:[row,{...row,id:other,token_hash:'f'.repeat(64),status:'pending',table_ids:'[]',time:'20:00'}],
  occupancy:Array.from({length:5},(_,i)=>({id:`2099-10-01:Tisch 1:${1140+i*15}`,booking_id:id,table_id:'Tisch 1',date:'2099-10-01',minute:1140+i*15})),
  blocked_days:[{id:'nea-1889:2099-10-02',owner:'nea-1889',date:'2099-10-02'}],
  reservations:[{id:'legacy-1',owner:'nea-1889',name:'Erst',email:'e@example.com',phone:'+49 1111111',date:'2026-10-01',time:'12:00',guests:2,notes:'',status:'confirmed',created:'2026-10-01T10:00:00.000Z'}]};
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'nea-import-')),file=path.join(dir,'export.json');fs.writeFileSync(file,JSON.stringify(data));
 const run=()=>spawnSync(process.execPath,['scripts/import-sites.mjs',file],{encoding:'utf8',env:{...process.env,MIGRATION_DATABASE_URL:db.adminUrl,NEA_DATABASE_SCHEMA:'nea'}});
 try{
  const first=run();assert.equal(first.status,0,first.stderr);assert.match(first.stdout,/bookings: 2/);
  const again=run();assert.equal(again.status,0,again.stderr);
  const counts=(await rows("SELECT (SELECT count(*)::int FROM nea.bookings WHERE date IN ('2099-10-01')) b,(SELECT count(*)::int FROM nea.occupancy WHERE booking_id=$1) o,(SELECT count(*)::int FROM nea.blocked_days WHERE date='2099-10-02') d,(SELECT count(*)::int FROM nea.reservations) r",id))[0];
  assert.deepEqual({...counts},{b:2,o:5,d:1,r:1});
  const status=await(await api.GET(req({token:legacyToken},'GET'))).json();assert.deepEqual({status:status.status,time:status.time,guests:status.guests},{status:'confirmed',time:'19:00',guests:4});
  assert.equal((await api.PATCH(req({token:legacyToken},'PATCH'))).status,200);                // old link can still cancel
  assert.equal(await occupancyOf(id),0);
  // The imported confirmed booking blocks overlapping confirmations on the same table only while confirmed.
  fs.writeFileSync(file,JSON.stringify({...data,bookings:[{...row,name:'Anderer Name'},data.bookings[1]]}));
  const conflict=run();assert.notEqual(conflict.status,0);assert.match(conflict.stderr,/Conflicting existing record/);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

// ---- Pending quota (#13 / A2a): max 5 pending per email per rolling 24 h, atomic under concurrency ----
const quotaMail=()=>'q'+Math.random().toString(36).slice(2)+'@Example.com';
const pendingCount=async email=>(await rows("SELECT count(*)::int n FROM nea.bookings WHERE lower(email)=lower($1) AND status='pending'",email))[0].n;
test('quota: 12 simultaneous requests with one email store at most 5 pending bookings',{skip},async()=>{
 const email=quotaMail(),ps=Array.from({length:12},()=>payload({email,date:'2099-12-10'}));
 const res=await Promise.all(ps.map(p=>api.POST(req(p))));
 assert.equal(res.filter(r=>r.status===201).length,5);
 const rejected=res.filter(r=>r.status!==201);assert.equal(rejected.length,7);
 for(const r of rejected){assert.equal(r.status,429);const b=await r.json();assert.equal(b.code,'too_many_pending');assert.deepEqual(Object.keys(b).sort(),['code','error']);
  const text=JSON.stringify(b);assert.ok(!text.includes(email)&&!ps.some(p=>text.includes(p.token)))}
 assert.equal(await pendingCount(email),5);
 for(const p of ps.filter((_,i)=>res[i].status===429))assert.equal((await rows('SELECT count(*)::int n FROM nea.bookings WHERE id=$1',p.requestId))[0].n,0);
});
test('quota: repeated rounds of concurrency never exceed 5, case variations share one quota, other emails are independent',{skip},async()=>{
 const base=quotaMail().toLowerCase(),variants=[base,base.toUpperCase(),base.replace(/^./,c=>c.toUpperCase()),base.replace(/@/,'@').toUpperCase().toLowerCase()];
 const res=await Promise.all(Array.from({length:12},(_,i)=>api.POST(req(payload({email:variants[i%4],date:'2099-12-11'})))));
 assert.equal(res.filter(r=>r.status===201).length,5);assert.equal(res.filter(r=>r.status===429).length,7);assert.equal(await pendingCount(base),5);
 const other=quotaMail();assert.equal((await api.POST(req(payload({email:other,date:'2099-12-11'})))).status,201);
 assert.equal((await api.POST(req(payload({email:base.toUpperCase(),date:'2099-12-12'})))).status,429);
 // stored guest data is not rewritten: the address is kept exactly as submitted
 assert.ok((await rows("SELECT 1 FROM nea.bookings WHERE email=$1",base.toUpperCase())).length>0);
});
test('quota: a legitimate retry of an accepted request still succeeds when the quota is full; conflicting token is rejected',{skip},async()=>{
 const email=quotaMail(),ps=[];for(let i=0;i<5;i++){const p=payload({email,date:'2099-12-13'});ps.push(p);assert.equal((await api.POST(req(p))).status,201)}
 assert.equal((await api.POST(req(payload({email,date:'2099-12-13'})))).status,429);
 assert.equal((await api.POST(req(ps[0]))).status,200);
 const retries=await Promise.all(ps.flatMap(p=>[api.POST(req(p)),api.POST(req(p))]));assert.ok(retries.every(r=>r.status===200));
 assert.equal((await api.POST(req({...ps[1],token:'b'.repeat(64)}))).status,409);
 assert.equal(await pendingCount(email),5);
});
test('quota: concurrent retries of one request racing a full quota never 429 the original',{skip},async()=>{
 const email=quotaMail(),first=Array.from({length:4},()=>payload({email,date:'2099-12-14'}));for(const p of first)await api.POST(req(p));
 const last=payload({email,date:'2099-12-14'}),res=await Promise.all(Array.from({length:6},()=>api.POST(req(last))));
 assert.equal(res.filter(r=>r.status===201).length,1);assert.equal(res.filter(r=>r.status===200).length,5);assert.equal(await pendingCount(email),5);
});
test('quota: the 24 h window rolls, cancellation frees a slot, confirmed and old requests do not count',{skip},async()=>{
 const email=quotaMail(),ps=[];for(let i=0;i<5;i++){const p=payload({email,date:'2099-12-15'});ps.push(p);await api.POST(req(p))}
 assert.equal((await api.POST(req(payload({email,date:'2099-12-15'})))).status,429);
 // cancel one pending request via its token -> one slot is free again
 assert.equal((await api.PATCH(new Request('https://test.example/api/booking',{method:'PATCH',headers:{Origin:'https://test.example','X-Booking-Token':ps[0].token}}))).status,200);
 assert.equal(await pendingCount(email),4);assert.equal((await api.POST(req(payload({email,date:'2099-12-15'})))).status,201);
 assert.equal((await api.POST(req(payload({email,date:'2099-12-15'})))).status,429);
 // age one request to just outside / just inside the window
 const at=ms=>new Date(Date.now()-ms).toISOString();
 await rows("UPDATE nea.bookings SET created=$1 WHERE id=$2",at(86400000+5000),ps[1].requestId);
 assert.equal((await api.POST(req(payload({email,date:'2099-12-15'})))).status,201);
 await rows("UPDATE nea.bookings SET created=$1 WHERE id=$2",at(86400000-60000),ps[2].requestId);
 assert.equal((await api.POST(req(payload({email,date:'2099-12-15'})))).status,429);
 // a confirmed booking no longer counts as pending
 await store.updateBooking(ps[3].requestId,'confirmed',['Tisch 1']);
 assert.equal((await api.POST(req(payload({email,date:'2099-12-15'})))).status,201);
});
test('quota: blocked days stay closed (day_closed beats quota) and concurrent quota+block never admits a booking on a blocked day',{skip},async()=>{
 const email=quotaMail(),date='2099-12-16';await admin.PATCH(staffReq({action:'block',date}));
 const res=await Promise.all(Array.from({length:8},()=>api.POST(req(payload({email,date})))));
 for(const r of res){assert.equal(r.status,409);assert.equal((await r.json()).code,'day_closed')}
 assert.equal((await rows('SELECT count(*)::int n FROM nea.bookings WHERE date=$1',date))[0].n,0);
 await admin.PATCH(staffReq({action:'unblock',date}));assert.equal((await api.POST(req(payload({email,date})))).status,201);
});
test('quota: concurrent requests, confirmations and cancellations keep occupancy consistent',{skip},async()=>{
 const email=quotaMail(),date='2099-12-17',ps=Array.from({length:8},()=>payload({email,date,time:'19:00'}));
 const made=(await Promise.all(ps.map(p=>api.POST(req(p))))).map((r,i)=>r.status===201?ps[i]:null).filter(Boolean);assert.equal(made.length,5);
 const cancel=p=>api.PATCH(new Request('https://test.example/api/booking',{method:'PATCH',headers:{Origin:'https://test.example','X-Booking-Token':p.token}}));
 const out=await Promise.allSettled([...made.map(p=>store.updateBooking(p.requestId,'confirmed',['Tisch 1'])),cancel(made[0]),cancel(made[1])]);
 void out;
 const occ=await rows("SELECT o.booking_id,b.status FROM nea.occupancy o JOIN nea.bookings b ON b.id=o.booking_id WHERE o.date=$1",date);
 assert.ok(occ.every(o=>o.status==='confirmed'));assert.equal(new Set(occ.map(o=>o.booking_id)).size<=1,true);
 assert.equal((await rows("SELECT count(*)::int n FROM nea.bookings WHERE date=$1 AND status='confirmed'",date))[0].n,occ.length?1:0);
});

test('email events on PostgreSQL: 8 concurrent notifications send once; failed events re-claim; runtime role cannot delete',{skip},async()=>{
 const email=support.load('lib/email.ts',{'./staff':staffModule}),realFetch=globalThis.fetch;
 let calls=0,fail=false;process.env.RESEND_API_KEY='re_test';process.env.EMAIL_FROM='NEA <a@example.test>';
 globalThis.fetch=async()=>{calls++;await new Promise(r=>setTimeout(r,20));return fail?new Response('{}',{status:500}):new Response('{}',{status:200})};
 try{
  const b={id:crypto.randomUUID(),name:'Gast',email:'x@example.com',date:'2099-11-02',time:'19:00',guests:2};
  const res=await Promise.all(Array.from({length:8},()=>email.notifyReservation('confirmed',b)));
  assert.equal(calls,1);assert.equal(res.filter(r=>r==='sent').length,1);
  assert.equal((await rows("SELECT status FROM nea.email_events WHERE id=$1",b.id+':confirmed'))[0].status,'sent');
  fail=true;assert.equal(await email.notifyReservation('cancelled',b),'failed');assert.equal(calls,2);
  fail=false;assert.equal(await email.notifyReservation('cancelled',b),'sent');assert.equal(await email.notifyReservation('cancelled',b),'skipped');assert.equal(calls,3);
  const rt=postgres(db.runtimeUrl,{max:1,onnotice:()=>{}});
  try{await assert.rejects(()=>rt.unsafe('DELETE FROM nea.email_events'),/permission denied/)}finally{await rt.end()}
 }finally{globalThis.fetch=realFetch;delete process.env.RESEND_API_KEY;delete process.env.EMAIL_FROM}
});


test('stale staff browser snapshot cannot release confirmed occupancy or overwrite a newer status',{skip},async()=>{
 const p=await create({date:'2099-12-20'});
 const before=await revision(p.requestId);
 assert.equal((await admin.PATCH(staffReq({id:p.requestId,status:'confirmed',tableIds:['Tisch 1']}))).status,400);
 assert.equal((await admin.PATCH(staffReq({...p,action:'edit',id:p.requestId,time:'20:00'}))).status,400);
 await store.updateBooking(p.requestId,'confirmed',['Tisch 1']);
 assert.equal((await admin.PATCH(staffReq({...p,action:'edit',id:p.requestId,time:'20:00',expectedUpdated:before.updated,expectedStatus:before.status}))).status,409);
 assert.equal((await admin.PATCH(staffReq({id:p.requestId,status:'cancelled',tableIds:[],expectedUpdated:before.updated,expectedStatus:before.status}))).status,409);
 assert.equal(await statusOf(p.requestId),'confirmed');
 assert.equal(await occupancyOf(p.requestId),5);
 const current=await revision(p.requestId);
 assert.equal((await admin.PATCH(staffReq({id:p.requestId,status:'arrived',tableIds:['Tisch 1'],expectedUpdated:current.updated,expectedStatus:current.status}))).status,200);
 assert.equal(await statusOf(p.requestId),'arrived');
 assert.equal(await occupancyOf(p.requestId),5);
});
test('staff browser snapshots also reject stale edits with unchanged booking status',{skip},async()=>{
 const p=await create({date:'2099-12-21'});
 const before=await revision(p.requestId);
 await rows("UPDATE nea.bookings SET notes='Andere Änderung',updated='2099-01-01T00:00:00.001Z' WHERE id=$1",p.requestId);
 const response=await admin.PATCH(staffReq({...p,action:'edit',id:p.requestId,notes:'Veralteter Text',expectedUpdated:before.updated,expectedStatus:before.status}));
 assert.equal(response.status,409);
 const [current]=await rows('SELECT notes,status,updated FROM nea.bookings WHERE id=$1',p.requestId);
 assert.equal(current.notes,'Andere Änderung');
 assert.equal(current.status,'pending');
 assert.equal(current.updated,'2099-01-01T00:00:00.001Z');
});
test('guest cancellation before a staff confirmation rejects the stale dashboard action',{skip},async()=>{
 const p=await create({date:'2099-12-22'});
 const before=await revision(p.requestId);
 assert.equal((await api.PATCH(req(p,'PATCH'))).status,200);
 assert.equal((await admin.PATCH(staffReq({id:p.requestId,status:'confirmed',tableIds:['Tisch 3'],expectedUpdated:before.updated,expectedStatus:before.status}))).status,409);
 assert.equal(await statusOf(p.requestId),'cancelled');
 assert.equal(await occupancyOf(p.requestId),0);
});


test('staff GET uses an indexed day filter and excludes private data from other dates',{skip},async()=>{
 const first=await create({date:'2099-12-23',name:'Listed Day Guest',email:'listed@example.test'});
 const second=await create({date:'2099-12-24',name:'Unrelated Day Guest',email:'other-day@example.test'});
 const list=async date=>admin.GET(new Request('https://test.example/api/reservations'+(date===null?'':'?date='+date)));
 for(const invalid of [null,'2099-02-30','2099-12-23&date=2099-12-24']){
  const denied=await list(invalid);assert.equal(denied.status,400);assert.equal(denied.headers.get('Cache-Control'),'no-store');
 }
 const response=await list('2099-12-23');assert.equal(response.status,200);
 const body=await response.json();
 assert.deepEqual(body.reservations.map(b=>b.id),[first.requestId]);
 assert.equal(body.reservations[0].name,'Listed Day Guest');
 assert.doesNotMatch(JSON.stringify(body),/Unrelated Day Guest|other-day@example\.test/);
 const next=await(await list('2099-12-24')).json();
 assert.deepEqual(next.reservations.map(b=>b.id),[second.requestId]);
});
