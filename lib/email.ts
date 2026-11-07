// Server-only transactional reservation email via Resend (#19). Never import from client components.
// Email is a side effect OF a persisted booking change, never part of it: nothing here throws, and a failed or
// missing delivery leaves PostgreSQL booking state untouched. Disabled (silently) unless RESEND_API_KEY and EMAIL_FROM are set.
import {database} from './staff';
export type EmailKind='pending'|'confirmed'|'cancelled';
export type MailBooking={id:string;name:string;email:string;date:string;time:string;guests:number};
const STALE_MS=10*60*1000;
const config=()=>{const apiKey=process.env['RESEND_API_KEY'],from=process.env['EMAIL_FROM'];return apiKey&&from?{apiKey,from,replyTo:process.env['EMAIL_REPLY_TO']||undefined}:null;};
export const emailsEnabled=()=>!!config();
const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
// Stored dates/times are already Berlin wall-clock text (YYYY-MM-DD, HH:MM); a UTC-noon date renders the same weekday in any zone.
export const berlinDate=(date:string)=>new Intl.DateTimeFormat('de-DE',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Berlin'}).format(new Date(`${date}T12:00:00Z`));
export function renderEmail(kind:EmailKind,b:MailBooking,statusUrl?:string){
 const when=`${berlinDate(b.date)}, ${b.time} Uhr (Berlin)`;
 const lines=[`Hallo ${b.name},`,''];
 let subject:string;
 if(kind==='pending'){subject='Deine Reservierungsanfrage bei NEA 1889 – noch nicht bestätigt';lines.push('vielen Dank für deine Anfrage. Sie ist bei uns eingegangen, aber noch nicht bestätigt – dein Tisch ist erst nach unserer Bestätigung reserviert.');}
 else if(kind==='confirmed'){subject='Deine Reservierung bei NEA 1889 ist bestätigt';lines.push('wir freuen uns, deine Reservierung zu bestätigen.');}
 else{subject='Deine Reservierung bei NEA 1889 wurde storniert';lines.push('deine Reservierung wurde storniert. Es ist kein Tisch mehr für dich reserviert.');}
 lines.push('',`Termin: ${when}`,`Personen: ${b.guests}`,`Status: ${kind==='pending'?'Angefragt (noch nicht bestätigt)':kind==='confirmed'?'Bestätigt':'Storniert'}`);
 if(kind==='pending'&&statusUrl)lines.push('',`Persönlicher Link zum Status und zur Stornierung (bitte aufbewahren): ${statusUrl}`);
 else if(kind==='confirmed')lines.push('','Deinen persönlichen Statuslink hast du mit deiner Anfrage erhalten.');
 lines.push('','NEA 1889');
 const html=lines.map(l=>l?`<p>${esc(l).replace(statusUrl?esc(statusUrl):'\u0000',u=>`<a href="${u}">${u}</a>`)}</p>`:'').join('');
 return {subject,text:lines.join('\n'),html};
}
// Claim-then-send: the primary key `<booking>:<kind>` lets exactly one caller own an event. A failed event (or a claim
// abandoned >10 min ago by a crashed instance) may be re-claimed; Resend's idempotency key covers a crash after sending.
export async function notifyReservation(kind:EmailKind,b:MailBooking,statusUrl?:string):Promise<'sent'|'skipped'|'failed'>{
 const cfg=config();if(!cfg)return 'skipped';
 const id=`${b.id}:${kind}`;
 try{
  const db=database(),now=new Date().toISOString();
  const claim=await db.prepare("INSERT INTO email_events (id,booking_id,kind,status,created,updated) VALUES (?,?,?,'sending',?,?) ON CONFLICT(id) DO UPDATE SET status='sending',updated=excluded.updated WHERE email_events.status='failed' OR (email_events.status='sending' AND email_events.updated<?)").bind(id,b.id,kind,now,now,new Date(Date.now()-STALE_MS).toISOString()).run();
  if(!claim.meta.changes)return 'skipped';
  let ok=false;
  try{
   const m=renderEmail(kind,b,statusUrl);
   const res=await fetch('https://api.resend.com/emails',{method:'POST',signal:AbortSignal.timeout(8000),headers:{Authorization:`Bearer ${cfg.apiKey}`,'Content-Type':'application/json','Idempotency-Key':id},body:JSON.stringify({from:cfg.from,to:[b.email],...(cfg.replyTo?{reply_to:cfg.replyTo}:{}),subject:m.subject,html:m.html,text:m.text})});
   ok=res.ok;
  }catch{ok=false;}
  await db.prepare('UPDATE email_events SET status=?,updated=? WHERE id=?').bind(ok?'sent':'failed',new Date().toISOString(),id).run();
  return ok?'sent':'failed';
 }catch{return 'failed';}
}
