// Controlled setup of LOCAL demo staff accounts (Issue #12, Phase 1). Never touches hosted projects:
// it refuses any Supabase URL that is not loopback. Production staff are provisioned separately after review.
//   SUPABASE_URL=http://127.0.0.1:54521 SUPABASE_SERVICE_ROLE_KEY=... MIGRATION_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54522/postgres \
//   [DEMO_ADMIN_PASSWORD=... DEMO_STAFF_PASSWORD=...] npm run auth:seed-local
import {createClient} from '@supabase/supabase-js';
import postgres from 'postgres';
import {randomBytes} from 'node:crypto';
const {SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY,MIGRATION_DATABASE_URL}=process.env;
if(!SUPABASE_URL||!SUPABASE_SERVICE_ROLE_KEY||!MIGRATION_DATABASE_URL)throw Error('Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and MIGRATION_DATABASE_URL (local stack).');
if(!['localhost','127.0.0.1','::1','[::1]'].includes(new URL(SUPABASE_URL).hostname)||!['localhost','127.0.0.1','::1','[::1]'].includes(new URL(MIGRATION_DATABASE_URL).hostname))throw Error('Refusing to seed: only local Supabase/PostgreSQL targets are allowed.');
const pw=v=>v||randomBytes(9).toString('base64url');
const accounts=[
 {email:'admin@nea1889.test',role:'admin',active:true,password:pw(process.env.DEMO_ADMIN_PASSWORD)},
 {email:'staff@nea1889.test',role:'staff',active:true,password:pw(process.env.DEMO_STAFF_PASSWORD)},
 // Negative fixtures for the demo: valid login, but no access.
 {email:'disabled@nea1889.test',role:'staff',active:false,password:pw(process.env.DEMO_DISABLED_PASSWORD)},
 {email:'unapproved@nea1889.test',role:null,active:false,password:pw(process.env.DEMO_UNAPPROVED_PASSWORD)},
];
const auth=createClient(SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY,{auth:{autoRefreshToken:false,persistSession:false}}).auth.admin;
const sql=postgres(MIGRATION_DATABASE_URL,{max:1,onnotice:()=>{}});
const {data:{users}}=await auth.listUsers({perPage:1000});
for(const a of accounts){
 let user=users.find(u=>u.email===a.email);
 if(user)await auth.updateUserById(user.id,{password:a.password,email_confirm:true});
 else{const r=await auth.createUser({email:a.email,password:a.password,email_confirm:true});if(r.error)throw r.error;user=r.data.user;}
 if(a.role)await sql`INSERT INTO nea.staff_members(user_id,email,role,active) VALUES (${user.id},${a.email},${a.role},${a.active}) ON CONFLICT (user_id) DO UPDATE SET email=EXCLUDED.email,role=EXCLUDED.role,active=EXCLUDED.active`;
 console.log(`${a.email.padEnd(26)} ${String(a.role??'(no membership)').padEnd(16)} active=${a.active} password=${a.password}`);
}
await sql.end();
