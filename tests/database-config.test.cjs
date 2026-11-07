// Static guardrails: private server-side connection, separated privileges, no schema changes in builds.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{load}=require('./support/realpg.cjs');
function adapterOptions(url){
 let seen;process.env.DATABASE_URL=url;process.env.NEA_DATABASE_SCHEMA='nea';
 const a=load('lib/database.ts',{postgres:(_u,o)=>{seen=o;const sql=()=>[];sql.begin=async fn=>fn(Object.assign(()=>[],{unsafe:async()=>[]}));return sql;}});
 a.database().prepare('SELECT 1').first();return seen;
}
test('pooler-safe connection: prepare disabled, TLS required for remote hosts, none for localhost',async()=>{
 const remote=adapterOptions('postgresql://nea_runtime.ref:pw@aws-0-eu-central-1.pooler.supabase.com:6543/postgres');
 assert.equal(remote.prepare,false);assert.equal(remote.ssl,'require');assert.ok(remote.max<=3);
 const local=adapterOptions('postgresql://nea_runtime:pw@127.0.0.1:54522/postgres');
 assert.equal(local.prepare,false);assert.equal(local.ssl,undefined);
});
test('schema must be explicit and well-formed',()=>{
 const run=v=>{process.env.NEA_DATABASE_SCHEMA=v;return load('lib/database.ts',{postgres:()=>{}}).databaseSchema();};
 assert.equal(run('nea'),'nea');for(const bad of ['','Nea','nea;drop','1nea','a"b'])assert.throws(()=>run(bad),/NEA_DATABASE_SCHEMA/);
});
test('builds never mutate a database and migration identity is separate from runtime',()=>{
 const build=fs.readFileSync('scripts/build.mjs','utf8');
 assert.doesNotMatch(build,/migrate|DATABASE_URL|VERCEL_ENV/);
 const migrate=fs.readFileSync('scripts/migrate.mjs','utf8');
 assert.match(migrate,/MIGRATION_DATABASE_URL/);assert.doesNotMatch(migrate.replace(/MIGRATION_DATABASE_URL/g,''),/DATABASE_URL/);
 assert.match(migrate,/process\.env\.VERCEL/);
 const app=[...walk('app'),...walk('lib')].map(f=>fs.readFileSync(f,'utf8')).join('\n');
 assert.doesNotMatch(app,/MIGRATION_DATABASE_URL|SERVICE_ROLE/i);
 assert.doesNotMatch(fs.readFileSync('.env.example','utf8'),/NEXT_PUBLIC_[A-Z_]*(DATABASE|SERVICE|SUPABASE_DB)/);
 const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));assert.equal(pkg.scripts.build,'node scripts/build.mjs');
});
test('browser code never imports the database adapter',()=>{
 for(const f of walk('app')){const src=fs.readFileSync(f,'utf8');if(/^['"]use client['"]/.test(src.trimStart()))assert.doesNotMatch(src,/lib\/(database|staff|booking-store)|DATABASE_URL/,f);}
});
test('Supabase config: Auth gateway only, application schema never exposed, pinned CLI',()=>{
 const cfg=fs.readFileSync('supabase/config.toml','utf8');
 assert.match(cfg,/\[api\]/);const schemas=cfg.match(/^schemas = \[(.*)\]/m)[1];assert.doesNotMatch(schemas,/nea/);
 for(const f of ['scripts/migrate.mjs','package.json'])assert.match(fs.readFileSync(f,'utf8'),/supabase@3\.0\.0/);
 assert.doesNotMatch(fs.readFileSync('package.json','utf8'),/supabase@(?!3\.0\.0)/);
});
function walk(d){return fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):/\.(tsx?|mjs)$/.test(e.name)?[path.join(d,e.name)]:[]);}
test('Cloudflare Workers: no connection survives an operation (cross-request I/O is forbidden there); Node keeps one pool',async()=>{
 const run=async ua=>{
  const saved=Object.getOwnPropertyDescriptor(globalThis,'navigator');Object.defineProperty(globalThis,'navigator',{value:{userAgent:ua},configurable:true});
  let opened=0,ended=0;process.env.DATABASE_URL='postgresql://nea_runtime:pw@127.0.0.1:54522/postgres';process.env.NEA_DATABASE_SCHEMA='nea';
  try{
   const a=load('lib/database.ts',{postgres:(_u,o)=>{opened++;const sql=()=>[];sql.opts=o;sql.end=async()=>{ended++};sql.begin=async fn=>fn(Object.assign(()=>[],{unsafe:async()=>[]}));return sql;}});
   await a.database().prepare('SELECT 1').first();await a.database().prepare('SELECT 2').first();await a.database().batch([a.database().prepare('SELECT 3')]);
  }finally{saved?Object.defineProperty(globalThis,'navigator',saved):delete globalThis.navigator;}
  return {opened,ended};
 };
 assert.deepEqual(await run('Cloudflare-Workers'),{opened:3,ended:3});
 assert.deepEqual(await run('Node.js/24'),{opened:1,ended:0});
});
