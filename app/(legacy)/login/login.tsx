'use client';
import {ClerkProvider,SignIn,SignUp,useAuth,useClerk,UserButton} from '@clerk/react';
import {useCallback,useEffect,useState} from 'react';
import {StaffFetchContext,type StaffFetch} from './auth-fetch';
import Manager from '../admin/manager';
function Panel({dashboard}:{dashboard:boolean}){
 const {isLoaded,isSignedIn,getToken}=useAuth();const {signOut}=useClerk();
 const [state,setState]=useState<{email:string;active:boolean}|null>(null),[error,setError]=useState(''),[signup,setSignup]=useState(false);
 const request=useCallback<StaffFetch>(async(url,init)=>{if(!url.startsWith('/api/')||url.startsWith('//'))throw Error('Invalid API destination');const token=await getToken();if(!token)throw Error('Bitte erneut anmelden.');const headers=new Headers(init?.headers);headers.set('Authorization','Bearer '+token);return fetch(url,{...init,headers,cache:'no-store'});},[getToken]);
 useEffect(()=>{let cancelled=false;setState(null);setError('');if(isSignedIn)request('/api/staff/session').then(async r=>{const d=await r.json() as {email:string;active:boolean;error?:string};if(!r.ok)throw Error(d.error||'Zugriff verweigert.');if(!cancelled)setState(d);}).catch(e=>{if(!cancelled)setError(e.message)});return()=>{cancelled=true}},[isSignedIn,request]);
 if(isLoaded&&isSignedIn&&state?.active&&dashboard)return <StaffFetchContext.Provider value={request}><div className="staff-account"><span>{state.email}</span><UserButton/></div><Manager/></StaffFetchContext.Provider>;
 return <main className="login-shell"><a href="/"><img src="/nea-logo.png" alt="NEA 1889" width="80" height="80"/></a><h1>Restaurant-Login</h1><p>Dein persönlicher Zugang zu NEA 1889.</p>{!isLoaded?<p>Login wird geladen…</p>:!isSignedIn?<>{signup?<SignUp routing="hash" forceRedirectUrl="/login"/>:<SignIn routing="hash" forceRedirectUrl="/login"/>}<button className="copy-link" onClick={()=>setSignup(!signup)}>{signup?'Zur Anmeldung':'Erster Zugang? Konto erstellen'}</button><p className="form-note">Nur freigegebene Restaurantkonten erhalten Zugang zu Reservierungen.</p></>:<>{!state&&!error&&<p>Zugang wird geprüft…</p>}{state?.active?<a className="primary" href="/admin">Reservierungen öffnen →</a>:null}<button className="copy-link" onClick={()=>signOut({redirectUrl:'/login'})}>Abmelden</button></>}{error&&<p role="alert" className="error">{error}</p>}<a href="/">Zur Tischanfrage</a></main>;
}
export default function Login({publishableKey,dashboard=false}:{publishableKey:string;dashboard?:boolean}){return <ClerkProvider publishableKey={publishableKey} signInUrl="/login" signUpUrl="/login" signInFallbackRedirectUrl="/login" signUpFallbackRedirectUrl="/login"><Panel dashboard={dashboard}/></ClerkProvider>}
