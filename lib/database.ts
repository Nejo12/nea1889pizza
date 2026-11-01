import postgres from 'postgres';
let client: ReturnType<typeof postgres> | undefined;
export function databaseSchema() {
 const schema=process.env.NEA_DATABASE_SCHEMA || (process.env.VERCEL_ENV==='preview'?'nea_migration_preview':'');
 if(!/^[a-z][a-z0-9_]{0,62}$/.test(schema)) throw Error('Set NEA_DATABASE_SCHEMA explicitly.');
 return schema;
}
function connection() {
 if(!process.env.DATABASE_URL) throw Error('DATABASE_URL is missing.');
 return client ??= postgres(process.env.DATABASE_URL,{max:3,prepare:false,idle_timeout:20,connect_timeout:10});
}
export function parameterize(query:string) {
 let index=0;
 return query.replace(/'(?:''|[^'])*'|\?/g,part=>part==='?'?`$${++index}`:part);
}
class Statement {
 values:(string|number|null)[]=[];
 constructor(readonly query:string){}
 bind(...values:(string|number|null)[]){this.values=values;return this;}
 async rows(){return connection().begin(async tx=>{
  // Neon pools connections by transaction: never rely on startup/session search_path.
  await tx.unsafe(`SET LOCAL search_path TO "${databaseSchema()}"`);
  return Array.from(await tx.unsafe(parameterize(this.query),this.values));
 });}
 async first<T=Record<string,unknown>>(){const rows=await this.rows();return (rows[0] as T)??null;}
 async all(){return {results:await this.rows()};}
 async run(){return (await database().batch([this]))[0];}
}
export function database(){return {
 prepare:(query:string)=>new Statement(query),
 async batch(commands:Statement[]){return connection().begin(async tx=>{
  await tx.unsafe(`SET LOCAL search_path TO "${databaseSchema()}"`);
  await tx`SELECT pg_advisory_xact_lock(hashtext(${databaseSchema()}))`;
  const results=[];
  for(const command of commands){const rows=await tx.unsafe(parameterize(command.query),command.values);results.push({meta:{changes:rows.count}});}
  return results;
 });}
};}
