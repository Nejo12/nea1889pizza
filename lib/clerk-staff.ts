import {createClerkClient} from '@clerk/backend';
import {authorizedOrigins,type AuthConfig} from './auth-config';
export function allowedEmail(email:string){return (process.env.STAFF_EMAILS||'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean).includes(email.toLowerCase());}
export async function clerkStaff(req:Request,config:AuthConfig){
 const origins=authorizedOrigins();
 if(!origins.length||!req.headers.get('authorization')?.startsWith('Bearer '))return null;
 const origin=req.headers.get('origin');if(origin&&!origins.includes(origin))return null;
 try{
 const clerk=createClerkClient({secretKey:config.secretKey,publishableKey:config.publishableKey});
 const state=await clerk.authenticateRequest(req,{authorizedParties:origins,acceptsToken:'session_token'});
 if(!state.isAuthenticated)return null;
 const {userId}=state.toAuth();if(!userId)return null;
 const user=await clerk.users.getUser(userId);if(user.banned||user.locked)return null;
 const email=user.emailAddresses.find(e=>e.id===user.primaryEmailAddressId);
 if(!email||email.verification?.status!=='verified'||!allowedEmail(email.emailAddress))return null;
 return {id:user.id,email:email.emailAddress};
 }catch{return null;}
}
