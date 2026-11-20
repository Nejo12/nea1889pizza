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
// A fixed, non-personal asset URL: never send guest data or booking tokens to image hosts.
const PATTERN='https://nea1889.pizza/email/rm-background-0e7d40b0.jpg';
function layout(kind:EmailKind,b:MailBooking,subject:string,statusUrl?:string){
 const [title,lead]=HEAD[kind],badge=BADGE[kind],date=esc(berlinDate(b.date));
 const row=(k:string,v:string)=>`<tr><th scope="row" width="30%" align="left" valign="top" style="padding:14px 16px;border-bottom:1px solid #443724;font-family:${SANS};font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:${C.ochre}">${k}</th><td style="padding:12px 16px;border-bottom:1px solid #443724;font-family:${SERIF};font-size:20px;line-height:1.4;color:${C.plaster}">${v}</td></tr>`;
 const link=kind==='pending'&&statusUrl?`<tr><td class="email-pad" style="padding:0 32px 24px"><table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr><td bgcolor="${C.blood}" align="center" style="border:1px solid ${C.ochre};border-radius:4px"><a href="${esc(statusUrl)}" style="display:block;padding:16px 20px;font-family:${SANS};font-size:13px;line-height:20px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${C.plaster};text-decoration:none">Status &amp; Reservierung öffnen&nbsp; →</a></td></tr></table><p style="margin:14px 0 6px;font-family:${SANS};font-size:12px;line-height:1.6;color:${C.muted}">Dein persönlicher Link zum Status und zur Stornierung. Bitte bewahre ihn auf und teile ihn nicht: Wer ihn hat, kann die Reservierung ansehen und stornieren.</p><p style="margin:0;font-family:${SANS};font-size:11px;line-height:1.6;word-break:break-all;overflow-wrap:anywhere"><a href="${esc(statusUrl)}" style="color:${C.ochre};text-decoration:underline">${esc(statusUrl)}</a></p></td></tr>`:'';
 const closing=kind==='cancelled'?'Bis zum nächsten Mal.':kind==='confirmed'?'A presto. Wir freuen uns auf dich.':'Grazie. Wir melden uns persönlich.';
 return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark"><title>${esc(subject)}</title>
<style>body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}table{border-collapse:collapse}a{color:${C.ochre}}@media only screen and (max-width:480px){.email-outer{padding:12px 8px!important}.email-pad{padding-left:20px!important;padding-right:20px!important}.email-wordmark{font-size:34px!important;letter-spacing:4px!important}.email-title{font-size:29px!important}.email-hero{padding:28px 20px!important}}</style></head>
<body bgcolor="${C.soot}" style="margin:0;padding:0;background-color:${C.soot}"><div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.soot};mso-hide:all">${esc(title)}. ${date}, ${esc(b.time)} Uhr – ${b.guests} Personen.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${C.soot}"><tr><td class="email-outer" align="center" style="padding:24px 12px">
<!--[if mso]><table role="presentation" align="center" width="600"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${C.card}" style="width:100%;max-width:600px;border:1px solid #6C512E;background-color:${C.card}">
<tr><td class="email-hero" background="${PATTERN}" bgcolor="#500F12" align="center" style="padding:32px;background-color:#500F12;background-image:url('${PATTERN}');background-position:center;background-size:cover;border-bottom:2px solid ${C.ochre}">
<p style="margin:0 0 10px;font-family:${SANS};font-size:10px;line-height:1.5;letter-spacing:3px;text-transform:uppercase;color:${C.plaster}">Pizzeria Napoletana · Berlin</p>
<p class="email-wordmark" style="margin:0;font-family:${DISPLAY};font-size:42px;line-height:1.2;letter-spacing:6px;color:${C.plaster}">NEA <span style="color:${C.ochre}">1889</span></p>
<p style="margin:10px 0 0;font-family:${SERIF};font-style:italic;font-size:18px;line-height:1.4;color:${C.plaster}">Naples at heart. Berlin by choice.</p></td></tr>
<tr><td class="email-pad" style="padding:28px 32px 0"><span style="display:inline-block;padding:8px 12px;background-color:${badge.bg};border:1px solid ${badge.border};border-radius:3px;font-family:${SANS};font-size:10px;line-height:1.5;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:${badge.fg}">${badge.label}</span>
<h1 class="email-title" style="margin:18px 0 0;font-family:${DISPLAY};font-weight:400;font-size:32px;line-height:1.2;letter-spacing:-0.4px;color:${C.plaster}">${esc(title)}</h1>
<p style="margin:20px 0 5px;font-family:${SERIF};font-size:22px;line-height:1.4;color:${C.plaster}">Ciao ${esc(b.name)},</p>
<p style="margin:0;font-family:${SANS};font-size:15px;line-height:1.7;color:${C.muted}">${esc(lead)}</p></td></tr>
<tr><td class="email-pad" style="padding:24px 32px"><table aria-label="Reservierungsdetails" width="100%" cellpadding="0" cellspacing="0" bgcolor="#211B12" style="border:1px solid #443724;background-color:#211B12">${row('Datum',date)}${row('Uhrzeit',`${esc(b.time)} Uhr <span style="font-family:${SANS};font-size:12px;color:${C.muted}">(Berlin)</span>`)}${row('Personen',String(b.guests))}</table></td></tr>
${link}
<tr><td class="email-pad" style="padding:0 32px 26px"><p style="margin:0;font-family:${SERIF};font-size:20px;line-height:1.4;font-style:italic;color:${C.ochre}">${closing}</p></td></tr>
<tr><td class="email-pad" bgcolor="#11100B" style="padding:20px 32px;border-top:1px solid #443724"><p style="margin:0;font-family:${SANS};font-size:11px;line-height:1.8;color:${C.muted}"><strong style="font-weight:600;color:${C.plaster}">NEA 1889</strong> · Zimmerstraße 26/27 · 10969 Berlin-Kreuzberg</p><p style="margin:8px 0 0;font-family:${DISPLAY};font-size:10px;line-height:1.5;letter-spacing:3px;color:${C.ochre}">Berlin – Napoli – Sempre</p></td></tr>
</table><!--[if mso]></td></tr></table><![endif]-->
</td></tr></table></body></html>`;
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

 lines.push('','NEA 1889');
 const html=layout(kind,b,subject,statusUrl);
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
