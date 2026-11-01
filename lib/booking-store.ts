import {database} from './staff';
import {restaurantTables,maxTableMinutes} from './reservation-rules';
export type Booking={id:string;token_hash:string;name:string;email:string;phone:string;date:string;time:string;guests:number;notes:string;status:string;table_ids:string;duration:number;created:string;updated:string};
export async function hashToken(token:string){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('');}
export function publicBooking(b:Booking){return {id:b.id,name:b.name,date:b.date,time:b.time,guests:b.guests,status:b.status,duration:b.duration,updated:b.updated};}
export function slotKeys(date:string,time:string,tables:string[]){const start=Number(time.slice(0,2))*60+Number(time.slice(3));return tables.flatMap(tableId=>Array.from({length:maxTableMinutes/15},(_,i)=>({id:`${date}:${tableId}:${start+i*15}`,tableId,date,minute:start+i*15})));}
export async function updateBooking(id:string,status:string,tableIds:string[]){
 const db=database();const b=await db.prepare('SELECT * FROM bookings WHERE id=?').bind(id).first<Booking>();if(!b)throw Error('Reservierung nicht gefunden.');
 const occupied=['confirmed','arrived'].includes(status);
 const valid=[...new Set(tableIds)];
 if(occupied){if(!valid.length||valid.some(id=>!restaurantTables.some(t=>t.name===id)))throw Error('Bitte gültige Tische auswählen.');const seats=valid.reduce((n,id)=>n+restaurantTables.find(t=>t.name===id)!.seats,0);if(seats<b.guests)throw Error('Die ausgewählten Tische haben zu wenige Plätze.');}
 const commands=[db.prepare('DELETE FROM occupancy WHERE booking_id=?').bind(id)];
 if(occupied)for(const slot of slotKeys(b.date,b.time,valid))commands.push(db.prepare('INSERT INTO occupancy (id,booking_id,table_id,date,minute) VALUES (?,?,?,?,?)').bind(slot.id,id,slot.tableId,slot.date,slot.minute));
 commands.push(db.prepare('UPDATE bookings SET status=?,table_ids=?,updated=? WHERE id=?').bind(status,JSON.stringify(occupied?valid:[]),new Date().toISOString(),id));
 // PostgreSQL transaction is atomic; unique occupancy keys reject overlapping confirmations.
 try{await db.batch(commands)}catch{throw Error('Änderung nicht gespeichert. Ein Tisch ist möglicherweise bereits belegt. Bitte neu laden und prüfen.');}
}
