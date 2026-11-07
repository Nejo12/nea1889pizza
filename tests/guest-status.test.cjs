const {test}=require('node:test');const assert=require('node:assert/strict');const ts=require('typescript');const fs=require('node:fs');const {DatabaseSync}=require('node:sqlite');
// Guest reservation status: structured error codes, token handling, privacy, cancellation and localization.
function load(path,overrides={}){const m={exports:{}};const js=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;new Function('require','module','exports',js)(name=>name in overrides?overrides[name]:require(name),m,m.exports);return m.exports;}
const rules=load('lib/reservation-rules.ts');process.env.AUTHORIZED_ORIGINS='https://example.test';const security=load('lib/request-security.ts',{'./trusted-origins':load('lib/trusted-origins.ts')});
const guest=load('lib/guest-status.ts',{'./reservation-rules':rules});
const dict=load('lib/site/i18n-dict.ts').DICT;
const LANGS=['de','en','it','fr','es','pt'];
function fixture({broken=false}={}){const sql=new DatabaseSync(':memory:');for(const f of fs.readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())sql.exec(fs.readFileSync('drizzle/'+f,'utf8'));
 function prepare(query){let args=[];const s={bind(...v){args=v;return s},async first(){if(broken)throw Error('db down');return sql.prepare(query).get(...args)||null},async all(){return{results:sql.prepare(query).all(...args)}},async run(){const r=sql.prepare(query).run(...args);return{meta:{changes:Number(r.changes)}}}};return s}
 const db={prepare,async batch(c){if(broken)throw Error('db down');sql.exec('BEGIN');try{const r=[];for(const x of c)r.push(await x.run());sql.exec('COMMIT');return r}catch(e){sql.exec('ROLLBACK');throw e}}};
 const staffModule={database:()=>db,isStaff:async()=>false};const store=load('lib/booking-store.ts',{'./staff':staffModule,'./reservation-rules':rules,'./email':require('./support/no-email.cjs')});
 const api=load('app/api/booking/route.ts',{'@/lib/staff':staffModule,'@/lib/booking-store':store,'@/lib/email':require('./support/no-email.cjs'),'@/lib/reservation-rules':rules,'@/lib/request-security':security});return{api,sql}}
const req=(method,token,body)=>new Request('https://example.test/api/booking',{method,headers:{'Content-Type':'application/json',Origin:'https://example.test',...(token?{'X-Booking-Token':token}:{})},...(body?{body:JSON.stringify(body)}:{})});
const payload=(p={})=>({requestId:crypto.randomUUID(),token:(crypto.randomUUID()+crypto.randomUUID()).replaceAll('-',''),name:'Test Gast',email:'test@example.com',phone:'+49 12345678',date:'2099-11-02',time:'19:00',guests:4,notes:'',website:'',accepted:true,...p});
const expectCode=async(res,status,code)=>{assert.equal(res.status,status);const b=await res.json();assert.equal(b.code,code);assert.equal(b.error,guest.BOOKING_ERRORS[code].message,'German message kept for compatibility');return b};

test('missing, malformed and unknown tokens are indistinguishable not_found responses',async()=>{const f=fixture();
 await expectCode(await f.api.GET(req('GET')),404,'not_found');
 await expectCode(await f.api.GET(req('GET','short')),404,'not_found');
 await expectCode(await f.api.GET(req('GET','a'.repeat(64))),404,'not_found');
 await expectCode(await f.api.PATCH(req('PATCH')),404,'not_found');
 await expectCode(await f.api.PATCH(req('PATCH','b'.repeat(64))),404,'not_found')});

test('valid token returns only the public booking fields, never contact data or token hash',async()=>{const f=fixture(),p=payload();await f.api.POST(req('POST',null,p));
 const res=await f.api.GET(req('GET',p.token));assert.equal(res.status,200);assert.equal(res.headers.get('Cache-Control'),'no-store');
 const b=await res.json();assert.deepEqual(Object.keys(b).sort(),['date','duration','guests','id','name','status','time','updated']);assert.equal(b.status,'pending');
 const text=JSON.stringify(b);assert.ok(!text.includes(p.email)&&!text.includes('12345678')&&!text.includes(p.token))});

test('cancellation works with the token, is idempotent, and is rejected for settled bookings',async()=>{const f=fixture(),p=payload(),other=payload({email:'o@example.com'});await f.api.POST(req('POST',null,p));await f.api.POST(req('POST',null,other));
 const first=await f.api.PATCH(req('PATCH',p.token));assert.equal(first.status,200);assert.equal((await first.json()).status,'cancelled');
 assert.equal((await f.api.PATCH(req('PATCH',p.token))).status,200);
 assert.equal(f.sql.prepare('select status from bookings where id=?').get(other.requestId).status,'pending','other bookings untouched');
 f.sql.prepare("update bookings set status='arrived' where id=?").run(other.requestId);
 await expectCode(await f.api.PATCH(req('PATCH',other.token)),409,'cannot_modify');
 assert.equal(f.sql.prepare('select status from bookings where id=?').get(other.requestId).status,'arrived')});

