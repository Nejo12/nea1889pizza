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
test('structure: email-safe (tables, inline styles, no scripts/remote images), preheader, lang, dark-scheme meta',()=>{
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
