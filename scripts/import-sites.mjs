import postgres from 'postgres';
import {readFile} from 'node:fs/promises';
const [file]=process.argv.slice(2);
if(!file||!process.env.DATABASE_URL)throw Error('Provide a private export JSON path and DATABASE_URL.');
const schema=process.env.NEA_DATABASE_SCHEMA;
if(!schema||!/^[a-z][a-z0-9_]{0,62}$/.test(schema))throw Error('NEA_DATABASE_SCHEMA required.');
const data=JSON.parse(await readFile(file,'utf8'));
const columns={bookings:['id','token_hash','name','email','phone','date','time','guests','notes','status','table_ids','duration','created','updated'],blocked_days:['id','owner','date'],occupancy:['id','booking_id','table_id','date','minute'],reservations:['id','owner','name','email','phone','date','time','guests','notes','status','created']};
for(const [name,keys]of Object.entries(columns)){
 if(!Array.isArray(data[name]))throw Error('Missing export table: '+name);
 for(const row of data[name])if(keys.some(k=>row[k]===undefined))throw Error('Incomplete row in '+name);
}
const sql=postgres(process.env.DATABASE_URL,{max:1,prepare:false,connection:{search_path:schema}});
try{await sql.begin(async tx=>{
 await tx`SELECT pg_advisory_xact_lock(hashtext(${schema}))`;
 for(const [name,keys]of Object.entries(columns))for(const row of data[name]){
  const previous=await tx.unsafe(`SELECT * FROM "${name}" WHERE id=$1`,[row.id]);
  if(previous.length){if(keys.some(k=>String(previous[0][k])!==String(row[k])))throw Error('Conflicting existing record; import aborted in '+name);continue;}
  await tx.unsafe(`INSERT INTO "${name}" (${keys.map(k=>'"'+k+'"').join(',')}) VALUES (${keys.map((_,i)=>'$'+(i+1)).join(',')})`,keys.map(k=>row[k]));
 }
 for(const [name,keys]of Object.entries(columns))for(const row of data[name]){
  const saved=await tx.unsafe(`SELECT * FROM "${name}" WHERE id=$1`,[row.id]);
  if(saved.length!==1||keys.some(k=>String(saved[0][k])!==String(row[k])))throw Error('Verification failed in '+name);
 }
});console.log('Imported and verified counts:',Object.fromEntries(Object.keys(columns).map(k=>[k,data[k].length])));
}finally{await sql.end();}
