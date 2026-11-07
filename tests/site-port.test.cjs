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

test('simulated availability labels stay out; wizard uses only the server availability loader',()=>{
  const dict=fs.readFileSync('lib/site/i18n-dict.ts','utf8');
  const view=fs.readFileSync('app/(site)/reservierung/view.tsx','utf8');
  assert.ok(!/"st\.(available|few|full)"/.test(dict),'simulated availability labels must not exist');
  assert.ok(!/st\.available|st\.few|st\.full/.test(view));
  assert.match(view,/createAvailabilityLoader/);
  assert.ok(!/api\/availability/.test(view),'the loader module owns the endpoint call');
  assert.ok(!/localStorage|sessionStorage/.test(view));
  for(const key of ['st.past','r.noSlots','c.pending','r.demo','c.noMail'])assert.equal(dict.split(`"${key}"`).length-1,6,`${key} must exist once per language`);
});

test('availability wording exists once per language and stays advisory',()=>{
  const dict=fs.readFileSync('lib/site/i18n-dict.ts','utf8');
  const view=fs.readFileSync('app/(site)/reservierung/view.tsx','utf8');
  const keys=['av.advisory','av.loading','av.error','av.retry','av.full','av.closed','av.allFull','av.dayClosed','av.unchecked'];
  for(const key of keys){assert.equal(dict.split(`"${key}"`).length-1,6,`${key} must exist once per language`);assert.ok(view.includes(`"${key}"`),`${key} unused in wizard`)}
  const {DICT}=(()=>{const m={exports:{}};const js=require('typescript').transpileModule(dict,{compilerOptions:{module:1,target:99}}).outputText;new Function('module','exports',js)(m,m.exports);return m.exports})();
  for(const lang of Object.keys(DICT)){assert.equal(Object.keys(DICT[lang]).length,Object.keys(DICT.de).length,`${lang} key parity`);for(const k of keys)assert.ok(DICT[lang][k]&&DICT[lang][k].length>3,`${lang}.${k}`)}
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
