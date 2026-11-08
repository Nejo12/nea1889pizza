import {z} from 'zod';
import {database,staffFromRequest} from '@/lib/staff';
import {checkRequestOrigin,readJsonBody} from '@/lib/request-security';
import {Booking,nextBookingRevision,updateBooking} from '@/lib/booking-store';
import {blockSchema,statusSchema,reservationSchema,isRealDate} from '@/lib/reservation-rules';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
function invalidBody(reason:'media_type'|'too_large'|'malformed'){
 return reply({error:reason==='too_large'?'Anfrage zu groß.':'Ungültige JSON-Anfrage.'},reason==='too_large'?413:reason==='media_type'?415:400);
}
// Server-side gate for every operation: 401 anonymous/expired session, 403 signed in but not an active staff member.
// Cookie sessions are ambient credentials, so state-changing calls must also come from a trusted origin.
async function deny(req:Request,mutating:boolean){
 if(mutating&&checkRequestOrigin(req)!=='ok')return reply({error:'Anfrage nicht erlaubt.'},403);
 const v=await staffFromRequest(req);
 if(v.ok)return null;
 return reply({error:v.status===401?'Sitzung abgelaufen. Bitte erneut anmelden.':v.status===403?'Dieses Konto ist nicht für Reservierungen freigegeben.':'Login derzeit nicht verfügbar.'},v.status);
}
export async function GET(req:Request){
 const denied=await deny(req,false);if(denied)return denied;
 // Require a day so staff browsers never download unrelated historical guest PII.
 const dates=new URL(req.url).searchParams.getAll('date');
 if(dates.length!==1||!isRealDate(dates[0]!))return reply({error:'Bitte einen gültigen Tag auswählen.'},400);
 try{
  const db=database();
  const [rows,blocked]=await Promise.all([
   db.prepare('SELECT id,name,email,phone,date,time,guests,notes,status,table_ids,duration,created,updated FROM bookings WHERE date=? ORDER BY time,id').bind(dates[0]!).all(),
   // Keep blocked-day calendar information available to the staff creation form; it has no guest PII.
   db.prepare("SELECT date FROM blocked_days WHERE owner='nea-1889'").all()
  ]);
  return reply({reservations:rows.results,blocked:blocked.results});
 }catch{return reply({error:'Daten konnten nicht geladen werden.'},503)}
}
export async function POST(req:Request){const denied=await deny(req,true);if(denied)return denied;try{const body=await readJsonBody(req);if(!body.ok)return invalidBody(body.reason);const parsed=reservationSchema().safeParse(body.value);if(!parsed.success)return reply({error:'Bitte Angaben und Termin prüfen.'},400);const d=parsed.data;const now=new Date().toISOString();await database().prepare("INSERT INTO bookings (id,token_hash,name,email,phone,date,time,guests,notes,status,table_ids,duration,created,updated) VALUES (?,?,?,?,?,?,?,?,?,'pending','[]',75,?,?) ON CONFLICT(id) DO NOTHING").bind(d.requestId,'staff:'+crypto.randomUUID(),d.name,d.email,d.phone,d.date,d.time,d.guests,d.notes,now,now).run();const b=await database().prepare('SELECT * FROM bookings WHERE id=?').bind(d.requestId).first<Booking>();return reply(b,201)}catch{return reply({error:'Speichern nicht bestätigt. Bitte neu laden.'},503)}}
export async function PATCH(req:Request){const denied=await deny(req,true);if(denied)return denied;try{const body=await readJsonBody(req);if(!body.ok)return invalidBody(body.reason);const raw=body.value;const edit=z.object({action:z.literal('edit'),id:z.string().uuid(),expectedUpdated:z.string().min(1).max(64),expectedStatus:statusSchema.shape.status}).safeParse(raw);if(edit.success){const data=reservationSchema().safeParse({...raw as Record<string,unknown>,requestId:edit.data.id});if(!data.success)return reply({error:'Bitte Angaben und neuen Termin prüfen.'},400);const d=data.data;const db=database();
 const columns=['name','email','phone','date','time','guests','notes','status','table_ids','updated'] as const;
 const existing=await db.prepare('SELECT '+columns.join(',')+' FROM bookings WHERE id=?').bind(edit.data.id).first<Pick<Booking,(typeof columns)[number]>>();
 if(!existing)return reply({error:'Reservierung nicht gefunden.'},404);
 if(existing.updated!==edit.data.expectedUpdated||existing.status!==edit.data.expectedStatus)return reply({error:'Die Reservierung wurde zwischenzeitlich geändert. Bitte neu laden und prüfen.'},409);
 // Guard both statements with the snapshot. An old edit must not release a newer table allocation.
 // Every application write is serialized by the database adapter's transaction-level advisory lock.
 const unchanged=columns.map(column=>column+'=?').join(' AND ');
 const snapshot=columns.map(column=>existing[column]);
 const results=await db.batch([
  db.prepare('DELETE FROM occupancy WHERE booking_id=? AND EXISTS (SELECT 1 FROM bookings WHERE id=? AND '+unchanged+')').bind(edit.data.id,edit.data.id,...snapshot),
  db.prepare("UPDATE bookings SET name=?,email=?,phone=?,date=?,time=?,guests=?,notes=?,status='pending',table_ids='[]',updated=? WHERE id=? AND "+unchanged).bind(d.name,d.email,d.phone,d.date,d.time,d.guests,d.notes,nextBookingRevision(existing.updated),edit.data.id,...snapshot)
 ]);
 if(!results[1]?.meta.changes)return reply({error:'Die Reservierung wurde zwischenzeitlich geändert. Bitte neu laden und prüfen.'},409);
 return reply({ok:true})}const b=blockSchema.safeParse(raw);if(b.success){const db=database();const id='nea-1889:'+b.data.date;if(b.data.action==='block')await db.prepare("INSERT INTO blocked_days(id,owner,date) VALUES (?,'nea-1889',?) ON CONFLICT(id) DO NOTHING").bind(id,b.data.date).run();else await db.prepare("DELETE FROM blocked_days WHERE id=? AND owner='nea-1889'").bind(id).run();return reply({ok:true})}const p=statusSchema.extend({tableIds:z.array(z.string()).max(20).default([]),expectedUpdated:z.string().min(1).max(64),expectedStatus:statusSchema.shape.status}).safeParse(raw);if(!p.success)return reply({error:'Ungültige Angaben.'},400);await updateBooking(p.data.id,p.data.status,p.data.tableIds,{updated:p.data.expectedUpdated,status:p.data.expectedStatus});return reply({ok:true})}catch(e){return reply({error:e instanceof Error?e.message:'Änderung fehlgeschlagen.'},409)}}
