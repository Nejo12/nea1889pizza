const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path='supabase/email-templates/staff-otp.html';
const html=fs.readFileSync(path,'utf8');
const theme=fs.readFileSync('lib/email.ts','utf8');

test('OTP template uses Supabase six-digit token and no magic-link URL',()=>{
 assert.equal(html.split('{{ .Token }}').length-1,1);
 assert.doesNotMatch(html,/\.ConfirmationURL|\.TokenHash/);
 assert.match(html,/<html lang="de">/);
 assert.match(html,/5 Minuten/);
});

test('staff OTP email matches NEA reservation email brand',()=>{
 for(const hex of ['#0E0C07','#17130B','#EDE4D8','#B9AFA0','#C58C42']){
  assert.ok(html.includes(hex),`OTP template missing ${hex}`);
  assert.ok(theme.includes(hex),`reservation email missing ${hex}`);
 }
 assert.match(html,/NEA <span[^>]+>1889<\/span>/);
 assert.match(html,/Naples at heart\. Berlin by choice\./);
 assert.match(html,/Berlin – Napoli – Sempre/);
});

test('OTP HTML uses client-safe inline styling without external assets or executables',()=>{
 assert.doesNotMatch(html,/<(?:script|iframe|form)\b/i);
 assert.doesNotMatch(html,/<(?:link|img)\b/i);
 assert.doesNotMatch(html,/@import|url\(\s*https?:/i);
 assert.match(html,/role="presentation"/);
 assert.match(html,/viewport/);
 assert.match(html,/font-family:/);
});
