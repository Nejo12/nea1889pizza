'use client';
import {secureId} from '@/lib/client-id';
import {useEffect,useRef,useState} from 'react';
import {berlinClock,slotsForDate,isFutureSlot,tableEndTime} from '@/lib/reservation-rules';

type Availability={blocked:boolean;slots:{time:string;requestable:boolean}[]};
type BookingResult={link:string;date:string;time:string;guests:number};

function prettyDate(date:string){
 return new Intl.DateTimeFormat('de-DE',{weekday:'long',day:'numeric',month:'long'}).format(new Date(date+'T12:00:00'));
}

export default function BookingForm(){
 const [date,setDate]=useState(()=>berlinClock().date);
 const [guests,setGuests]=useState(2);
 const [choice,setChoice]=useState('');
 const [clock,setClock]=useState(Date.now);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [availability,setAvailability]=useState<Availability|null>(null);
 const [availabilityBusy,setAvailabilityBusy]=useState(true);
 const [availabilityError,setAvailabilityError]=useState('');
 const [result,setResult]=useState<BookingResult|null>(null);
 const [copied,setCopied]=useState(false);
 const ref=useRef<{requestId:string;token:string}|null>(null);
 const sending=useRef(false);

 useEffect(()=>{const timer=setInterval(()=>setClock(Date.now()),30000);return()=>clearInterval(timer)},[]);
 useEffect(()=>{
  const controller=new AbortController();
  setAvailabilityBusy(true);setAvailabilityError('');
  fetch(`/api/availability?date=${encodeURIComponent(date)}&guests=${guests}`,{signal:controller.signal})
   .then(async r=>{const data=await r.json() as Availability&{error?:string};if(!r.ok)throw Error(data.error||'Verfügbarkeit nicht verfügbar.');setAvailability(data)})
   .catch(e=>{if((e as Error).name!=='AbortError'){setAvailability(null);setAvailabilityError('Live-Verfügbarkeit konnte nicht geladen werden. Beim Senden prüfen wir erneut.')}})
   .finally(()=>{if(!controller.signal.aborted)setAvailabilityBusy(false)});
  return()=>controller.abort();
 },[date,guests]);

 const slots=slotsForDate(date);
 const requestable=new Map(availability?.slots.map(slot=>[slot.time,slot.requestable])||[]);
 const available=slots.filter(t=>isFutureSlot(date,t,new Date(clock))&&!availability?.blocked&&(!availability||requestable.get(t)!==false));
 const time=available.includes(choice)?choice:available[0]||'';

 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();if(sending.current||!time)return;
  sending.current=true;setBusy(true);setError('');setCopied(false);
  ref.current??={requestId:secureId(),token:Array.from(crypto.getRandomValues(new Uint8Array(32))).map(x=>x.toString(16).padStart(2,'0')).join('')};
  const f=new FormData(e.currentTarget);
  try{
   const r=await fetch('/api/booking',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...ref.current,name:f.get('name'),email:f.get('email'),phone:f.get('phone'),notes:f.get('notes'),guests,date,time,website:f.get('website'),accepted:f.get('accepted')==='on'})});
   const data=await r.json() as {error?:string};
   if(!r.ok)throw Error(data.error||'Speichern fehlgeschlagen.');
   setResult({link:location.origin+'/reservation#'+ref.current.token,date,time,guests});
  }catch(e){setError((e as Error).message)}
  finally{setBusy(false);sending.current=false}
 }

 if(result)return <div className="success booking-success" role="status">
  <div className="success-mark" aria-hidden="true">✓</div>
  <p className="eyebrow">ANFRAGE GESENDET</p>
  <h3>Grazie! Wir prüfen deinen Tisch.</h3>
  <span className="badge pending">Noch nicht bestätigt</span>
  <div className="success-summary"><strong>{prettyDate(result.date)}</strong><span>{result.time}–{tableEndTime(result.time)} Uhr · {result.guests} {result.guests===1?'Person':'Personen'}</span></div>
  <p>Deine Anfrage ist bei NEA 1889 angekommen. Sobald das Restaurant sie bearbeitet, siehst du den aktuellen Status über deinen persönlichen Link.</p>
  <a className="primary" href={result.link}>Reservierungsstatus öffnen →</a>
  <button className="copy-link" onClick={async()=>{try{await navigator.clipboard.writeText(result.link);setCopied(true)}catch{setCopied(false);setError('Bitte den Link unten manuell kopieren.')}}}>{copied?'Link kopiert ✓':'Persönlichen Status-Link kopieren'}</button>
  <input aria-label="Persönlicher Reservierungslink" value={result.link} readOnly onFocus={e=>e.target.select()}/>
  <p className="form-note">Bitte bewahre diesen Link vertraulich auf. Bestätigungen und Änderungen werden aktuell über diese Statusseite angezeigt; automatische E-Mails sind noch nicht aktiviert.</p>
  {error&&<p className="error" role="alert">{error}</p>}
 </div>;

 return <form onSubmit={submit}>
  <div className="booking-progress" aria-label="Reservierungsablauf"><span className="active"><b>1</b> Termin</span><span><b>2</b> Kontakt</span><span><b>3</b> Bestätigung</span></div>

  <div className="booking-section-head"><span>01</span><div><strong>Wann möchtest du kommen?</strong><small>Datum, Personen und Wunschzeit</small></div></div>
  <div className="form-row"><label>Datum<input type="date" min={berlinClock().date} required value={date} onChange={e=>setDate(e.target.value)}/></label><label>Personen<select name="guests" value={guests} onChange={e=>setGuests(Number(e.target.value))}>{Array.from({length:12},(_,i)=><option key={i} value={i+1}>{i+1} {i===0?'Person':'Personen'}</option>)}</select></label></div>
  <fieldset><legend>Wunschzeit</legend><div className="slots">{slots.map(t=>{const future=isFutureSlot(date,t,new Date(clock));const serverAllows=!availability||requestable.get(t)!==false;const disabled=busy||availability?.blocked||!future||!serverAllows;return <button key={t} type="button" disabled={disabled} className={t===time?'chosen':''} aria-pressed={t===time} title={!future?'Diese Zeit ist bereits vorbei.':serverAllows?'Wunschzeit auswählen':'Diese Zeit ist aktuell nicht anfragbar.'} onClick={()=>setChoice(t)}>{t}</button>})}</div></fieldset>
  <div className={'availability-line '+(availability?.blocked?'closed':'')} aria-live="polite">{availability?.blocked?'Online-Anfragen sind für diesen Tag geschlossen.':availabilityBusy?'Aktuelle Kapazität wird geprüft …':availabilityError||'Aktuell anfragbare Zeiten sind auswählbar. Die finale Bestätigung erfolgt persönlich.'}</div>
  <p className="form-note">{time?`Geplante Tischzeit: ${time}–${tableEndTime(time)} Uhr · bis zu 75 Minuten.`:'Für diesen Tag ist aktuell keine passende Wunschzeit anfragbar. Bitte ein anderes Datum wählen.'}</p>

  <div className="booking-section-head"><span>02</span><div><strong>Wie erreichen wir dich?</strong><small>Nur die Angaben, die wir für deine Reservierung brauchen</small></div></div>
  <label>Vor- und Nachname<input required name="name" autoComplete="name" minLength={2} maxLength={100}/></label>
  <div className="form-row"><label>E-Mail<input required type="email" name="email" autoComplete="email" maxLength={200}/></label><label>Telefon<input required type="tel" name="phone" autoComplete="tel" minLength={5} maxLength={40}/></label></div>
  <label>Wünsche oder Notizen <span className="optional">optional</span><textarea name="notes" maxLength={1000} rows={2} placeholder="Zum Beispiel: Kinderstuhl oder Terrasse, wenn möglich"/></label>
  <div className="honey" aria-hidden="true"><label>Website<input tabIndex={-1} name="website" autoComplete="off"/></label></div>
  <p className="form-note">Wir speichern deine Angaben zur Bearbeitung deiner Tischanfrage. Bitte keine sensiblen Informationen in die Notizen schreiben. Für Änderungen kannst du deinen persönlichen Link nutzen oder uns anrufen.</p>
  <label className="check-row"><input type="checkbox" name="accepted" required/><span>Ich habe die <a href="https://neapizza1889.de/nea-1889/" target="_blank" rel="noreferrer">Datenschutzhinweise</a> gelesen und weiß, dass die Anfrage erst nach Bestätigung verbindlich ist.</span></label>
  {error&&<p className="error" role="alert">{error}</p>}
  <button className="primary submit" disabled={busy||!time||availability?.blocked}>{busy?'Wird gesendet …':'Tisch anfragen'} <span>→</span></button>
  <p className="under-button">Persönliche Bestätigung · Keine Zahlung erforderlich</p>
 </form>
}
