import {database} from './staff';
import {restaurantTables,maxTableMinutes,slotsForDate} from './reservation-rules';
export type Booking={id:string;token_hash:string;name:string;email:string;phone:string;date:string;time:string;guests:number;notes:string;status:string;table_ids:string;duration:number;created:string;updated:string};
export type SlotAvailability={time:string;requestable:boolean;remainingSeats:number};
export type DateAvailability={date:string;blocked:boolean;slots:SlotAvailability[]};
export async function hashToken(token:string){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('');}
export function publicBooking(b:Booking){return {id:b.id,name:b.name,date:b.date,time:b.time,guests:b.guests,status:b.status,duration:b.duration,updated:b.updated};}
export function slotMinutes(time:string){const start=Number(time.slice(0,2))*60+Number(time.slice(3));return Array.from({length:maxTableMinutes/15},(_,i)=>start+i*15);}
export function slotKeys(date:string,time:string,tables:string[]){return tables.flatMap(tableId=>slotMinutes(time).map(minute=>({id:`${date}:${tableId}:${minute}`,tableId,date,minute})));}
export async function availabilityForDate(date:string,guests:number):Promise<DateAvailability>{
 const db=database();
 const blocked=await db.prepare("SELECT date FROM blocked_days WHERE owner='nea-1889' AND date=?").bind(date).first<{date:string}>();
 if(blocked)return {date,blocked:true,slots:slotsForDate(date).map(time=>({time,requestable:false,remainingSeats:0}))};
 const rows=await db.prepare('SELECT table_id,minute FROM occupancy WHERE date=?').bind(date).all();
 const occupancy=(rows.results||[]) as {table_id:string;minute:number}[];
 return {date,blocked:false,slots:slotsForDate(date).map(time=>{
  const minutes=new Set(slotMinutes(time));
  const occupied=new Set(occupancy.filter(row=>minutes.has(Number(row.minute))).map(row=>row.table_id));
  const remainingSeats=restaurantTables.filter(table=>!occupied.has(table.name)).reduce((sum,table)=>sum+table.seats,0);
  return {time,requestable:remainingSeats>=guests,remainingSeats};
 })};
}
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
