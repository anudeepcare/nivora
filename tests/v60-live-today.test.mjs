import {createRequire} from 'node:module';const require=createRequire(import.meta.url);import test from 'node:test';import assert from 'node:assert/strict';
const {applyLiveQuoteToToday}=require('../.engine-test/nivora-live-today.js');
const q={symbol:'IREN',price:50,regularClose:45,change:5,changePct:11.1,session:'PRE_MARKET',isExtendedHours:true,providerTimestamp:'2026-09-01T12:00:00Z',ageSeconds:5,freshness:'LIVE',provider:'twelvedata',isRealTime:true};
test('large extended-hours gap blocks chasing without changing thesis',()=>{const x=applyLiveQuoteToToday({action:'BUY',blocked:false,reason:'aligned',policyVersion:'v59'},q,false);assert.equal(x.action,'WAIT');assert.match(x.reason,/will not chase/i)});
test('owner add becomes hold during large extended-hours gap',()=>{const x=applyLiveQuoteToToday({action:'ADD',blocked:false,reason:'aligned',policyVersion:'v59'},q,true);assert.equal(x.action,'HOLD')});
