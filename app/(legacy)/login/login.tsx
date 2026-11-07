'use client';
import {useCallback,useEffect,useMemo,useState,type FormEvent} from 'react';
import {browserClient} from '@/lib/supabase/browser';
import {StaffFetchContext,type StaffFetch} from './auth-fetch';
import Manager from '../admin/manager';
type Session={email:string;role:'admin'|'staff'};
type Props={supabaseUrl:string;supabaseKey:string;dashboard?:boolean};
export default function Login({supabaseUrl,supabaseKey,dashboard=false}:Props){
 const supabase=useMemo(()=>browserClient(supabaseUrl,supabaseKey),[supabaseUrl,supabaseKey]);
 const [session,setSession]=useState<Session|null>(null),[checking,setChecking]=useState(true),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const params=typeof window==='undefined'?null:new URLSearchParams(window.location.search);
 const [notice,setNotice]=useState(params?.get('expired')?'Sitzung abgelaufen. Bitte erneut anmelden.':'');
 // Server check: signed in AND an active staff member. Distinguishes expired (401) from unauthorized (403).
 const verify=useCallback(async()=>{
  setChecking(true);
  try{
   const r=await fetch('/api/staff/session',{cache:'no-store'});const d=await r.json() as Session&{error?:string};
   if(r.ok){setSession(d);setError('');return}
   setSession(null);
   if(r.status===403){setError(d.error||'Zugriff verweigert.');await supabase.auth.signOut();}
   else if(r.status!==401)setError(d.error||'Login derzeit nicht verfügbar.');
  }catch{setSession(null);setError('Login derzeit nicht verfügbar.');}finally{setChecking(false);}
 },[supabase]);
 useEffect(()=>{verify()},[verify]);
 // 401 from any dashboard call means the session expired: drop to the login form with a message.
 const request=useCallback<StaffFetch>(async(url,init)=>{
  if(!url.startsWith('/api/')||url.startsWith('//'))throw Error('Invalid API destination');
  const r=await fetch(url,{...init,cache:'no-store',credentials:'same-origin'});
  if(r.status===401){setSession(null);setNotice('Sitzung abgelaufen. Bitte erneut anmelden.');}
  return r;
 },[]);
 async function signIn(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setError('');setNotice('');
  const f=new FormData(e.currentTarget);
  const {error:err}=await supabase.auth.signInWithPassword({email:String(f.get('email')||'').trim(),password:String(f.get('password')||'')});
  if(err){setBusy(false);setError(err.status&&err.status>=500?'Login derzeit nicht verfügbar.':'E-Mail oder Passwort ist falsch.');return}
  await verify();setBusy(false);
 }
 async function signOut(){await supabase.auth.signOut();setSession(null);setError('');setNotice('');if(dashboard)window.location.assign('/login');}
 if(session&&dashboard)return <StaffFetchContext.Provider value={request}><div className="staff-account"><span>{session.email} · {session.role==='admin'?'Admin':'Team'}</span><button className="copy-link" onClick={signOut}>Abmelden</button></div><Manager/></StaffFetchContext.Provider>;
 return <main className="login-shell"><a href="/"><img src="/nea-logo.png" alt="NEA 1889" width="80" height="80"/></a><h1>Restaurant-Login</h1><p>Dein persönlicher Zugang zu NEA 1889.</p>
  {checking?<p>Zugang wird geprüft…</p>:session?<><p>Angemeldet als {session.email}.</p><a className="primary" href="/admin">Reservierungen öffnen →</a><button className="copy-link" onClick={signOut}>Abmelden</button></>:
  <form onSubmit={signIn}><label>E-Mail<input name="email" type="email" autoComplete="username" required/></label><label>Passwort<input name="password" type="password" autoComplete="current-password" required/></label><button className="primary" disabled={busy}>{busy?'Anmeldung…':'Anmelden'}</button><p className="form-note">Nur freigegebene Restaurantkonten erhalten Zugang zu Reservierungen.</p></form>}
  {notice&&<p role="status">{notice}</p>}{error&&<p role="alert" className="error">{error}</p>}<a href="/">Zur Tischanfrage</a></main>;
}
