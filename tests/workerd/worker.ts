// Test-only Cloudflare Worker entry. It mounts the REAL guest booking handlers and booking-store unchanged.
// The /probe/* routes exist only to let the test drive staff-side operations and privilege checks.
import * as guest from '../../app/api/booking/route';
import {updateBooking} from '../../lib/booking-store';
import {database} from '../../lib/database';
const json=(b:unknown,s=200)=>Response.json(b,{status:s});
export default {
 async fetch(req:Request){
  const url=new URL(req.url);
  if(url.pathname==='/api/booking'){
   if(req.method==='GET')return guest.GET(req);
   if(req.method==='POST')return guest.POST(req);
   if(req.method==='PATCH')return guest.PATCH(req);
   return new Response(null,{status:405});
  }
  if(url.pathname==='/probe/confirm'&&req.method==='POST'){
   const {id,tables}=await req.json() as {id:string;tables:string[]};
   try{await updateBooking(id,'confirmed',tables);return json({ok:true});}catch(e){return json({ok:false,error:(e as Error).message},409);}
  }
  if(url.pathname==='/probe/privileges'){
   const out:Record<string,string>={};
   for(const [k,sql] of Object.entries({ddl:'CREATE TABLE should_fail(x int)',legacy:'SELECT * FROM reservations',truncate:'TRUNCATE bookings',role:'CREATE ROLE nope'})){
    try{await database().prepare(sql).all();out[k]='allowed';}catch(e){out[k]='denied';}
   }
   const who=await database().prepare('SELECT current_user AS u, current_setting(\'search_path\') AS p').first<{u:string;p:string}>();
   return json({...out,user:who?.u,searchPath:who?.p});
  }
  if(url.pathname==='/probe/info'){
   const r=await database().prepare("SELECT current_user AS \"user\", current_setting('search_path') AS \"searchPath\", current_setting('statement_timeout') AS \"statementTimeout\"").first<Record<string,unknown>>();
   return json(r);
  }
  if(url.pathname==='/probe/sleep'){
   try{await database().prepare('SELECT pg_sleep(20)').all();return json({cancelled:false});}catch{return json({cancelled:true});}
  }
  if(url.pathname==='/probe/ping'){
   // Diagnostic only: the adapter deliberately hides driver errors from guests; this exposes the class/code, never the URL.
   try{const r=await database().prepare('SELECT 1 AS ok').first();return json({ok:true,r});}
   catch(e){const x=e as {name?:string;code?:string;message?:string};return json({ok:false,name:x.name,code:x.code,message:String(x.message).replace(/postgres(ql)?:\/\/\S+/g,'<url>')},500);}
  }
  if(url.pathname==='/probe/runtime')return json({ua:navigator.userAgent,hasProcessEnv:typeof process!=='undefined'&&!!process.env.DATABASE_URL});
  return new Response('not found',{status:404});
 }
};
