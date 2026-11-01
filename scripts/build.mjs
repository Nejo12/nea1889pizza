import {spawnSync} from 'node:child_process';
function run(args){const p=spawnSync(process.execPath,args,{stdio:'inherit'});if(p.status!==0)process.exit(p.status||1);}
// Only the separate preview schema can be initialized during a preview build.
// Production schema migrations are explicit, backed up, and run before release.
if(process.env.VERCEL_ENV==='preview')run(['scripts/migrate.mjs','--preview']);
run(['node_modules/next/dist/bin/next','build','--webpack']);
