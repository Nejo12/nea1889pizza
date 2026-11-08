import {database} from './staff';
import {notifyReservation} from './email';
import {restaurantTables,maxTableMinutes,slotsForDate,isFutureSlot} from './reservation-rules';
export type Booking={id:string;token_hash:string;name:string;email:string;phone:string;date:string;time:string;guests:number;notes:string;status:string;table_ids:string;duration:number;created:string;updated:string};
// Always advance the browser-visible revision, including successive writes in the same millisecond.
export function nextBookingRevision(previous:string,now=Date.now()){
 const previousMs=Date.parse(previous);
 return new Date(Math.max(now,Number.isFinite(previousMs)?previousMs+1:now)).toISOString();
}
export async function hashToken(token:string){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('');}
export function publicBooking(b:Booking){return {id:b.id,name:b.name,date:b.date,time:b.time,guests:b.guests,status:b.status,duration:b.duration,updated:b.updated};}
export function slotKeys(date:string,time:string,tables:string[]){const start=Number(time.slice(0,2))*60+Number(time.slice(3));return tables.flatMap(tableId=>Array.from({length:maxTableMinutes/15},(_,i)=>({id:`${date}:${tableId}:${start+i*15}`,tableId,date,minute:start+i*15})));}
export type SlotStatus='available'|'full'|'past'|'closed';
// Read-only and ADVISORY. Mirrors updateBooking's rules (same occupancy keys, tables are combined by summing seats) without
// holding or writing anything: pending requests occupy nothing, and only confirmation can actually claim tables.
export async function availabilityFor(date:string,guests:number,now=new Date()):Promise<{time:string;status:SlotStatus}[]>{
 const db=database();
 const closed=!!await db.prepare("SELECT 1 AS x FROM blocked_days WHERE owner='nea-1889' AND date=?").bind(date).first();
 const taken=new Set((await db.prepare('SELECT table_id,minute FROM occupancy WHERE date=?').bind(date).all()).results.map(r=>`${r['table_id']}:${r['minute']}`));
 return slotsForDate(date).map(time=>{
  if(!isFutureSlot(date,time,now))return {time,status:'past' as const};
  if(closed)return {time,status:'closed' as const};
  const seats=restaurantTables.filter(t=>slotKeys(date,time,[t.name]).every(k=>!taken.has(`${k.tableId}:${k.minute}`))).reduce((n,t)=>n+t.seats,0);
  return {time,status:seats>=guests?'available' as const:'full' as const};
 });
}
// UI changes carry the revision originally shown to staff; internal callers can omit it.
export async function updateBooking(id:string,status:string,tableIds:string[],expected?:{updated:string;status:string}){
 const db=database();const b=await db.prepare('SELECT * FROM bookings WHERE id=?').bind(id).first<Booking>();if(!b)throw Error('Reservierung nicht gefunden.');
 if(expected&&(b.updated!==expected.updated||b.status!==expected.status))throw Error('Die Reservierung wurde zwischenzeitlich geändert. Bitte neu laden und prüfen.');
 const occupied=['confirmed','arrived'].includes(status);
 const valid=[...new Set(tableIds)];
 if(occupied){if(!valid.length||valid.some(id=>!restaurantTables.some(t=>t.name===id)))throw Error('Bitte gültige Tische auswählen.');const seats=valid.reduce((n,id)=>n+restaurantTables.find(t=>t.name===id)!.seats,0);if(seats<b.guests)throw Error('Die ausgewählten Tische haben zu wenige Plätze.');}
 // Every statement is guarded by the booking state that was validated above. If staff edited or
 // cancelled the booking in the meantime, nothing is written and the stale change is rejected.
 const unchanged="EXISTS (SELECT 1 FROM bookings WHERE id=? AND status=? AND date=? AND time=? AND guests=? AND updated=?)";
 const state=[id,b.status,b.date,b.time,b.guests,b.updated] as const;
 const commands=[db.prepare('DELETE FROM occupancy WHERE booking_id=? AND '+unchanged).bind(id,...state)];
 if(occupied)for(const slot of slotKeys(b.date,b.time,valid))commands.push(db.prepare('INSERT INTO occupancy (id,booking_id,table_id,date,minute) SELECT ?,?,?,?,? WHERE '+unchanged).bind(slot.id,id,slot.tableId,slot.date,slot.minute,...state));
 commands.push(db.prepare('UPDATE bookings SET status=?,table_ids=?,updated=? WHERE id=? AND status=? AND date=? AND time=? AND guests=? AND updated=?').bind(status,JSON.stringify(occupied?valid:[]),nextBookingRevision(b.updated),id,b.status,b.date,b.time,b.guests,b.updated));
 // PostgreSQL transaction is atomic; unique occupancy keys reject overlapping confirmations.
 let results;
 try{results=await db.batch(commands)}catch{throw Error('Änderung nicht gespeichert. Ein Tisch ist möglicherweise bereits belegt. Bitte neu laden und prüfen.');}
 if(!results.at(-1)?.meta.changes)throw Error('Die Reservierung wurde zwischenzeitlich geändert. Bitte neu laden und prüfen.');
 // Only after the change is committed, and only on a real transition: re-saving the same status sends nothing.
 if(status!==b.status&&(status==='confirmed'||status==='cancelled'))await notifyReservation(status,b);
}
