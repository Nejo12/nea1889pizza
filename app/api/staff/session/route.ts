import {staffFromRequest} from '@/lib/staff';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store'};
export async function GET(req:Request){
 const v=await staffFromRequest(req);
 if(v.ok)return Response.json({email:v.staff.email,role:v.staff.role},{headers});
 const error=v.status===401?'Sitzung abgelaufen. Bitte erneut anmelden.':v.status===403?'Dieses Konto ist nicht für Reservierungen freigegeben.':'Login derzeit nicht verfügbar.';
 return Response.json({error},{status:v.status,headers});
}
