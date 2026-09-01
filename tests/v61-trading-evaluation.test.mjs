import {createRequire} from 'node:module';const require=createRequire(import.meta.url);import test from 'node:test';import assert from 'node:assert/strict';
const {explainNoIntent}=require('../.engine-test/nivora-trading-evaluation.js');
test('SELL with no paper position explains there is nothing to exit',()=>{const x=explainNoIntent({action:'SELL',blocked:true,reason:'bearish',policyVersion:'v60'},false);assert.equal(x.code,'NO_POSITION');assert.match(x.reason,/No paper position exists to exit/) });
test('HOLD explains no trade is authorized',()=>{const x=explainNoIntent({action:'HOLD',blocked:false,reason:'hold',policyVersion:'v60'},false);assert.equal(x.code,'NO_INTENT');assert.match(x.reason,/does not authorize/) });
