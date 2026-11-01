const {test}=require('node:test'),assert=require('node:assert/strict'),ts=require('typescript'),fs=require('node:fs');
function load(path,imports={}){const m={exports:{}};new Function('require','module','exports',ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(n=>n in imports?imports[n]:require(n),m,m.exports);return m.exports;}
test('Clerk staff authorization requires origin, bearer, verified allowed primary email',async()=>{
 process.env.STAFF_EMAILS='owner@example.com';
 let authenticated=true;const user={id:'owner',emailAddresses:[{id:'mail',emailAddress:'owner@example.com',verification:{status:'verified'}}],primaryEmailAddressId:'mail'};
 const auth=load('lib/clerk-staff.ts',{'./auth-config':{authorizedOrigins:()=>['https://test.example']},'@clerk/backend':{createClerkClient:()=>({authenticateRequest:async()=>({isAuthenticated:authenticated,toAuth:()=>({userId:'owner'})}),users:{getUser:async()=>user}})}});
 const request=(origin='https://test.example',token='Bearer fake')=>new Request('https://test.example/api/reservations',{headers:{Origin:origin,Authorization:token}});
 assert.equal(await auth.clerkStaff(request('https://evil.example'),{}),null);
 assert.equal(await auth.clerkStaff(request('https://test.example',''),{}),null);
 assert.equal((await auth.clerkStaff(request(),{})).email,'owner@example.com');
 user.emailAddresses[0].verification.status='unverified';assert.equal(await auth.clerkStaff(request(),{}),null);
 user.emailAddresses[0].verification.status='verified';user.emailAddresses[0].emailAddress='outsider@example.com';assert.equal(await auth.clerkStaff(request(),{}),null);
 process.env.STAFF_EMAILS='';assert.equal(await auth.clerkStaff(request(),{}),null);
 authenticated=false;assert.equal(await auth.clerkStaff(request(),{}),null);
});
test('No legacy ChatGPT fallback when configuration or request is missing',async()=>{
 const staff=load('lib/staff.ts',{'./auth-config':{authConfig:()=>null},'./clerk-staff':{clerkStaff:()=>{throw Error('must not call')}},'./database':{database:()=>{}}});
 assert.equal(await staff.isStaff(),false);assert.equal(await staff.isStaff(new Request('https://test.example')),false);
});
