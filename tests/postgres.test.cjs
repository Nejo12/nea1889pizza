const {test}=require('node:test'),assert=require('node:assert/strict'),ts=require('typescript'),fs=require('node:fs');
function load(path,imports={}){const m={exports:{}};new Function('require','module','exports',ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText)(n=>n in imports?imports[n]:require(n),m,m.exports);return m.exports;}
test('PostgreSQL adapter: persistence, atomic conflicts, cancellation, parameter escaping',async()=>{
 const {PGlite}=await import('@electric-sql/pglite');const db=new PGlite();await db.exec('CREATE SCHEMA nea_test; SET search_path TO nea_test;');await db.exec(fs.readFileSync('database/schema.sql','utf8'));await db.exec('SET search_path TO public;');
 const executor=engine=>{const sql=()=>Promise.resolve([]);sql.unsafe=async(q,args)=>{const r=await engine.query(q,args);r.rows.count=r.affectedRows;return r.rows;};return sql;};
 const driver=executor(db);driver.begin=fn=>db.transaction(tx=>fn(executor(tx)));
 process.env.DATABASE_URL='test://unused';process.env.NEA_DATABASE_SCHEMA='nea_test';
 const adapter=load('lib/database.ts',{postgres:(_url,options)=>{assert.equal(options.connection?.search_path,undefined);return driver;}});
 assert.equal(adapter.parameterize("SELECT '?' AS x, ? AS y, 'don''t ?' AS z"),"SELECT '?' AS x, $1 AS y, 'don''t ?' AS z");
 const rules=load('lib/reservation-rules.ts'),staff={database:adapter.database,isStaff:async()=>true};
 const store=load('lib/booking-store.ts',{'./staff':staff,'./reservation-rules':rules});
 const api=load('app/api/booking/route.ts',{'@/lib/staff':staff,'@/lib/booking-store':store,'@/lib/reservation-rules':rules});
 const payload=()=>({requestId:crypto.randomUUID(),token:crypto.randomUUID().replaceAll('-','')+crypto.randomUUID().replaceAll('-',''),name:"O' Test",email:'test@example.com',phone:'+491234567',date:'2099-11-02',time:'19:00',guests:4,notes:'',accepted:true,website:''});
 const req=(p,method='POST')=>new Request('https://test.example/api/booking',{method,headers:{'Content-Type':'application/json','X-Booking-Token':p.token},...(method==='POST'?{body:JSON.stringify(p)}:{})});
 const a=payload(),b=payload();assert.equal((await api.POST(req(a))).status,201);assert.equal((await api.POST(req(a))).status,200);assert.equal((await api.POST(req(b))).status,201);
 await store.updateBooking(a.requestId,'confirmed',['Tisch 1']);await assert.rejects(()=>store.updateBooking(b.requestId,'confirmed',['Tisch 1']));
 assert.equal((await db.query('SELECT count(*)::int AS n FROM nea_test.occupancy')).rows[0].n,5);
 assert.equal((await(await api.GET(req(a,'GET'))).json()).status,'confirmed');
 assert.equal((await api.PATCH(req(a,'PATCH'))).status,200);
 await store.updateBooking(b.requestId,'confirmed',['Tisch 1']);
 assert.equal((await db.query('SELECT count(*)::int AS n FROM nea_test.bookings')).rows[0].n,2);
 await db.close();
});
