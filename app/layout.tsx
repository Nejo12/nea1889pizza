import type { Metadata } from 'next';
import './globals.css';
import InstallApp from './install-app';
export const viewport={width:'device-width',initialScale:1,themeColor:'#202923'};
export const metadata: Metadata={title:'NEA 1889 · Reservierungen',description:'Tischanfrage bei NEA 1889 in der Zimmerstraße 26/27, Berlin.',robots:{index:false,follow:false},referrer:'no-referrer',manifest:'/manifest.webmanifest',appleWebApp:{capable:true,title:'NEA 1889',statusBarStyle:'default'},icons:{icon:[{url:'/icons/nea-32.png',sizes:'32x32',type:'image/png'},{url:'/icons/nea-192.png',sizes:'192x192',type:'image/png'}],apple:'/icons/nea-180.png'}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="de"><body>{children}<InstallApp/></body></html>}
