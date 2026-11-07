import {createServerClient,parseCookieHeader} from '@supabase/ssr';
import {supabaseAuthConfig} from './supabase/config';
import {database} from './database';
export {database} from './database';
export type StaffMember={id:string;email:string;role:'admin'|'staff'};
export type StaffVerdict={ok:true;staff:StaffMember}|{ok:false;status:401|403|503};
// Identity comes from Supabase Auth (the Auth server validates the session cookie's token on every call);
// authorization comes from an ACTIVE row in nea.staff_members. A valid login alone grants nothing.
export async function staffFromRequest(req?:Request):Promise<StaffVerdict>{
 const config=supabaseAuthConfig();if(!config)return {ok:false,status:503};
 if(!req)return {ok:false,status:401};
 try{
  const supabase=createServerClient(config.url,config.key,{cookies:{getAll:()=>parseCookieHeader(req.headers.get('cookie')??'').map(c=>({name:c.name,value:c.value??''})),setAll:()=>{}}});
  const {data,error}=await supabase.auth.getUser();
  if(error||!data.user)return {ok:false,status:401};
  const row=await database().prepare('SELECT role FROM staff_members WHERE user_id=? AND active=true').bind(data.user.id).first<{role:'admin'|'staff'}>();
  if(!row)return {ok:false,status:403};
  return {ok:true,staff:{id:data.user.id,email:data.user.email??'',role:row.role}};
 }catch{return {ok:false,status:503};}
}
export async function isStaff(req?:Request){return (await staffFromRequest(req)).ok;}