test('database failures map to structured 503 codes',async()=>{const f=fixture({broken:true});
 await expectCode(await f.api.GET(req('GET','a'.repeat(64))),503,'unavailable');
 await expectCode(await f.api.PATCH(req('PATCH','a'.repeat(64))),503,'cancel_failed');
 await expectCode(await f.api.POST(req('POST',null,payload())),503,'save_failed')});

test('booking submission errors carry structured codes',async()=>{const f=fixture(),p=payload();
 await expectCode(await f.api.POST(req('POST',null,{...p,website:'x'})),400,'invalid_request');
 await expectCode(await f.api.POST(req('POST',null,{...p,token:'zz'})),400,'reopen_form');
 await expectCode(await f.api.POST(req('POST',null,{...p,accepted:false})),400,'invalid_details');
 await f.api.POST(req('POST',null,p));
 await expectCode(await f.api.POST(req('POST',null,{...p,token:'a'.repeat(64)})),409,'reopen_form');
 f.sql.prepare("insert into blocked_days (id,owner,date) values ('x','nea-1889','2099-12-01')").run();
 await expectCode(await f.api.POST(req('POST',null,payload({date:'2099-12-01',email:'c@example.com'}))),409,'day_closed');
 for(let i=0;i<4;i++)await f.api.POST(req('POST',null,payload()));
 await expectCode(await f.api.POST(req('POST',null,payload())),429,'too_many_pending');
 const big=new Request('https://example.test/api/booking',{method:'POST',headers:{'content-type':'application/json',origin:'https://example.test','content-length':'20000'},body:'{}'});
 await expectCode(await f.api.POST(big),413,'too_large')});

test('legacy German-only responses still resolve to a code',()=>{
 for(const [code,e] of Object.entries(guest.BOOKING_ERRORS))assert.equal(guest.codeFromMessage(e.message),code);
 assert.equal(guest.codeFromMessage('Reservierung nicht gefunden.'),'not_found');
 assert.equal(guest.codeFromMessage('something unknown'),undefined);
 assert.equal(guest.errorKey({code:'cannot_modify'}),'err.cannot_modify');
 assert.equal(guest.errorKey({error:'Anfrage zu groß.'}),'err.too_large','legacy message without code');
 assert.equal(guest.errorKey({code:'bogus'}),'err.generic');assert.equal(guest.errorKey({}),'err.generic')});

test('personal token is read from the URL fragment only when it is well-formed',()=>{
 const t='0123456789abcdef'.repeat(4);
 assert.equal(guest.tokenFromHash('#'+t),t);assert.equal(guest.tokenFromHash(t),t);
 for(const bad of ['','#','#abc','#'+t.toUpperCase(),'#'+t+'0','#'+t.slice(1)+'g'])assert.equal(guest.tokenFromHash(bad),null,JSON.stringify(bad))});

test('status values map to translation keys, unknown ones degrade safely',()=>{
 for(const s of ['pending','confirmed','arrived','cancelled','noshow'])assert.equal(guest.statusKey(s),'rs.status.'+s);
 assert.equal(guest.statusKey('whatever'),'rs.status.unknown')});

test('every guest-facing status and error key exists in all six languages, translated',()=>{
 const keys=[...Object.keys(guest.BOOKING_ERRORS).map(c=>'err.'+c),'err.token_missing','err.generic',...['pending','confirmed','arrived','cancelled','noshow','unknown'].map(s=>'rs.status.'+s),
  'rs.title','rs.loading','rs.pendingNote','rs.refresh','rs.cancel','rs.cancelAsk','rs.cancelYes','rs.cancelBack','rs.cancelledNote','rs.keepLink','rs.newRequest','rs.noToken'];
 for(const lang of LANGS)for(const k of keys){const v=dict[lang][k];assert.ok(typeof v==='string'&&v.trim(),`${lang} missing ${k}`)}
 // Non-German languages must not just reuse the German string.
 for(const lang of LANGS.filter(l=>l!=='de'))for(const k of keys)assert.notEqual(dict[lang][k],dict.de[k],`${lang} ${k} is untranslated German`)});

test('status page is a localized, storage-free client of the token API in the approved site design',()=>{
 const src=fs.readFileSync('app/(site)/reservation/view.tsx','utf8');
 assert.ok(!fs.existsSync('app/(legacy)/reservation/page.tsx'),'legacy status page removed');
 assert.match(src,/SiteLayout/);assert.match(src,/X-Booking-Token/);assert.match(src,/tokenFromHash/);assert.match(src,/useI18n/);
 assert.ok(!/localStorage|sessionStorage|indexedDB/.test(src),'no browser storage');
 assert.ok(!/Anfrage in Bearbeitung|Reservierung stornieren|Wird geladen/.test(src),'no hard-coded German UI text');
 assert.match(src,/role="alert"/);assert.match(src,/aria-live/);
 const page=fs.readFileSync('app/(site)/reservation/page.tsx','utf8');assert.match(page,/index:\s*false/)});

test('booking wizard shows localized server errors by code',()=>{
 const src=fs.readFileSync('app/(site)/reservierung/view.tsx','utf8');assert.match(src,/errorKey/)});
