const {test}=require('node:test');const assert=require('node:assert/strict');const ts=require('typescript');const fs=require('node:fs');const {DatabaseSync}=require('node:sqlite');
// Issue #13 / PR A1: Origin (CSRF) validation and bounded JSON body parsing for POST/PATCH /api/booking.
function load(path,overrides={}){const m={exports:{}};const js=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;new Function('require','module','exports',js)(n=>n in overrides?overrides[n]:require(n),m,m.exports);return m.exports;}
const rules=load('lib/reservation-rules.ts'),trusted=load('lib/trusted-origins.ts');
const security=load('lib/request-security.ts',{'./trusted-origins':trusted});
const SITE='https://nea1889.pizza',URL_='https://nea1889.pizza/api/booking';
function fixture(){const sql=new DatabaseSync(':memory:');for(const f of fs.readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())sql.exec(fs.readFileSync('drizzle/'+f,'utf8'));
 function prepare(query){let args=[];const s={bind(...v){args=v;return s},async first(){return sql.prepare(query).get(...args)||null},async all(){return{results:sql.prepare(query).all(...args)}},async run(){const r=sql.prepare(query).run(...args);return{meta:{changes:Number(r.changes)}}}};return s}
 let touched=0;const db={prepare(q){touched++;return prepare(q)},async batch(c){touched++;sql.exec('BEGIN');try{const r=[];for(const x of c)r.push(await x.run());sql.exec('COMMIT');return r}catch(e){sql.exec('ROLLBACK');throw e}}};
 const staff={database:()=>db,isStaff:async()=>false};const store=load('lib/booking-store.ts',{'./staff':staff,'./reservation-rules':rules,'./email':require('./support/no-email.cjs')});
 const api=load('app/api/booking/route.ts',{'@/lib/staff':staff,'@/lib/booking-store':store,'@/lib/email':require('./support/no-email.cjs'),'@/lib/reservation-rules':rules,'@/lib/request-security':security});
 return{api,sql,touched:()=>touched};}
const tok=()=>(crypto.randomUUID()+crypto.randomUUID()).replaceAll('-','');
const payload=(p={})=>({requestId:crypto.randomUUID(),token:tok(),name:'Test Gast',email:'t@example.com',phone:'+49 12345678',date:'2099-11-02',time:'19:00',guests:4,notes:'',website:'',accepted:true,...p});
const post=(body,headers={},raw)=>new Request(URL_,{method:'POST',headers:{'Content-Type':'application/json',Origin:SITE,...headers},body:raw??JSON.stringify(body)});
const patch=(token,headers={})=>new Request(URL_,{method:'PATCH',headers:{Origin:SITE,'X-Booking-Token':token,...headers}});
const code=async r=>(await r.json()).code;
const count=f=>f.sql.prepare('select count(*) n from bookings').get().n;
function withOrigins(value,fn){const old=process.env.AUTHORIZED_ORIGINS;if(value===undefined)delete process.env.AUTHORIZED_ORIGINS;else process.env.AUTHORIZED_ORIGINS=value;return Promise.resolve().then(fn).finally(()=>{if(old===undefined)delete process.env.AUTHORIZED_ORIGINS;else process.env.AUTHORIZED_ORIGINS=old})}

test('same-origin POST and PATCH succeed; retry is idempotent; foreign request id/token conflict is rejected',()=>withOrigins(SITE,async()=>{
 const f=fixture(),p=payload();
 const a=await f.api.POST(post(p,{'Sec-Fetch-Site':'same-origin'}));assert.equal(a.status,201);assert.equal(a.headers.get('cache-control'),'no-store');
 assert.equal((await f.api.POST(post(p))).status,200);assert.equal(count(f),1);
 assert.equal((await f.api.POST(post({...p,token:'a'.repeat(64)}))).status,409);
 assert.equal((await f.api.PATCH(patch(p.token,{'Sec-Fetch-Site':'same-origin'}))).status,200);
 assert.equal(f.sql.prepare('select status from bookings').get().status,'cancelled');
}));

