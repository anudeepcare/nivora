import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

function run(){return JSON.parse(execFileSync(process.execPath,['scripts/audit_v9343_decision_distribution.mjs','--json'],{encoding:'utf8'}));}

test('decision distribution audit proves every action is reachable and is deterministic',()=>{
 const a=run(),b=run();
 assert.equal(a.version,'auryn-v9.3.4.3');
 for(const action of ['STRONG_BUY','BUY','START_SMALL','WAIT','AVOID'])assert.ok((a.counts[action]||0)>0,`${action} must be reachable`);
 assert.equal(a.fingerprint,b.fingerprint);
 assert.deepEqual(a.counts,b.counts);
});

test('distribution audit has no legacy HOLD wait-veto reason',()=>{
 const a=run();
 assert.equal(a.violations.length,0);
 assert.ok(!Object.keys(a.reasonCounts).some(x=>/legacy.*hold|hold.*wait/i.test(x)));
});
