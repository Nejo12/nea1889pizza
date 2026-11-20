import {z} from 'zod';
import {availabilityFor} from '@/lib/booking-store';
import {isRealDate,BOOKING_ERRORS,BookingErrorCode} from '@/lib/reservation-rules';
export const dynamic='force-dynamic';
// Read-only and advisory: a slot reported "available" is NOT reserved. Submission and staff confirmation
// re-check every rule transactionally. Only per-slot status is returned: no counts, tables, guests or bookings.
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const fail=(code:BookingErrorCode)=>reply({error:BOOKING_ERRORS[code].message,code},BOOKING_ERRORS[code].status);
const query=z.object({date:z.string().refine(isRealDate),guests:z.string().regex(/^\d{1,2}$/).transform(Number).pipe(z.number().int().min(1).max(12))});
// Never log the error object/message/stack: drivers may include credentials, hosts, SQL or bind values.
// Only these fixed codes leave the process. Unknown errors retain a useful marker without their contents.
const failureCategories:Record<string,string>={
 '28P01':'authentication','28000':'authentication','3D000':'database_missing',
 '3F000':'schema_missing','42P01':'relation_missing','42501':'permission_denied',
 '53300':'connection_limit','57P03':'database_unavailable','08001':'connection_failed',
 '08006':'connection_failed','ECONNREFUSED':'connection_refused','ENOTFOUND':'dns_failed',
 'EAI_AGAIN':'dns_failed','ETIMEDOUT':'connection_timeout','CONNECT_TIMEOUT':'connection_timeout',
 'CONNECTION_CLOSED':'connection_closed','CONNECTION_ENDED':'connection_closed',
 'ERR_INVALID_URL':'invalid_connection_config','ERR_INVALID_ARG_TYPE':'invalid_connection_config',
 'DEPTH_ZERO_SELF_SIGNED_CERT':'tls_failed','SELF_SIGNED_CERT_IN_CHAIN':'tls_failed',
 'UNABLE_TO_VERIFY_LEAF_SIGNATURE':'tls_failed','CERT_HAS_EXPIRED':'tls_failed',
};
function logFailure(error:unknown){
 const e=error as {code?:unknown;message?:unknown}|null;
 const code=typeof e?.code==='string'&&Object.hasOwn(failureCategories,e.code)?e.code:'UNKNOWN';
 const category=e?.message==='DATABASE_URL is missing.'?'database_url_missing':
  e?.message==='Set NEA_DATABASE_SCHEMA explicitly.'?'invalid_schema_config':failureCategories[code]||'unknown';
 console.error('reservation_availability_failed',{code,category});
}
export async function GET(req:Request){
 const q=query.safeParse(Object.fromEntries(new URL(req.url).searchParams));
 if(!q.success)return fail('invalid_request');
 try{return reply({date:q.data.date,guests:q.data.guests,advisory:true,slots:await availabilityFor(q.data.date,q.data.guests)})}
 catch(error){logFailure(error);return fail('unavailable')}
}
