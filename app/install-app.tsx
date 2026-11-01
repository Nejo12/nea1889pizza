'use client';
import {useEffect,useState} from 'react';
type InstallPrompt=Event & {prompt:()=>Promise<void>;userChoice:Promise<{outcome:string}>};
export default function InstallApp(){
 const [prompt,setPrompt]=useState<InstallPrompt|null>(null);
 const [installed,setInstalled]=useState(false);
 const [busy,setBusy]=useState(false);
 useEffect(()=>{
  const media=window.matchMedia('(display-mode: standalone)');
  const sync=()=>setInstalled(media.matches || Boolean((navigator as Navigator & {standalone?:boolean}).standalone));
  sync(); media.addEventListener('change',sync);
  const offer=(event:Event)=>{event.preventDefault();setPrompt(event as InstallPrompt);};
  const done=()=>{setInstalled(true);setPrompt(null);};
  window.addEventListener('beforeinstallprompt',offer);window.addEventListener('appinstalled',done);
  if('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'}).catch(()=>{});
  return()=>{media.removeEventListener('change',sync);window.removeEventListener('beforeinstallprompt',offer);window.removeEventListener('appinstalled',done);};
 },[]);
 async function install(){if(!prompt)return;setBusy(true);try{await prompt.prompt();await prompt.userChoice;}finally{setPrompt(null);setBusy(false);}}
 if(installed)return null;
 return <aside className="install-app" aria-label="NEA App installieren"><img src="/icons/nea-192.png" alt="" width="40" height="40"/><div><strong>NEA 1889 auf deinem Handy</strong><p>Dein Tisch und Restaurant-Login – direkt vom Home-Bildschirm.</p>{prompt?<button type="button" className="primary" onClick={install} disabled={busy}>{busy?'Bitte warten …':'App installieren'}</button>:<details><summary>App hinzufügen · So geht’s</summary><p><b>iPhone / iPad:</b> Diese Seite in Safari öffnen → Teilen → Zum Home-Bildschirm → „Als Web-App öffnen“ aktivieren, falls angezeigt → Hinzufügen.</p><p><b>Android:</b> In Chrome öffnen → Menü ⋮ → App installieren oder Zum Startbildschirm hinzufügen.</p><p>Internetverbindung erforderlich. Automatische Benachrichtigungen sind noch nicht aktiviert.</p></details>}</div></aside>;
}
