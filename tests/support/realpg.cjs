// Real PostgreSQL harness for tests: an ephemeral local server (initdb/pg_ctl on PATH) or
// NEA_TEST_ADMIN_URL (superuser URL of any server, e.g. the local Supabase database).
// Each call creates a throwaway database, stubs Supabase API roles when absent, and applies
// the real supabase/migrations/*.sql exactly as the CLI would.
const {spawnSync}=require('node:child_process'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),net=require('node:net'),ts=require('typescript');
function have(bin){return spawnSync('which',[bin]).status===0;}
function freePort(){return new Promise(r=>{const s=net.createServer().listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p))})});}
function available(){return !!process.env.NEA_TEST_ADMIN_URL||(have('initdb')&&have('pg_ctl'));}
async function server(){
 if(process.env.NEA_TEST_ADMIN_URL)return {adminUrl:process.env.NEA_TEST_ADMIN_URL,stop(){}};
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'nea-pg-')),port=await freePort();
 const init=spawnSync('initdb',['-D',dir+'/data','-U','postgres','--auth=trust','-E','UTF8'],{encoding:'utf8'});
 if(init.status!==0)throw Error('initdb failed: '+init.stderr);
 const start=spawnSync('pg_ctl',['-D',dir+'/data','-o',`-p ${port} -c listen_addresses=127.0.0.1 -k ${dir} -c fsync=off`,'-l',dir+'/log','-w','start'],{encoding:'utf8'});
 if(start.status!==0)throw Error('pg_ctl start failed: '+start.stderr);
 return {adminUrl:`postgresql://postgres@127.0.0.1:${port}/postgres`,stop(){spawnSync('pg_ctl',['-D',dir+'/data','-m','immediate','stop']);fs.rmSync(dir,{recursive:true,force:true});}};
}
const stubRoles=`DO $$ DECLARE r text; BEGIN FOREACH r IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname=r) THEN EXECUTE format('CREATE ROLE %I NOLOGIN',r); END IF; END LOOP; END $$;`;
function migrations(){const dir=path.join(__dirname,'../../supabase/migrations');return fs.readdirSync(dir).filter(f=>f.endsWith('.sql')).sort().map(f=>({file:f,sql:fs.readFileSync(path.join(dir,f),'utf8')}));}
async function createDatabase(postgres,adminUrl,{migrate=true}={}){
 const name='nea_test_'+Math.random().toString(36).slice(2,10),root=postgres(adminUrl,{max:1});
 await root.unsafe(`CREATE DATABASE ${name}`);await root.end();
 const u=new URL(adminUrl);u.pathname='/'+name;const dbUrl=u.toString(),admin=postgres(dbUrl,{max:4,onnotice:()=>{}});
 await admin.unsafe(stubRoles);
 if(migrate)for(const m of migrations())await admin.unsafe(m.sql);
 const r=new URL(dbUrl);r.username='nea_runtime';r.password='nea_test_only';
 if(migrate)await admin.unsafe("ALTER ROLE nea_runtime PASSWORD 'nea_test_only'");
 return {name,adminUrl:dbUrl,runtimeUrl:r.toString(),admin,async drop(){await admin.end();const c=postgres(adminUrl,{max:1});await c.unsafe(`DROP DATABASE ${name} WITH (FORCE)`);await c.end();}};
}
function load(file,imports={}){const m={exports:{}};new Function('require','module','exports',ts.transpileModule(fs.readFileSync(path.join(__dirname,'../..',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText)(n=>n in imports?imports[n]:require(n),m,m.exports);return m.exports;}
module.exports={available,server,createDatabase,migrations,load};
