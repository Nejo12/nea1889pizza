import postgres from 'postgres';
import {readFile} from 'node:fs/promises';
const preview=process.argv.includes('--preview');
if(preview&&process.env.VERCEL_ENV!=='preview')throw Error('Preview migration requires VERCEL_ENV=preview.');
const schema=process.env.NEA_DATABASE_SCHEMA||(preview?'nea_migration_preview':'');
if(!/^[a-z][a-z0-9_]{0,62}$/.test(schema))throw Error('NEA_DATABASE_SCHEMA required.');
if(preview&&schema!=='nea_migration_preview')throw Error('Preview migration may only use nea_migration_preview.');
if(!process.env.DATABASE_URL)throw Error('DATABASE_URL missing.');
const sql=postgres(process.env.DATABASE_URL,{max:1,prepare:false});
try{
 const ddl=await readFile(new URL('../database/schema.sql',import.meta.url),'utf8');
 await sql.begin(async tx=>{
  await tx`SELECT pg_advisory_xact_lock(hashtext(${schema}))`;
  await tx.unsafe(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
  await tx.unsafe(`SET LOCAL search_path TO "${schema}"`);
  for(const statement of ddl.split(';').filter(s=>s.trim()))await tx.unsafe(statement);
 });
 console.log('Schema verified:',schema);
}finally{await sql.end();}
