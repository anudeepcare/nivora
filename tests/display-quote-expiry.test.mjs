import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const mod={exports:{}};
new Function('exports',ts.transpileModule(fs.readFileSync('lib/auryn/market-price-authority.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(mod.exports);
const now=Date.parse('2026-10-16T15:00:00Z');
const quote={symbol:'MSFT',price:100,providerTimestamp:new Date(now-10000).toISOString(),retrievedAt:new Date(now).toISOString(),session:'REGULAR',displayState:'LIVE',freshness:'LIVE'};
test('retained live flags expire without a successful new request',()=>{
 assert.equal(mod.exports.isDisplayQuoteLive(quote,'MSFT','REGULAR',now),true);
 assert.equal(mod.exports.isDisplayQuoteLive(quote,'MSFT','REGULAR',now+91000),false);
 assert.equal(mod.exports.isDisplayQuoteLive({...quote,retrievedAt:new Date(now+240000).toISOString()},'MSFT','REGULAR',now+240000),false);
});
test('session transitions, unknown timestamps and future observations cannot stay live',()=>{
 for(const q of [{...quote,providerTimestamp:null},{...quote,providerTimestamp:new Date(now+60000).toISOString()},{...quote,freshness:'STALE'},{...quote,price:0}])assert.equal(mod.exports.isDisplayQuoteLive(q,'MSFT','REGULAR',now),false);
 assert.equal(mod.exports.isDisplayQuoteLive(quote,'MSFT','AFTER_HOURS',now),false);
 assert.equal(mod.exports.isDisplayQuoteLive({...quote,session:'CLOSED'},'MSFT','CLOSED',now),false);
 assert.equal(mod.exports.isDisplayQuoteLive({...quote,session:'CRYPTO_24X7'},'MSFT','CRYPTO_24X7',now),true);
});
