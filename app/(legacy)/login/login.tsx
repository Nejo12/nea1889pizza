'use client';
import {useCallback,useEffect,useMemo,useState,type FormEvent} from 'react';
import {browserClient} from '@/lib/supabase/browser';
import {isValidStaffOtp,normalizeStaffEmail,STAFF_OTP_LENGTH,STAFF_OTP_RESEND_SECONDS} from '@/lib/otp-staff';
import {StaffFetchContext,type StaffFetch} from './auth-fetch';
import Manager from '../admin/manager';

type Session={email:string;role:'admin'|'staff'};
type Props={supabaseUrl:string;supabaseKey:string;dashboard?:boolean};

export default function Login({supabaseUrl,supabaseKey,dashboard=false}:Props){
 const supabase=useMemo(()=>browserClient(supabaseUrl,supabaseKey),[supabaseUrl,supabaseKey]);
 const [session,setSession]=useState<Session|null>(null),[checking,setChecking]=useState(true);
 const [error,setError]=useState(''),[busy,setBusy]=useState(false);
 const [email,setEmail]=useState(''),[pendingEmail,setPendingEmail]=useState(''),[code,setCode]=useState('');
 const [resendSeconds,setResendSeconds]=useState(0);
 const params=typeof window==='undefined'?null:new URLSearchParams(window.location.search);
 const [notice,setNotice]=useState(params?.get('expired')?'Sitzung abgelaufen. Bitte erneut anmelden.':'');

 // Server authorization is authoritative: Supabase Auth identity plus active nea.staff_members.
 const verify=useCallback(async()=>{
  setChecking(true);
  try{
   const r=await fetch('/api/staff/session',{cache:'no-store'});
   const d=await r.json() as Session&{error?:string};
   if(r.ok){setSession(d);setError('');return}
   setSession(null);
   if(r.status===403){setError(d.error||'Zugriff verweigert.');await supabase.auth.signOut();}
   else if(r.status!==401)setError(d.error||'Login derzeit nicht verfügbar.');
  }catch{setSession(null);setError('Login derzeit nicht verfügbar.');}
  finally{setChecking(false);}
 },[supabase]);
 useEffect(()=>{void verify()},[verify]);

 // Convenience timer only; Supabase enforces server-side OTP expiration and request limits.
 useEffect(()=>{
  if(resendSeconds===0)return;
  const timer=setTimeout(()=>setResendSeconds(seconds=>Math.max(0,seconds-1)),1000);
  return()=>clearTimeout(timer);
 },[resendSeconds]);

 const request=useCallback<StaffFetch>(async(url,init)=>{
  if(!url.startsWith('/api/')||url.startsWith('//'))throw Error('Invalid API destination');
  const r=await fetch(url,{...init,cache:'no-store',credentials:'same-origin'});
  if(r.status===401){setSession(null);setNotice('Sitzung abgelaufen. Bitte erneut anmelden.');}
  return r;
 },[]);

 async function sendCode(address:string){
  setBusy(true);setError('');setNotice('');
  try{
   const {error:err}=await supabase.auth.signInWithOtp({
    email:address,
    options:{shouldCreateUser:false},
   });
   // Do not reveal whether an address belongs to an approved staff account.
   // Only transport/server errors and request throttling interrupt the generic OTP screen.
   if(err&&(err.status===429||!err.status||err.status>=500)){
    setError(err.status===429?'Zu viele Anfragen. Bitte später erneut versuchen.':'Code konnte nicht gesendet werden. Bitte später erneut versuchen.');
    return;
   }
   setPendingEmail(address);setCode('');setResendSeconds(STAFF_OTP_RESEND_SECONDS);
   setNotice('Wenn dieses Konto freigegeben ist, wurde ein Anmeldecode per E-Mail gesendet.');
  }catch{setError('Code konnte nicht gesendet werden. Bitte später erneut versuchen.');}
  finally{setBusy(false);}
 }

 async function requestCode(e:FormEvent<HTMLFormElement>){
  e.preventDefault();
  const address=normalizeStaffEmail(email);
  if(!address)return;
  await sendCode(address);
 }

 async function confirmCode(e:FormEvent<HTMLFormElement>){
  e.preventDefault();
  if(!pendingEmail||!isValidStaffOtp(code)){
   setError('Bitte einen sechsstelligen Zahlencode eingeben.');
   return;
  }
  setBusy(true);setError('');setNotice('');
  try{
   const {error:err}=await supabase.auth.verifyOtp({email:pendingEmail,token:code,type:'email'});
   if(err){setError('Der Code ist ungültig oder abgelaufen. Bitte erneut versuchen.');return;}
   setCode('');
   await verify();
  }catch{setError('Anmeldung derzeit nicht verfügbar. Bitte erneut versuchen.');}
  finally{setBusy(false);}
 }

 async function signOut(){
  await supabase.auth.signOut();setSession(null);setError('');setNotice('');setPendingEmail('');setCode('');
  if(dashboard)window.location.assign('/login');
 }

 if(session&&dashboard)return <StaffFetchContext.Provider value={request}>
  <div className="staff-account"><span>{session.email} · {session.role==='admin'?'Admin':'Team'}</span><button className="copy-link" onClick={signOut}>Abmelden</button></div>
  <Manager/>
 </StaffFetchContext.Provider>;

 return <main className="login-shell">
  <a href="/"><img src="/nea-logo.png" alt="NEA 1889" width="80" height="80"/></a>
  <h1>Restaurant-Login</h1><p>Dein persönlicher Zugang zu NEA 1889.</p>
  {checking?<p>Zugang wird geprüft…</p>:session?
   <><p>Angemeldet als {session.email}.</p><a className="primary" href="/admin">Reservierungen öffnen →</a><button className="copy-link" onClick={signOut}>Abmelden</button></>:
   pendingEmail?
    <>
     <p>Gib den sechsstelligen Code ein, den wir an {pendingEmail} gesendet haben.</p>
     <form onSubmit={confirmCode}>
      <label>Anmeldecode
       <input name="otp" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={STAFF_OTP_LENGTH} value={code} onChange={e=>setCode(e.target.value.replace(/[^0-9]/g,'').slice(0,STAFF_OTP_LENGTH))} required/>
      </label>
      <button className="primary" disabled={busy||!isValidStaffOtp(code)}>{busy?'Prüfen…':'Code bestätigen'}</button>
     </form>
     <button className="copy-link" type="button" disabled={busy||resendSeconds>0} onClick={()=>void sendCode(pendingEmail)}>
      {resendSeconds>0?`Neuen Code in ${resendSeconds}s senden`:'Neuen Code senden'}
     </button>
     <button className="copy-link" type="button" disabled={busy} onClick={()=>{setPendingEmail('');setCode('');setError('');setNotice('');}}>
      Andere E-Mail-Adresse
     </button>
    </>:
    <form onSubmit={requestCode}>
     <label>E-Mail<input name="email" type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} required/></label>
     <button className="primary" disabled={busy}>{busy?'Senden…':'Anmeldecode senden'}</button>
     <p className="form-note">Kein Passwort nötig. Nur freigegebene Restaurantkonten erhalten Zugang zu Reservierungen.</p>
    </form>
  }
  {notice&&<p role="status">{notice}</p>}
  {error&&<p role="alert" className="error">{error}</p>}
  <a href="/">Zur Tischanfrage</a>
 </main>;
}
