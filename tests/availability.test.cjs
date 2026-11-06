const {test,before,after}=require('node:test');const assert=require('node:assert/strict');const ts=require('typescript');const fs=require('node:fs');const crypto=require('node:crypto');const {DatabaseSync}=require('node:sqlite');
// Issue #13: read-only, privacy-safe, advisory availability. Confirmation stays the only authority.
function load(path,overrides={}){const m={exports:{}};const js=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;new Function('require','module','exports',js)(name=>name in overrides?overrides[name]:require(name),m,m.exports);return m.exports;}
const rules=load('lib/reservation-rules.ts');
const DAY='2099-11-02'; // a Monday, open
const SAT=(()=>{for(let d=1;d<=7;d++){const s='2099-11-0'+d;if(new Date(s+'T12:00:00Z').getUTCDay()===6)return s}})();
function wire(db){const staff={database:()=>db,isStaff:async()=>false};const store=load('lib/booking-store.ts',{'./staff':staff,'./reservation-rules':rules});const imports={'@/lib/staff':staff,'@/lib/booking-store':store,'@/lib/reservation-rules':rules};
 return{store,booking:load('app/api/booking/route.ts',imports),avail:load('app/api/availability/route.ts',imports)}}
function sqliteDb(){const sql=new DatabaseSync(':memory:');for(const f of fs.readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())sql.exec(fs.readFileSync('drizzle/'+f,'utf8'));
 const prepare=query=>{let args=[];const s={bind(...v){args=v;return s},async first(){return sql.prepare(query).get(...args)||null},async all(){return{results:sql.prepare(query).all(...args)}},async run(){const r=sql.prepare(query).run(...args);return{meta:{changes:Number(r.changes)}}}};return s};
 return{sql,db:{prepare,async batch(c){sql.exec('BEGIN');try{const r=[];for(const x of c)r.push(await x.run());sql.exec('COMMIT');return r}catch(e){sql.exec('ROLLBACK');throw e}}}}}
const token=()=>(crypto.randomUUID()+crypto.randomUUID()).replaceAll('-','');
const payload=(p={})=>({requestId:crypto.randomUUID(),token:token(),name:'Test Gast',email:'g'+Math.random().toString(36).slice(2)+'@example.com',phone:'+49 12345678',date:DAY,time:'19:00',guests:1,notes:'',website:'',accepted:true,...p});
const post=b=>new Request('https://t.example/api/booking',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});
const get=(q)=>new Request('https://t.example/api/availability?'+new URLSearchParams(q));
const slots=async(w,q)=>{const r=await w.avail.GET(get(q));assert.equal(r.status,200);return r.json()};
const statusOf=(body,time)=>body.slots.find(s=>s.time===time).status;
// Confirm one 1-guest booking per listed table at `time`, so those tables are occupied.
async function occupy(w,tables,time='19:00',date=DAY){for(const t of tables){const p=payload({time,date});assert.equal((await w.booking.POST(post(p))).status,201);await w.store.updateBooking(p.requestId,'confirmed',[t])}}
const allTables=rules.restaurantTables.map(t=>t.name);

test('open day: every server-defined slot is available, response is advisory and minimal',async()=>{const {db}=sqliteDb(),w=wire(db);
 const body=await slots(w,{date:DAY,guests:'4'});
 assert.deepEqual(Object.keys(body).sort(),['advisory','date','guests','slots']);assert.equal(body.advisory,true);assert.equal(body.guests,4);assert.equal(body.date,DAY);
 assert.deepEqual(body.slots.map(s=>s.time),rules.slotsForDate(DAY));assert.ok(body.slots.length>10);
 for(const s of body.slots){assert.deepEqual(Object.keys(s).sort(),['status','time']);assert.equal(s.status,'available')}
 const sat=await slots(w,{date:SAT,guests:'2'});assert.equal(sat.slots[0].time,'15:30');assert.equal(sat.slots.at(-1).time,'21:30')});

test('blocked day reports every slot closed; other days unaffected',async()=>{const {db,sql}=sqliteDb(),w=wire(db);
 sql.prepare("insert into blocked_days (id,owner,date) values ('b','nea-1889',?)").run(DAY);
 assert.ok((await slots(w,{date:DAY,guests:'2'})).slots.every(s=>s.status==='closed'));
 assert.ok((await slots(w,{date:'2099-11-03',guests:'2'})).slots.every(s=>s.status==='available'))});

