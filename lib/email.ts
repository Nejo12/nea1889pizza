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
// Brand tokens from the site theme (app/(site)/site.css): soot, plaster, ochre gold, blood red, gulf blue.
const C={soot:'#0E0C07',card:'#17130B',plaster:'#EDE4D8',muted:'#B9AFA0',ochre:'#C58C42',blood:'#A12B29',gulf:'#0D437D'};
const DISPLAY="'Cinzel','Trajan Pro',Georgia,'Times New Roman',serif",SERIF="'Cormorant Garamond',Georgia,'Times New Roman',serif",SANS="'Archivo',-apple-system,'Segoe UI',Helvetica,Arial,sans-serif";
const BADGE={pending:{label:'Angefragt · noch nicht bestätigt',bg:'transparent',fg:C.ochre,border:C.ochre},confirmed:{label:'Bestätigt',bg:C.ochre,fg:C.soot,border:C.ochre},cancelled:{label:'Storniert',bg:C.blood,fg:C.plaster,border:C.blood}} as const;
const HEAD={pending:['Wir haben deine Anfrage erhalten','Dein Tisch ist erst nach unserer Bestätigung reserviert. Wir melden uns persönlich bei dir.'],confirmed:['Dein Tisch ist bestätigt','Wir freuen uns auf deinen Besuch.'],cancelled:['Deine Reservierung wurde storniert','Für diesen Termin ist kein Tisch mehr für dich reserviert.']} as const;
function layout(kind:EmailKind,b:MailBooking,when:string,subject:string,statusUrl?:string){
 const [title,lead]=HEAD[kind],badge=BADGE[kind],date=esc(berlinDate(b.date));
 const row=(k:string,v:string)=>`<tr><td style="padding:12px 0;border-bottom:1px solid #3A2F1C;font-family:${SANS};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${C.ochre};width:38%">${k}</td><td style="padding:12px 0;border-bottom:1px solid #3A2F1C;font-family:${SERIF};font-size:20px;color:${C.plaster}">${v}</td></tr>`;
 const link=kind==='pending'&&statusUrl?`<tr><td style="padding:8px 40px 0"><table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto"><tr><td style="background:${C.blood};border:1px solid ${C.ochre};padding:0"><a href="${esc(statusUrl)}" style="display:inline-block;padding:14px 28px;font-family:${DISPLAY};font-size:14px;letter-spacing:2px;text-transform:uppercase;color:${C.plaster};text-decoration:none">Status ansehen</a></td></tr></table><p style="margin:18px 0 6px;font-family:${SANS};font-size:12px;line-height:1.6;color:${C.muted};text-align:center">Dies ist dein persönlicher Link zum Status und zur Stornierung. Bitte bewahre ihn auf: wer ihn hat, kann die Reservierung ansehen und stornieren.</p><p style="margin:0;font-family:${SANS};font-size:11px;line-height:1.6;color:${C.muted};text-align:center;word-break:break-all">${esc(statusUrl)}</p></td></tr>`:kind==='confirmed'?`<tr><td style="padding:8px 40px 0"><p style="margin:0;font-family:${SANS};font-size:12px;line-height:1.6;color:${C.muted};text-align:center">Deinen persönlichen Statuslink hast du mit deiner Anfrage erhalten.</p></td></tr>`:'';
 return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark light"><meta name="supported-color-schemes" content="dark light"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:${C.soot};-webkit-text-size-adjust:100%"><div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.soot}">${esc(title)}. ${date}, ${esc(b.time)} Uhr – ${b.guests} Personen.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.soot}"><tr><td align="center" style="padding:32px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${C.card};border:1px solid ${C.ochre}">
<tr><td align="center" style="padding:40px 40px 8px"><p style="margin:0;font-family:${DISPLAY};font-size:34px;letter-spacing:6px;color:${C.plaster}">NEA <span style="color:${C.ochre}">1889</span></p><p style="margin:10px 0 0;font-family:${SERIF};font-style:italic;font-size:18px;color:${C.ochre}">Naples at heart. Berlin by choice.</p></td></tr>
<tr><td style="padding:20px 40px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid ${C.ochre};font-size:0;line-height:0">&nbsp;</td></tr></table></td></tr>
<tr><td align="center" style="padding:0 40px"><span style="display:inline-block;padding:7px 16px;background:${badge.bg};border:1px solid ${badge.border};font-family:${SANS};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${badge.fg}">${badge.label}</span></td></tr>
<tr><td align="center" style="padding:22px 40px 0"><h1 style="margin:0;font-family:${DISPLAY};font-weight:400;font-size:26px;line-height:1.25;color:${C.plaster}">${esc(title)}</h1><p style="margin:14px 0 0;font-family:${SERIF};font-size:20px;line-height:1.5;color:${C.plaster}">Ciao ${esc(b.name)},</p><p style="margin:6px 0 0;font-family:${SERIF};font-size:20px;line-height:1.5;color:${C.muted}">${esc(lead)}</p></td></tr>
<tr><td style="padding:26px 40px 24px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #3A2F1C">${row('Datum',date)}${row('Uhrzeit',`${esc(b.time)} Uhr <span style="font-family:${SANS};font-size:12px;color:${C.muted}">(Berlin)</span>`)}${row('Personen',String(b.guests))}</table></td></tr>
${link}
<tr><td style="padding:34px 40px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #3A2F1C;padding-top:22px;text-align:center;font-family:${SANS};font-size:12px;line-height:1.7;color:${C.muted}">NEA 1889 · Zimmerstraße 26/27 · 10969 Berlin-Kreuzberg</td></tr></table></td></tr>
<tr><td align="center" style="padding:14px 40px 34px;font-family:${DISPLAY};font-size:11px;letter-spacing:4px;color:${C.ochre}">Berlin – Napoli – Sempre</td></tr>
</table></td></tr></table></body></html>`;
}
export function renderEmail(kind:EmailKind,b:MailBooking,statusUrl?:string){
 const when=`${berlinDate(b.date)}, ${b.time} Uhr (Berlin)`;
 const lines=[`Ciao ${b.name},`,''];
 let subject:string;
 if(kind==='pending'){subject='Deine Reservierungsanfrage bei NEA 1889 – noch nicht bestätigt';lines.push('vielen Dank für deine Anfrage. Sie ist bei uns eingegangen, aber noch nicht bestätigt – dein Tisch ist erst nach unserer Bestätigung reserviert.');}
 else if(kind==='confirmed'){subject='Deine Reservierung bei NEA 1889 ist bestätigt';lines.push('wir freuen uns, deine Reservierung zu bestätigen.');}
 else{subject='Deine Reservierung bei NEA 1889 wurde storniert';lines.push('deine Reservierung wurde storniert. Es ist kein Tisch mehr für dich reserviert.');}
 lines.push('',`Termin: ${when}`,`Personen: ${b.guests}`,`Status: ${kind==='pending'?'Angefragt (noch nicht bestätigt)':kind==='confirmed'?'Bestätigt':'Storniert'}`);
 if(kind==='pending'&&statusUrl)lines.push('',`Persönlicher Link zum Status und zur Stornierung (bitte aufbewahren): ${statusUrl}`);
 else if(kind==='confirmed')lines.push('','Deinen persönlichen Statuslink hast du mit deiner Anfrage erhalten.');
 lines.push('','NEA 1889');
 const html=layout(kind,b,when,subject,statusUrl);
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
