import test from 'node:test';
import assert from 'node:assert/strict';
const model=await import('../.engine-test/auryn/workspace/model.js');
const plan={amount:100,cadence:'monthly',budgetCap:200,maxPositionPct:20,paused:false};
test('contribution settings retain only user preferences, never an order or execution decision',()=>{assert.equal(typeof model.validateContribution,'function');assert.deepEqual(model.validateContribution({...plan,execute:true,userId:'other'}),plan)});
test('contribution settings reject unsafe or malformed money and limits',()=>{assert.equal(typeof model.validateContribution,'function');for(const patch of [{amount:-1},{amount:'100'},{amount:Infinity},{budgetCap:-5},{maxPositionPct:101},{maxPositionPct:0},{cadence:'daily'},{paused:'false'}])assert.throws(()=>model.validateContribution({...plan,...patch}));assert.equal(model.validateContribution({...plan,amount:0,paused:true}).amount,0)});
