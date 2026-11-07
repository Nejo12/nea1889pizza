import {z} from 'zod';
import {database} from '@/lib/staff';
import {notifyReservation,emailsEnabled} from '@/lib/email';
import {hashToken,publicBooking,Booking} from '@/lib/booking-store';
import {checkRequestOrigin,readJsonBody} from '@/lib/request-security';
import {reservationSchema,BOOKING_ERRORS,BookingErrorCode} from '@/lib/reservation-rules';
export const dynamic='force-dynamic';
const guest=(b:Booking)=>({...publicBooking(b),...(emailsEnabled()?{emailNotifications:true}:{})});
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const fail=(code:BookingErrorCode,status:number=BOOKING_ERRORS[code].status)=>reply({error:BOOKING_ERRORS[code].message,code},status);
const guardOrigin=(req:Request)=>{const v=checkRequestOrigin(req);return v==='ok'?null:v==='misconfigured'?fail('unavailable'):fail('forbidden_origin')};
const tokenSchema=z.string().regex(/^[a-f0-9]{64}$/);
async function authorized(req:Request){const token=tokenSchema.safeParse(req.headers.get('X-Booking-Token'));if(!token.success)return null;return database().prepare('SELECT * FROM bookings WHERE token_hash=?').bind(await hashToken(token.data)).first<Booking>();}
export async function GET(req:Request){try{const b=await authorized(req);return b?reply(guest(b)):fail('not_found')}catch{return fail('unavailable')}}
export async function POST(req:Request){
 try{
  const blocked=guardOrigin(req);if(blocked)return blocked;
  const body=await readJsonBody(req);
  if(!body.ok)return body.reason==='too_large'?fail('too_large'):fail('invalid_request',body.reason==='media_type'?415:400);
  const raw=body.value as Record<string,unknown>;
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw['website'])return fail('invalid_request');
  const key=z.object({requestId:z.string().uuid(),token:tokenSchema}).safeParse(raw);if(!key.success)return fail('reopen_form');
  const db=database();const digest=await hashToken(key.data.token);
  const existing=await db.prepare('SELECT * FROM bookings WHERE id=?').bind(key.data.requestId).first<Booking>();
  if(existing)return existing.token_hash===digest?reply(guest(existing)):fail('reopen_form',409);
  const parsed=reservationSchema().safeParse(raw);if(!parsed.success||raw['accepted']!==true)return fail('invalid_details');
  const d=parsed.data;
  const now=new Date().toISOString(),since=new Date(Date.now()-86400000).toISOString();
  // One statement decides both guards and inserts, so there is no read-then-insert gap: db.run() executes inside a
  // transaction holding the schema-wide advisory lock (lib/database.ts), which serializes every writer, across
  // application instances, and the statement's snapshot is taken after the lock. The row is inserted only while the
  // date is open AND fewer than 5 pending requests exist for the same email (case-insensitive) in the last 24 hours.
  // An email address is not proof of identity: anyone can submit another person's address, so this limits abuse, not impersonation.
  const inserted=await db.prepare("INSERT INTO bookings (id,token_hash,name,email,phone,date,time,guests,notes,status,table_ids,duration,created,updated) SELECT ?,?,?,?,?,?,?,?,?,'pending','[]',75,?,? WHERE NOT EXISTS (SELECT 1 FROM blocked_days WHERE owner='nea-1889' AND date=?) AND (SELECT COUNT(*) FROM bookings WHERE lower(email)=lower(?) AND created>? AND status='pending')<5 ON CONFLICT(id) DO NOTHING").bind(d.requestId,digest,d.name,d.email,d.phone,d.date,d.time,d.guests,d.notes,now,now,d.date,d.email,since).run();
  const saved=await db.prepare('SELECT * FROM bookings WHERE id=?').bind(d.requestId).first<Booking>();
  if(!saved){const closed=await db.prepare("SELECT 1 AS x FROM blocked_days WHERE owner='nea-1889' AND date=?").bind(d.date).first();return closed?fail('day_closed'):fail('too_many_pending')}
  if(saved.token_hash!==digest)return fail('reopen_form',409);
  if(inserted.meta.changes)await notifyReservation('pending',saved,`${req.headers.get('Origin')}/reservation#${key.data.token}`);
  return reply(guest(saved),inserted.meta.changes?201:200);
 }catch{return fail('save_failed')}
}
export async function PATCH(req:Request){const blocked=guardOrigin(req);if(blocked)return blocked;try{const b=await authorized(req);if(!b)return fail('not_found');const db=database();
 const commands=[db.prepare("DELETE FROM occupancy WHERE booking_id=? AND EXISTS(SELECT 1 FROM bookings WHERE id=? AND status IN ('pending','confirmed'))").bind(b.id,b.id),db.prepare("UPDATE bookings SET status='cancelled',table_ids='[]',updated=? WHERE id=? AND status IN ('pending','confirmed')").bind(new Date().toISOString(),b.id)];await db.batch(commands);
 const saved=await db.prepare('SELECT * FROM bookings WHERE id=?').bind(b.id).first<Booking>();if(saved?.status!=='cancelled')return fail('cannot_modify');if(b.status!=='cancelled')await notifyReservation('cancelled',saved);return reply(guest(saved));
 }catch{return fail('cancel_failed')}}
