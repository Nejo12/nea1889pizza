import {createServerClient} from '@supabase/ssr';
import {NextResponse,type NextRequest} from 'next/server';
// Session refresh only. Authorization is enforced by the server routes (lib/staff.ts), never by this proxy.
export async function proxy(request:NextRequest){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 let response=NextResponse.next({request});
 if(!url||!key)return response;
 const supabase=createServerClient(url,key,{cookies:{getAll:()=>request.cookies.getAll(),setAll:(cookies,headers)=>{
  cookies.forEach(({name,value})=>request.cookies.set(name,value));
  response=NextResponse.next({request});
  cookies.forEach(({name,value,options})=>response.cookies.set(name,value,options));
  Object.entries(headers).forEach(([k,v])=>response.headers.set(k,v));
 }}});
 try{await supabase.auth.getUser();}catch{}
 return response;
}
export const config={matcher:['/admin/:path*','/login','/api/reservations','/api/staff/:path*']};