test('hostile or untrustworthy sources are rejected before any database access',()=>withOrigins(SITE+',http://localhost:3000',async()=>{
 const cases={
  'foreign origin':{Origin:'https://evil.example'},
  'lookalike host':{Origin:'https://nea1889.pizza.evil.example'},
  'suffix lookalike':{Origin:'https://evilnea1889.pizza'},
  'userinfo trick':{Origin:'https://nea1889.pizza@evil.example'},
  'wrong scheme':{Origin:'http://nea1889.pizza'},
  'wrong port':{Origin:'https://nea1889.pizza:8443'},
  'opaque null':{Origin:'null'},
  'malformed':{Origin:'not a url'},
  'origin with path':{Origin:SITE+'/'},
  'sibling subdomain':{Origin:'https://staging.nea1889.pizza'},
  'cross-site fetch metadata':{'Sec-Fetch-Site':'cross-site'},
  'same-site fetch metadata':{'Sec-Fetch-Site':'same-site'},
  'foreign origin beats good referer':{Origin:'https://evil.example',Referer:SITE+'/reservierung'},
  'null origin beats good referer':{Origin:'null',Referer:SITE+'/reservierung'},
  'foreign referer, no origin':{Origin:undefined,Referer:'https://evil.example/x'},
  'lookalike referer, no origin':{Origin:undefined,Referer:'https://nea1889.pizza.evil.example/'},
  'no origin, no referer':{Origin:undefined},
 };
 for(const [name,h] of Object.entries(cases)){
  const f=fixture(),p=payload(),headers=Object.fromEntries(Object.entries(h).filter(([,v])=>v!==undefined));
  const mk=(method)=>{const r=new Request(URL_,{method,headers:{'Content-Type':'application/json','X-Booking-Token':p.token,...headers},...(method==='POST'?{body:JSON.stringify(p)}:{})});if(!('Origin' in h)){/* default has no Origin */}return r};
  const rp=await f.api.POST(mk('POST')),rc=await f.api.PATCH(mk('PATCH'));
  assert.equal(rp.status,403,name);assert.equal(await code(rp),'forbidden_origin',name);assert.equal(rc.status,403,name);
  assert.equal(rp.headers.get('cache-control'),'no-store');
  assert.equal(f.touched(),0,name+': database must not be touched');assert.equal(count(f),0,name);
 }
}));

test('Referer fallback: strictly validated same-origin Referer is accepted only when Origin is absent',()=>withOrigins(SITE,async()=>{
 const f=fixture(),p=payload();
 const r=new Request(URL_,{method:'POST',headers:{'Content-Type':'application/json',Referer:SITE+'/reservierung?x=1'},body:JSON.stringify(p)});
 assert.equal((await f.api.POST(r)).status,201);
}));

test('existing localhost development configuration works; other localhost ports and hosts do not',()=>withOrigins('http://localhost:3000',async()=>{
 const f=fixture(),p=payload();
 const ok=new Request('http://localhost:3000/api/booking',{method:'POST',headers:{'Content-Type':'application/json',Origin:'http://localhost:3000'},body:JSON.stringify(p)});
 assert.equal((await f.api.POST(ok)).status,201);
 for(const o of ['http://localhost:3001','http://127.0.0.1:3000','https://localhost:3000'])assert.equal((await f.api.POST(post(payload(),{Origin:o}))).status,403,o);
}));

test('unset or invalid trusted-origin configuration fails closed (503 unavailable, no database access)',async()=>{
 for(const value of [undefined,'','  , ','not a url','javascript:alert(1)','ftp://nea1889.pizza','https://user:pw@nea1889.pizza']){
  await withOrigins(value,async()=>{
   const f=fixture(),p=payload(),res=await f.api.POST(post(p));
   assert.equal(res.status,503,String(value));assert.equal(await code(res),'unavailable');assert.equal(f.touched(),0);assert.equal(count(f),0);
   assert.equal((await f.api.PATCH(patch(p.token))).status,503);
  });
 }
 // One bad entry must not disable the valid ones, and must not widen trust.
 await withOrigins('not a url,'+SITE,async()=>{const f=fixture();assert.equal((await f.api.POST(post(payload()))).status,201);assert.equal((await f.api.POST(post(payload(),{Origin:'not a url'}))).status,403)});
});

