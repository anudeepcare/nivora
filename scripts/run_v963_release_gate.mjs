#!/usr/bin/env node
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
const root=new URL('../',import.meta.url);
execFileSync('npx',['tsc','-p','tsconfig.engine.json'],{cwd:root,stdio:'inherit'});
const require=createRequire(import.meta.url);
const {auditAurynDecisions}=require('../.engine-test/auryn-decision-audit.js');
const rows=JSON.parse(fs.readFileSync(new URL('../tests/fixtures/v963-decision-audit-fixture.json',import.meta.url),'utf8'));
const a=auditAurynDecisions(rows),b=auditAurynDecisions(structuredClone(rows));
const failures=[];
if(a.fingerprint!==b.fingerprint)failures.push('NON_DETERMINISTIC_FINGERPRINT');
if(a.total!==rows.length)failures.push('ROW_COUNT_MISMATCH');
if(a.scenario.valid+a.scenario.invalidGeometry+a.scenario.missing!==rows.length)failures.push('SCENARIO_ACCOUNTING_MISMATCH');
const out={version:'auryn-v9.6.3',kind:'DECISION_SCENARIO_AUDIT_GATE',fingerprint:a.fingerprint,diagnostics:{decisionDispersion:a.diagnostics.decisionDispersion,scenarioIndependence:a.scenario.independence},failures};
console.log(JSON.stringify(out,null,2));
if(failures.length)process.exit(1);
