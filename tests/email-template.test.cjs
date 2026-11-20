// Brand/design contract of the transactional email HTML (#19). Pure rendering: no database, no network.
const {test}=require('node:test'),assert=require('node:assert/strict'),support=require('./support/realpg.cjs');
const {renderEmail}=support.load('lib/email.ts',{'./staff':{database(){throw Error('not used')}}});
const b={id:'1',name:'Giulia',email:'g@example.com',date:'2099-11-02',time:'19:00',guests:4};
const url='https://example.test/reservation#'+'a'.repeat(64);
test('brand: site palette, serif/display fonts with safe fallbacks, wordmark, tagline and address',()=>{
 for(const k of ['pending','confirmed','cancelled']){const {html}=renderEmail(k,b,url);
  for(const c of ['#0E0C07','#EDE4D8','#C58C42'])assert.ok(html.includes(c),k+' '+c);
  assert.match(html,/Cinzel[^;"]*Georgia/);assert.match(html,/Cormorant Garamond[^;"]*Georgia/);
  assert.match(html,/NEA/);assert.match(html,/1889/);assert.match(html,/Naples at heart\. Berlin by choice\./);assert.match(html,/Zimmerstraße 26\/27/);assert.match(html,/Berlin – Napoli – Sempre/);}
});
test('structure: email-safe (tables, inline styles, no scripts or external fonts), preheader, lang, dark-scheme meta',()=>{
 const {html}=renderEmail('pending',b,url);
 assert.match(html,/^<!doctype html>/i);assert.match(html,/<html lang="de"/);assert.match(html,/<meta name="color-scheme"/);assert.match(html,/<table[^>]*role="presentation"/);
 assert.doesNotMatch(html,/<script|<img|@import|<link/i);assert.match(html,/display:none[^>]*>[^<]*Anfrage/);
});
test('content: Berlin date, time, guests and truthful status badge per kind',()=>{
 const p=renderEmail('pending',b,url).html,c=renderEmail('confirmed',b).html,x=renderEmail('cancelled',b).html;
 for(const h of [p,c,x]){assert.match(h,/Montag, 2\. November 2099/);assert.match(h,/19:00 Uhr/);assert.match(h,/>4</)}
 assert.match(p,/noch nicht bestätigt/i);assert.doesNotMatch(c,/noch nicht bestätigt/i);assert.match(c,/Bestätigt/);assert.match(x,/Storniert/);
});
test('personal link: pending only, as an accessible button plus a copyable fallback; HTML is escaped',()=>{
 const p=renderEmail('pending',{...b,name:'<b>"x"&'},url).html;
 assert.ok(p.includes(`href="${url}"`));assert.ok((p.match(new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'))||[]).length>=2);
 assert.doesNotMatch(p,/<b>"x"/);assert.match(p,/&lt;b&gt;&quot;x&quot;&amp;/);
 assert.doesNotMatch(renderEmail('confirmed',b,url).html,/reservation#/);assert.doesNotMatch(renderEmail('cancelled',b,url).html,/reservation#/);
});

test('confirmation never claims a personal link was delivered; pending keeps its actual link',()=>{
 const pending=renderEmail('pending',b,url);
 assert.match(pending.text,/Persönlicher Link zum Status/);
 assert.ok(pending.html.includes(url));
 for(const confirmed of [renderEmail('confirmed',b),renderEmail('confirmed',b,url)]){
  assert.doesNotMatch(confirmed.text,/persönlichen Statuslink hast du/i);
  assert.doesNotMatch(confirmed.html,/persönlichen Statuslink hast du/i);
  assert.doesNotMatch(confirmed.html,/reservation#/);
 }
});
test('staff UI does not falsely claim automatic reservation emails never occur',()=>{
 const ui=require('node:fs').readFileSync('app/(legacy)/admin/manager.tsx','utf8');
 assert.doesNotMatch(ui,/Keine automatische E-Mail/);
 assert.match(ui,/E-Mail je nach Reservierungsereignis/);
 assert.match(ui,/Bei Statusänderungen kann eine E-Mail versendet werden/);
});


test('supplied decorative pattern is fixed, first-party and safe when email images are disabled',()=>{
 const fs=require('node:fs'),crypto=require('node:crypto');
 const asset=fs.readFileSync('public/email/rm-background-0e7d40b0.jpg');
 assert.equal(crypto.createHash('sha256').update(asset).digest('hex'),'0e7d40b094aac7a2293ccfa12c12b62e7a54f395d8a0f3e6bc0233f02f54948f');
 for(const kind of ['pending','confirmed','cancelled']){
  const {html}=renderEmail(kind,b,url);
  assert.match(html,/background="https:\/\/nea1889.pizza\/email\/rm-background-0e7d40b0.jpg"/);
  assert.match(html,/bgcolor="#500F12"/);
  assert.match(html,/background-color:#500F12/);
  assert.match(html,/@media only screen and \(max-width:480px\)/);
  assert.match(html,/max-width:600px/);
  assert.ok(html.includes('<!--[if mso]>'));
  assert.match(html,/aria-label="Reservierungsdetails"/);
  assert.match(html,/<th scope="row"/);
  assert.doesNotMatch(html,/<script|<img|<link|@import|data:image|cid:|@font-face/i);
  assert.doesNotMatch(html,/url\([^)]*(?:reservation|example.test)/i);
 }
});

test('visual fixture is synthetic, side-effect free and absent in Production',()=>{
 const {GET}=support.load('app/email-preview/route.ts',{'@/lib/email':{renderEmail}});
 const env=process.env.VERCEL_ENV,node=process.env.NODE_ENV;
 try{
  process.env.NODE_ENV='production';process.env.VERCEL_ENV='production';
  assert.equal(GET(new Request('https://example.test/email-preview')).status,404);
  delete process.env.VERCEL_ENV;
  assert.equal(GET(new Request('https://example.test/email-preview')).status,404);
  process.env.VERCEL_ENV='preview';
  for(const kind of ['pending','confirmed','cancelled']){
   const response=GET(new Request('https://example.test/email-preview?kind='+kind));
   assert.equal(response.status,200);
   assert.equal(response.headers.get('Cache-Control'),'no-store');
   assert.equal(response.headers.get('X-Robots-Tag'),'noindex, nofollow');
   assert.match(response.headers.get('Content-Security-Policy'),/default-src 'none'/);
  }
  assert.equal(GET(new Request('https://example.test/email-preview?kind=invalid')).status,404);
 }finally{
  if(env===undefined)delete process.env.VERCEL_ENV;else process.env.VERCEL_ENV=env;
  if(node===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=node;
 }
});


test('redesigned email keeps guest text and link attributes escaped and never inserts guest notes',()=>{
 const hostile={...b,name:'<img src=x onerror="alert(1)"> & guest',notes:'PRIVATE NOTES NOT FOR EMAIL'};
 const link='https://example.test/reservation#safe" onmouseover="bad<';
 const {html,text}=renderEmail('pending',hostile,link);
 assert.doesNotMatch(html,/<img|onmouseover="bad|PRIVATE NOTES NOT FOR EMAIL/);
 assert.match(html,/&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt; &amp; guest/);
 assert.ok(html.includes('href="https://example.test/reservation#safe&quot; onmouseover=&quot;bad&lt;"'));
 assert.ok(text.includes(hostile.name));
 for(const kind of ['confirmed','cancelled'])assert.ok(!renderEmail(kind,b,link).html.includes(link));
});
