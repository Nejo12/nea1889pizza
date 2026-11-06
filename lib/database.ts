import postgres from 'postgres';
let client: ReturnType<typeof postgres> | undefined;
export function databaseSchema() {
 const schema=process.env['NEA_DATABASE_SCHEMA'] || (process.env['VERCEL_ENV']==='preview'?'nea_migration_preview':'');
 if(!/^[a-z][a-z0-9_]{0,62}$/.test(schema)) throw Error('Set NEA_DATABASE_SCHEMA explicitly.');
 return schema;
}
function useTls(url:string) {
 try {return !['localhost','127.0.0.1','::1','[::1]'].includes(new URL(url).hostname);} catch {return true;}
}
// Server-only. DATABASE_URL must be the least-privilege runtime role (nea_runtime) on the
// Supabase transaction pooler. Schema changes use a separate migration connection that this app never reads.
// Cloudflare Workers (the Lovable/TanStack Start runtime) forbid I/O objects, i.e. sockets, from being reused by a
// different request, so a module-level client would fail on the next request. Only a positively identified Node.js
// process (navigator.userAgent 'Node.js/<v>', Node >= 21) keeps one small pool; every other runtime fails safe by
// opening its own short-lived connection per operation (the transaction pooler makes that cheap) and closing it.
const isWorkers=!(typeof navigator!=='undefined'&&navigator.userAgent.startsWith('Node.js/'));
function open() {
 if(!process.env['DATABASE_URL']) throw Error('DATABASE_URL is missing.');
 // prepare:false is required by transaction poolers; TLS is mandatory for every non-local host.
 return postgres(process.env['DATABASE_URL'],{max:isWorkers?1:3,prepare:false,idle_timeout:20,connect_timeout:10,...(useTls(process.env['DATABASE_URL'])?{ssl:'require' as const}:{})});
}
async function withConnection<T>(work:(sql:ReturnType<typeof postgres>)=>Promise<T>):Promise<T> {
 if(!isWorkers) return work(client ??= open());
 const sql=open();
 try {return await work(sql);} finally {await sql.end({timeout:0});}
}
export function parameterize(query:string) {
 let index=0;
 return query.replace(/'(?:''|[^'])*'|\?/g,part=>part==='?'?`$${++index}`:part);
}
class Statement {
 values:(string|number|null)[]=[];
 constructor(readonly query:string){}
 bind(...values:(string|number|null)[]){this.values=values;return this;}
 async rows(){return withConnection(sql=>sql.begin(async tx=>{
  // Transaction poolers (Supabase Supavisor) hand out connections per transaction: never rely on startup/session search_path.
  await tx.unsafe(`SET LOCAL search_path TO "${databaseSchema()}"`);
  return Array.from(await tx.unsafe(parameterize(this.query),this.values));
 }));}
 async first<T=Record<string,unknown>>(){const rows=await this.rows();return (rows[0] as T)??null;}
 async all(){return {results:await this.rows()};}
 async run(){return (await database().batch([this]))[0]!;}
}
export function database(){return {
 prepare:(query:string)=>new Statement(query),
 async batch(commands:Statement[]){return withConnection(sql=>sql.begin(async tx=>{
  await tx.unsafe(`SET LOCAL search_path TO "${databaseSchema()}"`);
  await tx`SELECT pg_advisory_xact_lock(hashtext(${databaseSchema()}))`;
  const results=[];
  for(const command of commands){const rows=await tx.unsafe(parameterize(command.query),command.values);results.push({meta:{changes:rows.count}});}
  return results;
 }));}
};}
