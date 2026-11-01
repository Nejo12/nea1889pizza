'use client';
import {useEffect,useRef,useState} from 'react';
import {tableEndTime} from '@/lib/reservation-rules';

type Data={name:string;date:string;time:string;guests:number;status:string;duration:number;updated:string};
const labels:Record<string,string>={pending:'Anfrage in Bearbeitung',confirmed:'Dein Tisch ist bestätigt',arrived:'Herzlich willkommen!',cancelled:'Reservierung storniert',noshow:'Nicht erschienen'};
const messages:Record<string,string>={pending:'Wir prüfen deine Anfrage persönlich. Dein Tisch ist noch nicht verbindlich reserviert.',confirmed:'Dein Tisch ist fest eingeplant. Wir freuen uns auf dich.',arrived:'Schön, dass du da bist. Buon appetito!',cancelled:'Diese Reservierung wurde storniert. Du kannst jederzeit eine neue Tischanfrage senden.',noshow:'Diese Reservierung ist abgeschlossen. Bei Fragen erreichst du das Restaurant telefonisch.'};

function prettyDate(date:string){return new Intl.DateTimeFormat('de-DE',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date(date+'T12:00:00'))}
function prettyUpdated(value:string){try{return new Intl.DateTimeFormat('de-DE',{timeZone:'Europe/Berlin',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(value))}catch{return ''}}

export default function Page(){
 const token=useRef('');
 const [data,setData]=useState<Data|null>(null);
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 const [confirm,setConfirm]=useState(false);

 async function load(method='GET'){
  setBusy(true);setError('');
  try{
   const r=await fetch('/api/booking',{method,headers:{'X-Booking-Token':token.current}});
   const d=await r.json() as Data&{error?:string};
   if(!r.ok)throw Error(d.error||'Bitte erneut versuchen.');
   setData(d);setConfirm(false);
  }catch(e){setError((e as Error).message)}
  finally{setBusy(false)}
 }

 useEffect(()=>{
  token.current=location.hash.slice(1);
  load();
  const timer=setInterval(()=>{if(document.visibilityState==='visible')load()},45000);
  const visible=()=>{if(document.visibilityState==='visible')load()};
  document.addEventListener('visibilitychange',visible);
  return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',visible)}
 },[]);

 return <div className="status-page">
  <a href="/"><img src="/nea-logo.png" alt="NEA 1889"/></a>
  <section className="booking-card">
   <p className="eyebrow">NEA 1889 · ZIMMERSTRASSE 26/27</p>
   <h1 style={{fontSize:35}}>Deine Reservierung.</h1>
   {data?<div className="status-content" aria-live="polite">
    <span className={'badge '+data.status}>{labels[data.status]||data.status}</span>
    <h2 style={{marginTop:25}}>{data.name}</h2>
    <div className="status-summary"><strong>{prettyDate(data.date)}</strong><span>{data.time}–{tableEndTime(data.time)} Uhr</span><span>{data.guests} {data.guests===1?'Person':'Personen'}</span></div>
    <p className="status-message">{messages[data.status]||'Der aktuelle Status wird hier angezeigt.'}</p>
    <p>Zimmerstraße 26/27, 10969 Berlin<br/><a href="tel:+493098465557">030 984 655 57</a></p>
    <button className="primary submit" disabled={busy} onClick={()=>load()}>{busy?'Wird aktualisiert …':'Status aktualisieren'}</button>
    {['pending','confirmed'].includes(data.status)&&(!confirm?<button className="copy-link" onClick={()=>setConfirm(true)}>Reservierung stornieren</button>:<div className="cancel-confirm"><p>Möchtest du diese Reservierung wirklich stornieren?</p><button className="primary" disabled={busy} onClick={()=>load('PATCH')}>Ja, stornieren</button><button className="copy-link" onClick={()=>setConfirm(false)}>Zurück</button></div>)}
    <p className="status-updated">Zuletzt aktualisiert: {prettyUpdated(data.updated)} Uhr · Diese Seite prüft den Status automatisch, solange sie geöffnet ist.</p>
   </div>:!error&&<p>Reservierungsstatus wird geladen …</p>}
   {error&&<p className="error" role="alert">{error}</p>}
   <p className="form-note">Bewahre diesen persönlichen Link auf. Jeder mit diesem Link kann den Status sehen und eine offene oder bestätigte Reservierung stornieren. Automatische E-Mails sind derzeit nicht aktiviert.</p>
   <a href="/">Neue Tischanfrage →</a>
  </section>
 </div>
}
