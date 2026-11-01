import {z} from 'zod';
import {availabilityForDate} from '@/lib/booking-store';
import {isFutureSlot,isRealDate} from '@/lib/reservation-rules';
export const dynamic='force-dynamic';
const querySchema=z.object({date:z.string().refine(isRealDate),guests:z.coerce.number().int().min(1).max(12)});
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(req:Request){
 try{
  const url=new URL(req.url);
  const parsed=querySchema.safeParse({date:url.searchParams.get('date'),guests:url.searchParams.get('guests')});
  if(!parsed.success)return reply({error:'Bitte Datum und Personenzahl prüfen.'},400);
  const availability=await availabilityForDate(parsed.data.date,parsed.data.guests);
  return reply({date:availability.date,blocked:availability.blocked,slots:availability.slots.map(slot=>({time:slot.time,requestable:slot.requestable&&isFutureSlot(availability.date,slot.time)}))});
 }catch{return reply({error:'Verfügbarkeit konnte gerade nicht geprüft werden.'},503)}
}
