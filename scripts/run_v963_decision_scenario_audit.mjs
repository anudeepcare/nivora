#!/usr/bin/env node
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {auditAurynDecisions}=require('../.engine-test/auryn-decision-audit.js');
const argv=process.argv.slice(2),args={};
for(let i=0;i<argv.length;i++)if(argv[i].startsWith('--'))args[argv[i].slice(2)]=argv[i+1];
const input=args.input||'decision-audit-input.json';
const output=args.output||'decision-scenario-audit.json';
if(!fs.existsSync(input)){console.error(`Missing ${input}. Provide captured production decision rows with --input.`);process.exit(1);}
const rows=JSON.parse(fs.readFileSync(input,'utf8'));
if(!Array.isArray(rows)){console.error('Audit input must be a JSON array.');process.exit(1);}
const audit=auditAurynDecisions(rows);
const report={...audit,generatedAt:new Date().toISOString(),note:'Diagnostic only. V9.6.3 does not tune production decision thresholds or scenario values.'};
fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(`AURYN V9.6.3 audit: ${audit.total} rows`);
console.log('New money:',audit.distributions.newMoney);
console.log('Decision dispersion:',audit.diagnostics.decisionDispersion);
console.log('Scenario independence:',audit.scenario.independence);
console.log('Fingerprint:',audit.fingerprint);
