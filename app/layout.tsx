import type { Metadata } from 'next';
import './globals.css';
import InstallApp from './install-app';
export const viewport={width:'device-width',initialScale:1,themeColor:'#0e0c07'};
export const metadata: Metadata={title:'NEA 1889 · Napoli in Berlin',description:'Neapolitanische Pizza und Tischanfragen bei NEA 1889 in der Zimmerstraße 26/27, Berlin.',robots:{index:false,follow:false},referrer:'no-referrer',manifest:'/manifest.webmanifest',appleWebApp:{capable:true,title:'NEA 1889',statusBarStyle:'default'},icons:{icon:'/icons/nea-192.png',apple:'/icons/nea-180.png'}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="de"><body>{children}<InstallApp/></body></html>}
