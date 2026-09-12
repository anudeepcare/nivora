import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root=new URL('../',import.meta.url);

test('V9.6.3 release gate verifies deterministic audit fixture',()=>{
 const r=spawnSync(process.execPath,['scripts/run_v963_release_gate.mjs'],{cwd:root,encoding:'utf8'});
 assert.equal(r.status,0,r.stderr||r.stdout);
 assert.match(r.stdout,/DECISION_SCENARIO_AUDIT_GATE/);
 assert.match(r.stdout,/"failures": \[\]/);
});

test('audit CLI writes machine-readable non-mutating report',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'auryn-v963-'));
 const output=path.join(dir,'audit.json');
 const r=spawnSync('npm',['run','audit:v963-decisions','--','--input','tests/fixtures/v963-decision-audit-fixture.json','--output',output],{cwd:root,encoding:'utf8'});
 assert.equal(r.status,0,r.stderr||r.stdout);
 const report=JSON.parse(fs.readFileSync(output,'utf8'));
 assert.equal(report.schemaVersion,'auryn-v9.6.3-decision-scenario-audit-1');
 assert.equal(report.total,11);
 assert.equal(report.note,'Diagnostic only. V9.6.3 does not tune production decision thresholds or scenario values.');
 assert.match(report.fingerprint,/^[a-f0-9]{64}$/);
});
