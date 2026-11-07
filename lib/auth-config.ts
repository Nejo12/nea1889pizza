export type AuthConfig={publishableKey:string;secretKey:string;active:true};
export function authConfig():AuthConfig|null{
 const publishableKey=process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,secretKey=process.env.CLERK_SECRET_KEY;
 return publishableKey&&secretKey?{publishableKey,secretKey,active:true}:null;
}
export {authorizedOrigins} from './trusted-origins';
