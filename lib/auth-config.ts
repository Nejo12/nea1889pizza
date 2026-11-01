export type AuthConfig={publishableKey:string;secretKey:string;active:true};
export function authConfig():AuthConfig|null{
 const publishableKey=process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,secretKey=process.env.CLERK_SECRET_KEY;
 return publishableKey&&secretKey?{publishableKey,secretKey,active:true}:null;
}
export function authorizedOrigins(){
 const origins=(process.env.AUTHORIZED_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean);
 if(process.env.VERCEL_ENV==='preview'&&process.env.VERCEL_URL)origins.push(`https://${process.env.VERCEL_URL}`);
 if(process.env.NODE_ENV==='development')origins.push('http://localhost:3000');
 return [...new Set(origins)];
}
