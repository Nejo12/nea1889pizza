// Applies supabase/migrations with the pinned Supabase CLI over a DIRECT or SESSION-pooler connection.
// Needs MIGRATION_DATABASE_URL (the migration identity, never the runtime role). The app never reads it.
import {spawnSync} from 'node:child_process';
const cli='supabase@3.0.0';
const url=process.env.MIGRATION_DATABASE_URL;
if(process.env.VERCEL)throw Error('Migrations are manual, controlled steps and never run during a Vercel build.');
if(!url)throw Error('MIGRATION_DATABASE_URL is missing (direct or session-pooler URL, port 5432).');
if(new URL(url).port==='6543')throw Error('Use the direct or session connection (5432) for migrations, not the transaction pooler.');
const dryRun=process.argv.includes('--dry-run');
const p=spawnSync('npx',['--yes',cli,'db','push',`--remote=${url}`,...(dryRun?['--dry-run']:[])],{stdio:'inherit'});
process.exit(p.status??1);
