import {z} from 'zod';
import {availabilityFor} from '@/lib/booking-store';
import {isRealDate,BOOKING_ERRORS,BookingErrorCode} from '@/lib/reservation-rules';
export const dynamic='force-dynamic';
// Read-only and advisory: a slot reported "available" is NOT reserved. Submission and staff confirmation
// re-check every rule transactionally. Only per-slot status is returned: no counts, tables, guests or bookings.
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const fail=(code:BookingErrorCode)=>reply({error:BOOKING_ERRORS[code].message,code},BOOKING_ERRORS[code].status);
const query=z.object({date:z.string().refine(isRealDate),guests:z.string().regex(/^\d{1,2}$/).transform(Number).pipe(z.number().int().min(1).max(12))});
export async function GET(req:Request){
 const q=query.safeParse(Object.fromEntries(new URL(req.url).searchParams));
 if(!q.success)return fail('invalid_request');
 try{return reply({date:q.data.date,guests:q.data.guests,advisory:true,slots:await availabilityFor(q.data.date,q.data.guests)})}
 catch{return fail('unavailable')}
}