test('forwarded-host headers are never trusted',()=>withOrigins(SITE,async()=>{
 const f=fixture();
 const res=await f.api.POST(post(payload(),{Origin:'https://evil.example','X-Forwarded-Host':'evil.example','Forwarded':'host=evil.example','X-Forwarded-Proto':'https'}));
 assert.equal(res.status,403);
 const evilTarget=new Request('https://evil.example/api/booking',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://evil.example'},body:JSON.stringify(payload())});
 assert.equal((await f.api.POST(evilTarget)).status,403);assert.equal(count(f),0);
}));

test('unknown tokens expose nothing; GET stays token-only and unaffected by origin policy',()=>withOrigins(SITE,async()=>{
 const f=fixture(),p=payload();await f.api.POST(post(p));
 const r=await f.api.PATCH(patch(tok()));assert.equal(r.status,404);assert.deepEqual(Object.keys(await r.json()).sort(),['code','error']);
 const g=await f.api.GET(new Request(URL_,{headers:{'X-Booking-Token':p.token}}));assert.equal(g.status,200);
}));

// ---- Body handling ----
test('JSON media type: charset parameter accepted; text/plain, form and missing types rejected with 415 and no writes',()=>withOrigins(SITE,async()=>{
 const f=fixture();
 assert.equal((await f.api.POST(post(payload(),{'Content-Type':'application/json; charset=utf-8'}))).status,201);
 assert.equal((await f.api.POST(post(payload(),{'Content-Type':'Application/JSON;charset=UTF-8'}))).status,201);
 const before=count(f);
 for(const type of ['text/plain','text/plain;charset=UTF-8','application/x-www-form-urlencoded','multipart/form-data','application/jsonp','application/json-evil','application/ld+json']){
  const res=await f.api.POST(post(payload(),{'Content-Type':type}));assert.equal(res.status,415,type);assert.equal(await code(res),'invalid_request',type);
 }
 const none=new Request(URL_,{method:'POST',headers:{Origin:SITE},body:new Blob([JSON.stringify(payload())])});
 assert.equal((await f.api.POST(new Request(URL_,{method:'POST',headers:{Origin:SITE,'Content-Type':''},body:JSON.stringify(payload())}))).status,415);void none;
 assert.equal(count(f),before);
}));

test('malformed JSON, invalid UTF-8, empty and non-object bodies are client errors (400), not storage failures',()=>withOrigins(SITE,async()=>{
 const f=fixture();
 for(const raw of ['{"requestId":','not json','',   '[1,2]','null','"x"','42']){
  const res=await f.api.POST(post(null,{},raw));assert.equal(res.status,400,JSON.stringify(raw));assert.equal(await code(res),'invalid_request',JSON.stringify(raw));
 }
 const bad=new Request(URL_,{method:'POST',headers:{'Content-Type':'application/json',Origin:SITE},body:new Uint8Array([0x7b,0x22,0xff,0xfe,0x22,0x3a,0x31,0x7d])});
 assert.equal((await f.api.POST(bad)).status,400);assert.equal(count(f),0);
}));

test('body size: exactly at the limit is parsed and validated; one byte over is 413',()=>withOrigins(SITE,async()=>{
 const f=fixture(),LIMIT=security.MAX_JSON_BYTES;assert.equal(LIMIT,12000);
 const pad=(p,n)=>{const base=JSON.stringify({...p,pad:''});return JSON.stringify({...p,pad:'x'.repeat(n-Buffer.byteLength(base))})};
 const p=payload(),exact=pad(p,LIMIT);assert.equal(Buffer.byteLength(exact),LIMIT);
 const atLimit=await f.api.POST(post(null,{},exact));assert.notEqual(atLimit.status,413);assert.equal(atLimit.status,201,'extra keys ignored by schema; valid request is stored');
 const over=pad(payload(),LIMIT+1);assert.equal(Buffer.byteLength(over),LIMIT+1);
 const res=await f.api.POST(post(null,{},over));assert.equal(res.status,413);assert.equal(await code(res),'too_large');assert.equal(count(f),1);
}));

test('size cap cannot be bypassed: missing or understated Content-Length, chunked streams, multibyte text',()=>withOrigins(SITE,async()=>{
 const f=fixture(),big=JSON.stringify({...payload(),notes:'x'.repeat(20000)});
 // Streamed body with no Content-Length header at all.
 const stream=(chunks)=>new ReadableStream({start(c){for(const x of chunks)c.enqueue(new TextEncoder().encode(x));c.close()}});
 const streamed=new Request(URL_,{method:'POST',headers:{'Content-Type':'application/json',Origin:SITE},body:stream([big.slice(0,5000),big.slice(5000,15000),big.slice(15000)]),duplex:'half'});
 assert.equal(streamed.headers.get('content-length'),null);assert.equal((await f.api.POST(streamed)).status,413);
 // Understated Content-Length against the real body: exercised through the parser with a hand-built request-like object.
 const lying={headers:new Headers({'content-type':'application/json','content-length':'10'}),body:stream([big])};
 const parsed=await security.readJsonBody(lying);assert.deepEqual(parsed,{ok:false,reason:'too_large'});
 // Non-numeric / negative declared lengths do not matter either; the received bytes decide.
 for(const len of ['abc','-1','']){const r={headers:new Headers({'content-type':'application/json','content-length':len}),body:stream([big])};assert.equal((await security.readJsonBody(r)).reason,'too_large',len)}
 // 4,000 three-byte characters are 12,000+ bytes although only 4,000 characters long.
 const euro=JSON.stringify({a:'€'.repeat(4000)});assert.ok(euro.length<12000&&Buffer.byteLength(euro)>12000);
 assert.equal((await f.api.POST(post(null,{},euro))).status,413);
 assert.equal(count(f),0);
}));

test('reading stops once the limit is exceeded: the rest of the stream is never consumed',async()=>{
 let pulled=0;const chunk=new Uint8Array(5000).fill(0x20);
 const body=new ReadableStream({pull(c){pulled++;c.enqueue(chunk);if(pulled>1000)c.close()}});
 const res=await security.readJsonBody({headers:new Headers({'content-type':'application/json'}),body});
 assert.equal(res.reason,'too_large');assert.ok(pulled<=5,'pulled '+pulled+' chunks');
});

test('oversized, malformed and wrong-type requests never create bookings or occupancy',()=>withOrigins(SITE,async()=>{
 const f=fixture();
 await f.api.POST(post(null,{},'x'.repeat(13000)));await f.api.POST(post(null,{},'{'));await f.api.POST(post(payload(),{'Content-Type':'text/plain'}));
 assert.equal(count(f),0);assert.equal(f.sql.prepare('select count(*) n from occupancy').get().n,0);
}));

test('validation behaviour is preserved: honeypot, consent and reopen-form codes',()=>withOrigins(SITE,async()=>{
 const f=fixture();
 assert.equal(await code(await f.api.POST(post(payload({website:'http://spam'})))),'invalid_request');
 assert.equal(await code(await f.api.POST(post({name:'x'}))),'reopen_form');
 assert.equal(await code(await f.api.POST(post(payload({accepted:false})))),'invalid_details');
 assert.equal(count(f),0);
}));

test('every error code, including forbidden_origin, has a translation in all six languages',()=>{
 const dict=load('lib/site/i18n-dict.ts').DICT;
 for(const lang of ['de','en','it','fr','es','pt'])for(const c of Object.keys(rules.BOOKING_ERRORS))assert.ok(dict[lang]['err.'+c],lang+' err.'+c);
});

test('checkRequestOrigin is pure and accepts an explicit trusted list',()=>{
 const r=h=>new Request(URL_,{method:'POST',headers:h});
 assert.equal(security.checkRequestOrigin(r({Origin:SITE}),[SITE]),'ok');
 assert.equal(security.checkRequestOrigin(r({Origin:SITE}),[]),'misconfigured');
 assert.equal(security.checkRequestOrigin(r({}),[SITE]),'forbidden');
});
