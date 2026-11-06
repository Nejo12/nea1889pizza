import {spawnSync} from 'node:child_process';
function run(args){const p=spawnSync(process.execPath,args,{stdio:'inherit'});if(p.status!==0)process.exit(p.status||1);}
// Builds never touch a database. Schema changes are explicit, reviewed steps:
// see docs/supabase-database.md and supabase/migrations.
run(['node_modules/next/dist/bin/next','build','--webpack']);
