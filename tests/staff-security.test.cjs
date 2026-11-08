const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');

function load(path,imports={}){
 const mod={exports:{}};
 const js=ts.transpileModule(fs.readFileSync(path,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
 }).outputText;
 new Function('require','module','exports',js)(name=>name in imports?imports[name]:require(name),mod,mod.exports);
 return mod.exports;
}

const REQUEST_URL='https://nea-preview.example/api/reservations';
const request=(method='GET',opts={})=>new Request(REQUEST_URL,{
 method,headers:{...(opts.cookie?{Cookie:opts.cookie}:{})},
});

function staffFixture({configured=true,user=null,authError=null,member=null,dbError=false}={}){
 const calls={auth:0,membership:0,queriedUser:null,cookies:null};
 const staff=load('lib/staff.ts',{
  '@supabase/ssr':{
   createServerClient(_url,_key,options){
    calls.cookies=options.cookies.getAll();
    return {auth:{async getUser(){calls.auth++;return {data:{user},error:authError};}}};
   },
   parseCookieHeader(value){return value?[{name:'sb-test',value}]:[];}
  },
  './supabase/config':{supabaseAuthConfig:()=>configured?{url:'https://auth.test',key:'publishable'}:null},
  './database':{database:()=>({
   prepare(sql){
    calls.membership++;
    assert.match(sql,/FROM staff_members WHERE user_id=\? AND active=true/);
    return {
     bind(id){calls.queriedUser=id;return this;},
     async first(){if(dbError)throw Error('database unavailable');return member;}
    };
   }
  })}
 });
 return {staff,calls};
}

test('staff auth denies missing, expired and invalid sessions before checking membership',async()=>{
 const missing=staffFixture({user:{id:'user-1',email:'staff@example.test'},member:{role:'staff'}});
 assert.deepEqual(await missing.staff.staffFromRequest(),{ok:false,status:401});
 assert.equal(missing.calls.auth,0);
 const expired=staffFixture({user:null});
 assert.deepEqual(await expired.staff.staffFromRequest(request('GET',{cookie:'expired'})),{ok:false,status:401});
 assert.equal(expired.calls.membership,0);
 const invalid=staffFixture({authError:{message:'invalid JWT'}});
 assert.deepEqual(await invalid.staff.staffFromRequest(request('GET',{cookie:'invalid'})),{ok:false,status:401});
 assert.equal(invalid.calls.membership,0);
});

test('valid login without an active staff row is denied; Admin and Staff use authenticated UUID',async()=>{
 const user={id:'user-321',email:'auth@example.test'};
 const nonstaff=staffFixture({user});
 assert.deepEqual(await nonstaff.staff.staffFromRequest(request('GET',{cookie:'valid'})),{ok:false,status:403});
 assert.equal(nonstaff.calls.queriedUser,user.id);
 for(const role of ['admin','staff']){
  const f=staffFixture({user,member:{role}});
  assert.deepEqual(await f.staff.staffFromRequest(request('GET',{cookie:'valid'})),{
   ok:true,staff:{id:user.id,email:user.email,role}
  });
  assert.equal(f.calls.queriedUser,user.id);
  assert.deepEqual(f.calls.cookies,[{name:'sb-test',value:'valid'}]);
 }
});

test('missing Auth configuration and database errors fail closed',async()=>{
 const noConfig=staffFixture({configured:false});
 assert.deepEqual(await noConfig.staff.staffFromRequest(request()),{ok:false,status:503});
 assert.equal(noConfig.calls.auth,0);
 const unavailable=staffFixture({user:{id:'user-1',email:'staff@example.test'},dbError:true});
 assert.deepEqual(await unavailable.staff.staffFromRequest(request('GET',{cookie:'valid'})),{ok:false,status:503});
});

function routeFixture({staff={ok:true,staff:{id:'user-1',email:'staff@example.test',role:'staff'}}}={}){
 let authCalls=0,dbCalls=0;
 const security=load('lib/request-security.ts',{
  './trusted-origins':{authorizedOrigins:()=>['https://nea-preview.example']}
 });
 const route=load('app/api/reservations/route.ts',{
  '@/lib/staff':{
   staffFromRequest:async()=>{authCalls++;return staff;},
   database:()=>{dbCalls++;throw Error('Unexpected database access');}
  },
  '@/lib/request-security':security,
  '@/lib/booking-store':{updateBooking:()=>{dbCalls++;throw Error('Unexpected update');}},
  '@/lib/reservation-rules':load('lib/reservation-rules.ts')
 });
 return {route,calls:()=>({authCalls,dbCalls})};
}

function write(method,body,headers={}){
 return new Request(REQUEST_URL,{method,headers:{
  Origin:'https://nea-preview.example',
  'Content-Type':'application/json',
  ...headers
 },body});
}

test('staff write requests reject oversized, malformed and non-JSON bodies without database access',async()=>{
 for(const method of ['POST','PATCH']){
  for(const [name,body,headers,status]of [
   ['oversized','x'.repeat(12001),{},413],
   ['malformed','{"unfinished":',{},400],
   ['wrong type','{}',{'Content-Type':'text/plain'},415]
  ]){
   const f=routeFixture();
   const response=await f.route[method](write(method,body,headers));
   assert.equal(response.status,status,method+' '+name);
   assert.equal(response.headers.get('Cache-Control'),'no-store');
   assert.equal(f.calls().dbCalls,0,method+' '+name);
  }
 }
});

test('staff APIs deny anonymous and inactive identities, and reject cross-origin writes before lookup',async()=>{
 for(const status of [401,403]){
  const f=routeFixture({staff:{ok:false,status}});
  for(const method of ['GET','POST','PATCH']){
   const req=method==='GET'?request():write(method,'{}');
   const response=await f.route[method](req);
   assert.equal(response.status,status,method+' status='+status);
   assert.equal(response.headers.get('Cache-Control'),'no-store');
  }
  assert.equal(f.calls().dbCalls,0);
 }
 const f=routeFixture();
 const response=await f.route.PATCH(write('PATCH','{}',{Origin:'https://attacker.example'}));
 assert.equal(response.status,403);
 assert.deepEqual(f.calls(),{authCalls:0,dbCalls:0});
});
