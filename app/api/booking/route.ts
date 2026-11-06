import {z} from 'zod';
import {database} from '@/lib/staff';
import {hashToken,publicBooking,Booking} from '@/lib/booking-store';
import {reservationSchema,BOOKING_ERRORS,BookingErrorCode} from '@/lib/reservation-rules';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const fail=(code:BookingErrorCode,status:number=BOOKING_ERRORS[code].status)=>reply({error:BOOKING_ERRORS[code].message,code},status);
const tokenSchema=z.string().regex(/^[a-f0-9]{64}$/);
async function authorized(req:Request){const token=tokenSchema.safeParse(req.headers.get('X-Booking-Token'));if(!token.success)return null;return database().prepare('SELECT * FROM bookings WHERE token_hash=?').bind(await hashToken(token.data)).first<Booking>();}
export async function GET(req:Request){try{const b=await authorized(req);return b?reply(publicBooking(b)):fail('not_found')}catch{return fail('unavailable')}}
export async function POST(req:Request){
 try{
  if(Number(req.headers.get('content-length')||0)>12000)return fail('too_large');
  const raw=await req.json() as Record<string,unknown>;
  if(!raw||typeof raw!=='object'||raw['website'])return fail('invalid_request');
  const key=z.object({requestId:z.string().uuid(),token:tokenSchema}).safeParse(raw);if(!key.success)return fail('reopen_form');
  const db=database();const digest=await hashToken(key.data.token);
  const existing=await db.prepare('SELECT * FROM bookings WHERE id=?').bind(key.data.requestId).first<Booking>();
  if(existing)return existing.token_hash===digest?reply(publicBooking(existing)):fail('reopen_form',409);
  const parsed=reservationSchema().safeParse(raw);if(!parsed.success||raw['accepted']!==true)return fail('invalid_details');
  const d=parsed.data;
  const limit=await db.prepare("SELECT COUNT(*) AS n FROM bookings WHERE email=? AND created>? AND status='pending'").bind(d.email,new Date(Date.now()-86400000).toISOString()).first<{n:number}>();
  if(limit&&limit.n>=5)return fail('too_many_pending');
  const now=new Date().toISOString();
  // Insert only while the date is open, within the same SQL statement.
  const inserted=await db.prepare("INSERT INTO bookings (id,token_hash,name,email,phone,date,time,guests,notes,status,table_ids,duration,created,updated) SELECT ?,?,?,?,?,?,?,?,?,'pending','[]',75,?,? WHERE NOT EXISTS (SELECT 1 FROM blocked_days WHERE owner='nea-1889' AND date=?) ON CONFLICT(id) DO NOTHING").bind(d.requestId,digest,d.name,d.email,d.phone,d.date,d.time,d.guests,d.notes,now,now,d.date).run();
  const saved=await db.prepare('SELECT * FROM bookings WHERE id=?').bind(d.requestId).first<Booking>();
  if(!saved)return fail('day_closed');
  if(saved.token_hash!==digest)return fail('reopen_form',409);
  return reply(publicBooking(saved),inserted.meta.changes?201:200);
 }catch{return fail('save_failed')}
}
export async function PATCH(req:Request){try{const b=await authorized(req);if(!b)return fail('not_found');const db=database();
 const commands=[db.prepare("DELETE FROM occupancy WHERE booking_id=? AND EXISTS(SELECT 1 FROM bookings WHERE id=? AND status IN ('pending','confirmed'))").bind(b.id,b.id),db.prepare("UPDATE bookings SET status='cancelled',table_ids='[]',updated=? WHERE id=? AND status IN ('pending','confirmed')").bind(new Date().toISOString(),b.id)];await db.batch(commands);
 const saved=await db.prepare('SELECT * FROM bookings WHERE id=?').bind(b.id).first<Booking>();if(saved?.status!=='cancelled')return fail('cannot_modify');return reply(publicBooking(saved));
 }catch{return fail('cancel_failed')}}
