import {renderEmail,type EmailKind} from '@/lib/email';

// Fixed synthetic fixtures only. Never read reservations or send mail from this route.
// Fail closed outside Vercel Preview and local development, including every Production deployment.
export function GET(req:Request){
 if(process.env.VERCEL_ENV!=='preview'&&process.env.NODE_ENV!=='development')return new Response('Not found',{status:404});
 const kind=new URL(req.url).searchParams.get('kind')||'confirmed';
 if(!['pending','confirmed','cancelled'].includes(kind))return new Response('Not found',{status:404});
 const booking={id:'synthetic-email-preview',name:'Giulia — Designvorschau',email:'preview@example.invalid',date:'2099-11-02',time:'19:00',guests:2};
 const {html}=renderEmail(kind as EmailKind,booking,'https://example.invalid/reservation#synthetic-preview-not-a-booking');
 // Preview the asset from this exact deployment, before the production image is published.
 const preview=html.replaceAll('https://nea1889.pizza/email/rm-background-0e7d40b0.jpg','/email/rm-background-0e7d40b0.jpg');
 return new Response(preview,{headers:{
  'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow',
  'Content-Security-Policy':"default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  'Referrer-Policy':'no-referrer',
 }});
}
