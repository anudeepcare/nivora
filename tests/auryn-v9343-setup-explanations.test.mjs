import test from 'node:test';
import assert from 'node:assert/strict';
import {describeSetupState} from '../.engine-test/auryn/v934/setup-explanations.js';

test('BREAKOUT_READY explains confirmation and is not an automatic BUY',()=>{
 const x=describeSetupState({setup:'BREAKOUT_READY',newMoneyAction:'WAIT',confirm:47.57,invalidation:40.38});
 assert.match(x.meaning,/resistance|breakout/i);
 assert.match(x.actionImplication,/not an automatic buy|wait/i);
 assert.match(x.confirmation,/47\.57/);
 assert.match(x.invalidation,/40\.38/);
});

test('DOUBLE_BOTTOM explains seller exhaustion and neckline confirmation',()=>{
 const x=describeSetupState({setup:'DOUBLE_BOTTOM',newMoneyAction:'START_SMALL',confirm:28.54,invalidation:24.26});
 assert.match(x.meaning,/two|support|seller/i);
 assert.match(x.confirmation,/neckline|28\.54/i);
 assert.match(x.actionImplication,/reversal candidate|not an automatic buy/i);
});

test('TREND_BREAKDOWN explains damaged structure without equating it to SELL',()=>{
 const x=describeSetupState({setup:'TREND_BREAKDOWN',newMoneyAction:'AVOID',confirm:28.54,invalidation:24.26});
 assert.match(x.meaning,/deteriorat|damaged|trend/i);
 assert.match(x.actionImplication,/not an automatic sell|new money/i);
 assert.match(x.invalidation,/24\.26/);
});

test('unknown setup stays factual and does not invent pattern meaning',()=>{
 const x=describeSetupState({setup:'SOMETHING_NEW',newMoneyAction:'WAIT',confirm:null,invalidation:null});
 assert.match(x.meaning,/classified market-structure state/i);
 assert.match(x.actionImplication,/does not equal buy or sell/i);
});