test('past dates and already-passed times today are never offered',async()=>{const {db}=sqliteDb(),w=wire(db);
 assert.ok((await slots(w,{date:'2000-01-03',guests:'2'})).slots.every(s=>s.status==='past'));
 const now=new Date('2099-11-02T16:00:00Z'); // 17:00 Europe/Berlin (CET)
 const out=await w.store.availabilityFor(DAY,2,now);
 assert.equal(out.find(s=>s.time==='17:00').status,'past');assert.equal(out.find(s=>s.time==='17:30').status,'available');assert.equal(out.find(s=>s.time==='12:00').status,'past')});

test('occupied tables remove capacity for the full 75-minute window only',async()=>{const {db}=sqliteDb(),w=wire(db);
 await occupy(w,allTables); // every table taken at 19:00 (occupies 19:00 up to 20:15)
 const b=await slots(w,{date:DAY,guests:'1'});
 assert.equal(statusOf(b,'19:00'),'full');assert.equal(statusOf(b,'18:00'),'full','arrival 18:00 would overlap 19:00');assert.equal(statusOf(b,'20:00'),'full');
 assert.equal(statusOf(b,'17:30'),'available');assert.equal(statusOf(b,'20:30'),'available');
 assert.equal(statusOf(await slots(w,{date:'2099-11-03',guests:'1'}),'19:00'),'available','other dates unaffected')});

test('party size is judged against the seats of the tables still free (1–12)',async()=>{const {db}=sqliteDb(),w=wire(db);
 await occupy(w,allTables.filter(t=>t!=='Tisch 1')); // only a 4-seat table is free
 assert.equal(statusOf(await slots(w,{date:DAY,guests:'4'}),'19:00'),'available');
 assert.equal(statusOf(await slots(w,{date:DAY,guests:'5'}),'19:00'),'full');
 assert.equal(statusOf(await slots(w,{date:DAY,guests:'12'}),'19:00'),'full');
 const fresh=wire(sqliteDb().db);for(const n of [1,12])assert.equal(statusOf(await slots(fresh,{date:DAY,guests:String(n)}),'19:00'),'available')});

test('invalid input is rejected with structured 400 and touches nothing',async()=>{const {db,sql}=sqliteDb(),w=wire(db);
 for(const q of [{},{date:DAY},{guests:'2'},{date:'2099-02-30',guests:'2'},{date:'nonsense',guests:'2'},{date:DAY,guests:'0'},{date:DAY,guests:'13'},{date:DAY,guests:'4.5'},{date:DAY,guests:'abc'},{date:DAY,guests:'-1'},{date:DAY+'x',guests:'2'}]){
  const r=await w.avail.GET(get(q));assert.equal(r.status,400,JSON.stringify(q));assert.equal((await r.json()).code,'invalid_request')}
 assert.equal(sql.prepare('select count(*) n from bookings').get().n,0)});

test('only GET exists, the response is uncached and database failure is a structured 503',async()=>{const {db}=sqliteDb(),w=wire(db);
 assert.deepEqual(Object.keys(w.avail).filter(k=>/^[A-Z]+$/.test(k)),['GET']);
 assert.equal((await w.avail.GET(get({date:DAY,guests:'2'}))).headers.get('Cache-Control'),'no-store');
 const broken=wire({prepare(){throw Error('down')},async batch(){throw Error('down')}});
 const r=await broken.avail.GET(get({date:DAY,guests:'2'}));assert.equal(r.status,503);assert.equal((await r.json()).code,'unavailable')});

test('no reservation or customer data leaks, and reading changes nothing',async()=>{const {db,sql}=sqliteDb(),w=wire(db);
 const p=payload({name:'Geheim Gast',guests:2});assert.equal((await w.booking.POST(post(p))).status,201);await w.store.updateBooking(p.requestId,'confirmed',['Tisch 3']);
 const count=()=>['bookings','occupancy','blocked_days'].map(t=>sql.prepare(`select count(*) n from ${t}`).get().n).join();const before=count();
 const text=await(await w.avail.GET(get({date:DAY,guests:'2'}))).text();
 for(const bad of ['Geheim','example.com','12345678',p.requestId,p.token,'Tisch','Terrasse','Innenbereich','table','seats'])assert.ok(!text.includes(bad),'leaked '+bad);
 assert.equal(count(),before)});

