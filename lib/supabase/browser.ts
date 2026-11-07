'use client';
import {createBrowserClient} from '@supabase/ssr';
// Public (publishable) key only. Authorization is enforced server-side via nea.staff_members.
export function browserClient(url:string,key:string){return createBrowserClient(url,key);}
