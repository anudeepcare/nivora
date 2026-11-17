import test from 'node:test';
import assert from 'node:assert/strict';
import { edgeReading } from '../lib/auryn-edge.ts';
const good = { business: 'strong', value: 'supported', timing: 'favorable', severeRisk: false, conflicting: false, freshQuote: true, confirmedPace: 3, formingPace: 4, assetType: 'stock' };
test('Edge supports building only with aligned business, value and timing evidence',()=>assert.equal(edgeReading(good).verdict,'Build'));
test('forming Pace cannot upgrade a confirmed pause',()=>assert.equal(edgeReading({...good,confirmedPace:0}).verdict,'Wait'));
test('severe risk cannot be averaged away by favorable inputs',()=>assert.equal(edgeReading({...good,severeRisk:true}).verdict,'Review exposure'));
test('missing and conflicting evidence cannot produce an entry verdict',()=>{
 assert.equal(edgeReading({...good,conflicting:true}).verdict,'Evidence needed');
 assert.equal(edgeReading({...good,freshQuote:false}).verdict,'Wait');
 assert.equal(edgeReading({...good,value:'unestablished'}).verdict,'Wait');
});
test('crypto cannot inherit a company fundamental verdict',()=>assert.equal(edgeReading({...good,assetType:'crypto'}).verdict,'Price review'));
test('mixed timing limits a supported business to a small start',()=>assert.equal(edgeReading({...good,timing:'mixed'}).verdict,'Begin small'));
test('Pace preserves the confirmed price reading despite financial conflict',()=>{
 assert.equal(edgeReading({...good,confirmedPace:1,formingPace:4}).pace,1);
 assert.equal(edgeReading({...good,conflicting:true}).pace,3);
 assert.equal(edgeReading({...good,confirmedPace:null}).pace,null);
});
test('an existing holding can be monitored without treating a pause as a sell',()=>{
 assert.equal(edgeReading({...good,ownsPosition:true,value:'demanding'}).verdict,'Hold & monitor');
 assert.equal(edgeReading({...good,ownsPosition:true,severeRisk:true}).verdict,'Review exposure');
});
