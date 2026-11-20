const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');

// Render the real public components, replacing only framework navigation and the language context.
// This catches broken CTA destinations and ensures the obsolete cover cannot become the homepage again.
function renderer(){
 const cache=new Map();
 const link=({href,children,...props})=>React.createElement('a',{...props,href},children);
 let dictionary;
 function load(file){
  if(cache.has(file))return cache.get(file);
  const m={exports:{}};
  const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  new Function('require','module','exports',js)(name=>{
   if(name==='next/link')return link;
   if(name==='next/navigation')return {usePathname:()=>'/reservierung'};
   if(name==='@/lib/site/i18n')return {useI18n:()=>({lang:'de',t:(key)=>dictionary[key]||key}),LANGS:['de','en','it','fr','es','pt'],LANG_NAMES:{de:'Deutsch'},DATE_LOCALES:{de:require('date-fns/locale').de}};
   if(name.startsWith('@/')||name.startsWith('.')){
    const base=name.startsWith('@/')?name.slice(2):path.resolve(path.dirname(file),name);
    const resolved=['.tsx','.ts','.js'].map(ext=>base+ext).find(p=>fs.existsSync(p));
    if(!resolved)throw Error('Unresolved source module: '+name);
    return load(resolved);
   }
   return require(name);
  },m,m.exports);
  cache.set(file,m.exports);return m.exports;
 }
 dictionary=load('lib/site/i18n-dict.ts').DICT.de;
 return file=>renderToStaticMarkup(React.createElement(load(file).default));
}

test('current video homepage renders the supplied story and working reservation/menu/about links',()=>{
 const html=renderer()('app/(site)/view.tsx');
 assert.match(html,/<video[^>]+pizza-loop-poster\.webp/);
 assert.match(html,/title-sm\.webp/);
 assert.match(html,/The invisible/);
 assert.match(html,/One root\./);
 for(const route of ['/reservierung','/menu','/about'])assert.ok(html.includes(`href="${route}"`),route);
 assert.doesNotMatch(html,/hero-vesuvio|Le Vignette|La Nostra Visione/);
});

test('current reservation styling wraps the real server-backed wizard, not the exported localStorage demo',()=>{
 const html=renderer()('app/(site)/reservierung/view.tsx');
 assert.match(html,/\/home\/rm_background-1366\.webp/);
 assert.match(html,/Quanti siete/);
 assert.equal((html.match(/aria-pressed="(?:true|false)"/g)||[]).length,12);
 assert.match(html,/href="\/login"/);
 assert.doesNotMatch(html,/href="\/staff"|Demo – Buchungen/);
 const source=fs.readFileSync('app/(site)/reservierung/view.tsx','utf8');
 assert.match(source,/fetch\("\/api\/booking"/);
 assert.match(source,/createAvailabilityLoader/);
 assert.doesNotMatch(source,/saveReservations|loadReservations|localStorage|@\/lib\/reservations/);
});

test('site media uses only inventoried same-origin static files, never a Lovable publishing URL',()=>{
 const manifest=JSON.parse(fs.readFileSync('docs/lovable-media-manifest.json','utf8'));
 const sources=['app/(site)/view.tsx','components/site/HomeStory.tsx','components/site/SiteChrome.tsx','app/(site)/about/view.tsx'].map(f=>fs.readFileSync(f,'utf8')).join('\n');
 assert.doesNotMatch(sources,/lovable\.app|__l5e\/assets-v1/);
 const urls=[...sources.matchAll(/url: "([^"]+)"/g)].map(m=>m[1]);
 assert.ok(urls.length>30);
 const exported=new Set(Object.values(manifest).map(a=>a.localUrl));
 for(const url of urls){assert.ok(exported.has(url),url);assert.ok(fs.existsSync('public'+url),url);}
 for(const asset of Object.values(manifest))assert.equal(fs.statSync('public'+asset.localUrl).size,asset.size);
});

test('production reservation copy never describes browser-only demo bookings in any language',()=>{
 const m={exports:{}};
 new Function('module','exports',ts.transpileModule(fs.readFileSync('lib/site/i18n-dict.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(m,m.exports);
 const {DICT}=m.exports;
 for(const [lang,dict] of Object.entries(DICT)){
  assert.equal(dict['r.demo'],undefined,lang);
  assert.ok(dict['r.requestNotice']?.length>10,lang);
  for(const key of ['r.requestNotice','c.pending','c.number','c.noMail','c.mailSent']){
   assert.ok(dict[key],lang+'.'+key);
   assert.doesNotMatch(dict[key],/\bdemo\b|only saved in this browser|not sent to the restaurant/i,lang+'.'+key);
  }
 }
 const wizard=fs.readFileSync('app/(site)/reservierung/view.tsx','utf8');
 assert.match(wizard,/done.emailNotifications \? "c.mailSent" : "c.noMail"/);
 assert.match(wizard,/t\("r.requestNotice"\)/);
});


test('all 34 recovered media objects retain their original hashes and binary types',()=>{
 const crypto=require('node:crypto');
 const manifest=JSON.parse(fs.readFileSync('docs/lovable-media-manifest.json','utf8'));
 const recovered=Object.values(manifest).filter(a=>a.sha256);
 assert.equal(recovered.length,34);assert.equal(recovered.filter(a=>a.mimeType==='video/mp4').length,4);
 assert.equal(recovered.reduce((sum,a)=>sum+a.size,0),11059362);
 for(const asset of recovered){
  const bytes=fs.readFileSync('public'+asset.localUrl);
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),asset.sha256,asset.localUrl);
  if(asset.mimeType==='image/webp'){
   assert.equal(bytes.toString('ascii',0,4),'RIFF',asset.localUrl);
   assert.equal(bytes.toString('ascii',8,12),'WEBP',asset.localUrl);
  }else{assert.equal(asset.mimeType,'video/mp4');assert.equal(bytes.toString('ascii',4,8),'ftyp',asset.localUrl);}
 }
 assert.equal(fs.readdirSync('public/story').filter(f=>f.includes('.chunk-')).length,0);
});

test('cached legacy media URLs redirect once to exact local files without an external loop',async()=>{
 const config=(await import('../next.config.mjs')).default;
 const redirects=await config.redirects();
 const manifest=JSON.parse(fs.readFileSync('docs/lovable-media-manifest.json','utf8'));
 assert.equal(redirects.length,Object.keys(manifest).length);
 assert.equal(new Set(redirects.map(r=>r.source)).size,redirects.length);
 for(const r of redirects){
  assert.match(r.source,/^\/__l5e\/assets-v1\/[a-f0-9-]{36}\//);
  assert.match(r.destination,/^\/(home|story|brochure)\//);
  assert.ok(fs.existsSync('public'+r.destination),r.destination);
  assert.equal(r.permanent,false);
  assert.ok(!redirects.some(other=>other.source===r.destination),'no redirect chain');
 }
 const chrome=fs.readFileSync('components/site/SiteChrome.tsx','utf8');
 assert.match(chrome,/url: "\/home\/rm_background-1366\.webp"/);
 assert.match(chrome,/url: "\/home\/rm_background-768\.webp"/);
});
