// The Lovable copy of the booking engine must stay a verified, mechanical derivative of this repository.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const load=()=>import('../scripts/sync-lovable.mjs');
const tmp=()=>fs.mkdtempSync(path.join(os.tmpdir(),'nea-sync-'));
test('generated files rewrite only the three known import shapes and carry verifiable headers',async()=>{
 const {generate,FILES}=await load(),out=generate();
 assert.equal(out.length,FILES.length);
 for(const {file,content} of out){
  assert.match(content,/^\/\/ GENERATED .*DO NOT EDIT/);assert.match(content,/source-sha256: [0-9a-f]{64} output-sha256: [0-9a-f]{64}/);
  assert.doesNotMatch(content,/from '@\/|from '\.\/staff'|from 'zod'|clerk/i,file);
 }
 assert.match(out.find(f=>f.file==='guest-api.ts').content,/from 'zod\/v4'/);
});
test('write then verify is clean; hand edits and stale sources are both detected',async()=>{
 const {generate,verify,OUT_DIR}=await load(),dir=tmp(),outDir=path.join(dir,OUT_DIR);fs.mkdirSync(outDir,{recursive:true});
 for(const f of generate())fs.writeFileSync(path.join(outDir,f.file),f.content);
 assert.deepEqual(verify(dir),[]);
 const f=path.join(outDir,'booking-store.ts'),orig=fs.readFileSync(f,'utf8');
 fs.writeFileSync(f,orig+'\n// local tweak\n');assert.match(verify(dir).join(),/booking-store\.ts: edited by hand/);
 fs.writeFileSync(f,orig);fs.rmSync(path.join(outDir,'database.ts'));assert.match(verify(dir).join(),/database\.ts: missing/);
 // stale: source repo changes after the copy was made
 const repo=tmp();for(const [src] of (await load()).FILES){fs.mkdirSync(path.dirname(path.join(repo,src)),{recursive:true});fs.copyFileSync(src,path.join(repo,src));}
 for(const g of generate(repo))fs.writeFileSync(path.join(outDir,g.file),g.content);assert.deepEqual(verify(dir,repo),[]);
 fs.appendFileSync(path.join(repo,'lib/reservation-rules.ts'),'\nexport const changed=1;\n');
 assert.match(verify(dir,repo).join(),/reservation-rules\.ts: stale/);
});
test('auth/Clerk or unknown imports can never be vendored silently',async()=>{
 const {rewrite}=await load();
 assert.throws(()=>rewrite("import {isStaff,database} from '@/lib/staff';",'x.ts'),/only "database"/);
 assert.throws(()=>rewrite("import {clerkStaff} from './clerk-staff';",'x.ts'),/unsupported import/);
 assert.throws(()=>rewrite("import x from '@/lib/other';",'x.ts'),/unsupported import/);
 assert.equal(rewrite("import {database} from '@/lib/staff';",'x.ts'),"import {database} from './database';");
});
