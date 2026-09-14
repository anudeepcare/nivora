import fs from 'node:fs';
const required=[
 '.github/workflows/auryn-v996-validation-queue.yml',
 '.github/workflows/nivora-calibration-mature.yml',
 'scripts/auryn-v997-market-cycle.mjs',
 'components/StockClient.tsx'
];
for(const f of required){if(!fs.existsSync(f))throw new Error(`release missing required file: ${f}`)}
const main=fs.readFileSync(required[0],'utf8');
if(!main.includes('AURYN V9.9.7 Autonomous Market Cycle'))throw new Error('V9.9.7 workflow content missing');
const mature=fs.readFileSync(required[1],'utf8');
if(/AURYN_PRODUCTION_URL|TRADING_LAB_CRON_SECRET/.test(mature))throw new Error('legacy maturation secrets remain');
if(fs.readFileSync('vercel.json','utf8').trim()!=='{}')throw new Error('vercel.json must remain {}');
const migrations=fs.readdirSync('supabase/migrations').filter(x=>x.includes('9971'));
if(migrations.length)throw new Error('V9.9.7.1 requires zero Supabase migrations');
console.log('V9.9.7.1 release verified: hidden workflows included; zero Supabase migrations; no manual SQL required.');
