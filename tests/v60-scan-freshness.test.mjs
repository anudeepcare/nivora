import {createRequire} from 'node:module';const require=createRequire(import.meta.url);import test from 'node:test';import assert from 'node:assert/strict';
const {freshnessDistribution}=require('../.engine-test/nivora-scan-freshness.js');
test('freshness distribution reports universe percentages',()=>{assert.deepEqual(freshnessDistribution(1000,820,950,990),{under24h:820,under7d:950,under30d:990,staleOver30d:10,under24hPct:82,under7dPct:95,under30dPct:99})});