test('pending requests hold nothing: availability reflects confirmed occupancy only',async()=>{const {db}=sqliteDb(),w=wire(db);
 for(const t of allTables)assert.equal((await w.booking.POST(post(payload()))).status,201); // pending only
 assert.equal(statusOf(await slots(w,{date:DAY,guests:'12'}),'19:00'),'available')});

test('availability is advisory: a stale "available" slot is still rejected at confirmation',async()=>{const {db,sql}=sqliteDb(),w=wire(db);
 await occupy(w,allTables.filter(t=>t!=='Tisch 1'));
 const a=payload({guests:4}),b=payload({guests:4});await w.booking.POST(post(a));await w.booking.POST(post(b));
 assert.equal(statusOf(await slots(w,{date:DAY,guests:'4'}),'19:00'),'available'); // both guests saw this
 await w.store.updateBooking(a.requestId,'confirmed',['Tisch 1']);
 await assert.rejects(()=>w.store.updateBooking(b.requestId,'confirmed',['Tisch 1']));
 assert.equal(sql.prepare('select status from bookings where id=?').get(b.requestId).status,'pending');
 assert.equal(statusOf(await slots(w,{date:DAY,guests:'4'}),'19:00'),'full')});

test('availability uses the confirmation rules, not a copy: no business constants in the endpoint',()=>{
 const src=fs.readFileSync('app/api/availability/route.ts','utf8');
 assert.ok(!/restaurantTables|maxTableMinutes|openingHours|11:30|21:30/.test(src));
 assert.match(src,/availabilityFor/);
 const store=fs.readFileSync('lib/booking-store.ts','utf8');assert.match(store,/slotKeys\(date,time,\[/);assert.ok(!/INSERT|UPDATE|DELETE/.test(store.slice(store.indexOf('export async function availabilityFor'),store.indexOf('export async function updateBooking'))))});

// Real PostgreSQL: availability reads during a genuine confirmation race never break integrity.
const support=require('./support/realpg.cjs'),postgres=require('postgres');
const skip=support.available()?false:'No PostgreSQL available.';
let srv,pg,pw;
before(async()=>{if(skip)return;srv=await support.server();pg=await support.createDatabase(postgres,srv.adminUrl);process.env.DATABASE_URL=pg.runtimeUrl;process.env.NEA_DATABASE_SCHEMA='nea';
 const adapter=support.load('lib/database.ts',{postgres});const staff={database:()=>adapter.database(),isStaff:async()=>false};const r=support.load('lib/reservation-rules.ts');
 const store=support.load('lib/booking-store.ts',{'./staff':staff,'./reservation-rules':r});const imports={'@/lib/staff':staff,'@/lib/booking-store':store,'@/lib/reservation-rules':r};
 pw={store,booking:support.load('app/api/booking/route.ts',imports),avail:support.load('app/api/availability/route.ts',imports)}});
after(async()=>{if(skip)return;await pg.drop();srv.stop()});
test('PostgreSQL: concurrent confirms plus availability reads — one winner, no partial occupancy, slot then full',{skip},async()=>{
 await occupy(pw,allTables.filter(t=>t!=='Tisch 1'),'19:00','2099-12-05');
 const mk=async()=>{const p=payload({date:'2099-12-05',guests:4});assert.equal((await pw.booking.POST(post(p))).status,201);return p};
 const ps=await Promise.all([mk(),mk(),mk(),mk()]);
 const q={date:'2099-12-05',guests:'4'};
 assert.equal(statusOf(await slots(pw,q),'19:00'),'available');
 const [,...reads]=await Promise.all([Promise.allSettled(ps.map(p=>pw.store.updateBooking(p.requestId,'confirmed',['Tisch 1']))),...Array.from({length:6},()=>slots(pw,q))]);
 for(const r of reads)assert.ok(['available','full'].includes(statusOf(r,'19:00')));
 const done=(await pg.admin.unsafe("select id from nea.bookings where date='2099-12-05' and status='confirmed' and table_ids='[\"Tisch 1\"]' and id=any($1)",[ps.map(p=>p.requestId)]));assert.equal(done.length,1);
 assert.equal((await pg.admin.unsafe("select count(*)::int n from nea.occupancy where date='2099-12-05' and table_id='Tisch 1'"))[0].n,5);
 assert.equal(statusOf(await slots(pw,q),'19:00'),'full');
 assert.equal(statusOf(await slots(pw,{date:'2099-12-05',guests:'2'}),'19:00'),'full')});
