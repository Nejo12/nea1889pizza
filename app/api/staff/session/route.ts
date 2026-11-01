import {authConfig} from '@/lib/auth-config';
import {clerkStaff} from '@/lib/clerk-staff';
export const dynamic='force-dynamic';
export async function GET(req:Request){try{const config=await authConfig();if(!config)return Response.json({error:'Login noch nicht eingerichtet.'},{status:503});const user=await clerkStaff(req,config);if(!user)return Response.json({error:'Zugriff nicht erlaubt. Bitte mit deiner freigegebenen und bestätigten Restaurant-E-Mail anmelden.'},{status:403,headers:{'Cache-Control':'no-store'}});return Response.json({email:user.email,active:config.active},{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({error:'Login derzeit nicht verfügbar.'},{status:503});}}
