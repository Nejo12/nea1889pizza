const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
// Guards for the ported Lovable frontend: it is presentation only; the server stays authoritative.
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const siteFiles=[...walk('app/(site)'),...walk('components/site'),...walk('lib/site')].filter(f=>/\.(tsx?|css)$/.test(f));

test('site frontend never imports server-only modules',()=>{
  const forbidden=/from\s+['"](?:@\/lib\/(?:staff|database|booking-store|clerk-staff|auth-config)|postgres|@clerk\/[^'"]+)['"]/;
  for(const f of siteFiles)assert.ok(!forbidden.test(fs.readFileSync(f,'utf8')),`${f} imports a server-only module`);
});

test('browser storage is only used for the language preference, never for reservations',()=>{
  for(const f of siteFiles){
    const src=fs.readFileSync(f,'utf8');
    if(!/localStorage|sessionStorage|indexedDB/.test(src))continue;
    assert.equal(f,path.join('lib/site/i18n.tsx'),`${f} uses browser storage`);
    assert.ok(!/reserv|booking/i.test(src.match(/STORAGE_KEY\s*=\s*"[^"]*"/)?.[0]||''),'storage key must not be a reservation key');
  }
});

test('reservation wizard submits to the authoritative API with an idempotency key and consent flag',()=>{
  const src=fs.readFileSync('app/(site)/reservierung/view.tsx','utf8');
  assert.match(src,/fetch\("\/api\/booking",\s*\{\s*method:\s*"POST"/);
  for(const field of ['requestId','token','accepted','website'])assert.ok(src.includes(field),`missing ${field}`);
  assert.ok(!/localStorage|loadReservations|saveReservations/.test(src));
});

test('every /brochure asset referenced by the site exists in public/',()=>{
  const refs=new Set();
  for(const f of siteFiles)for(const m of fs.readFileSync(f,'utf8').matchAll(/["'`]\/brochure\/([^"'`]+)["'`]/g))refs.add(m[1]);
  assert.ok(refs.size>10);
  for(const r of refs)assert.ok(fs.existsSync(path.join('public/brochure',r)),`missing public/brochure/${r}`);
});

test('legacy staff pages are isolated from the site stylesheet',()=>{
  for(const f of walk('app/(legacy)').filter(f=>/\.tsx?$/.test(f)))assert.ok(!fs.readFileSync(f,'utf8').includes('site.css'),f);
  assert.ok(fs.readFileSync('app/(legacy)/layout.tsx','utf8').includes('./globals.css'));
});
