import {createRequire} from 'node:module';const require=createRequire(import.meta.url);import test from 'node:test';import assert from 'node:assert/strict';
const {deriveTradeIntent}=require('../.engine-test/nivora-trade-intent.js');
const base={symbol:'IREN',snapshotId:'snap-1',evidenceFingerprint:'abc',price:50,thesisScore:82,opportunityScore:76,companyScore:74,observedAt:'2026-09-01T14:00:00Z'};
test('BUY creates long entry intent',()=>{const x=deriveTradeIntent({...base,today:{action:'BUY',blocked:false,reason:'aligned',policyVersion:'v60'}});assert.equal(x?.side,'BUY');assert.equal(x?.intentType,'ENTER');assert.equal(x?.requiresApproval,false)});
test('ADD creates add intent',()=>{const x=deriveTradeIntent({...base,today:{action:'ADD',blocked:false,reason:'aligned',policyVersion:'v60'}});assert.equal(x?.intentType,'ADD')});
test('SELL and TRIM create exit intents',()=>{assert.equal(deriveTradeIntent({...base,today:{action:'SELL',blocked:false,reason:'broken',policyVersion:'v60'}})?.intentType,'EXIT');assert.equal(deriveTradeIntent({...base,today:{action:'TRIM',blocked:false,reason:'risk',policyVersion:'v60'}})?.intentType,'TRIM')});
test('WAIT HOLD and NO ACTION create no trade',()=>{for(const action of ['WAIT','HOLD','NO ACTION'])assert.equal(deriveTradeIntent({...base,today:{action,blocked:false,reason:'none',policyVersion:'v60'}}),null)});
test('blocked decision never creates new risk',()=>{assert.equal(deriveTradeIntent({...base,today:{action:'BUY',blocked:true,reason:'veto',policyVersion:'v60'}}),null)});

test('blocked SELL can still create a risk-reducing exit intent',()=>{const x=deriveTradeIntent({...base,today:{action:'SELL',blocked:true,reason:'broken thesis',policyVersion:'v60'}});assert.equal(x?.side,'SELL');assert.equal(x?.intentType,'EXIT')});
