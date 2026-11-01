import {authConfig} from './auth-config';
import {clerkStaff} from './clerk-staff';
export {database} from './database';
export async function isStaff(req?:Request){const config=authConfig();return !!req&&!!config&&!!await clerkStaff(req,config);}
