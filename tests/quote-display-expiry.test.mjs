import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const module={exports:{}};
new Function('module','exports',ts.transpileModule(fs.readFileSync('lib/auryn/market-price-authority.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(module,module.exports);
const live=module.exports.isDisplayQuoteLive;
const now=Date.parse('2026-10-16T15:00:00Z');
const quote={symbol:'AAPL',price:200,session:'REGULAR',displayState:'LIVE',freshness:'LIVE',providerTimestamp:new Date(now-10000).toISOString(),retrievedAt:new Date(now).toISOString()};
test('retained live quotes expire without another provider response',()=>{
 assert.equal(live(quote,'AAPL','REGULAR',now),true);
 assert.equal(live(quote,'AAPL','REGULAR',now+91000),false);
 assert.equal(live({...quote,retrievedAt:new Date(now).toISOString(),providerTimestamp:new Date(now-181000).toISOString()},'AAPL','REGULAR',now),false);
});
test('closed session, wrong symbol, invalid and future timestamps cannot claim live',()=>{
 for(const [q,s,session] of [[quote,'AAPL','CLOSED'],[quote,'MSFT','REGULAR'],[{...quote,providerTimestamp:'bad'},'AAPL','REGULAR'],[{...quote,providerTimestamp:new Date(now+10000).toISOString()},'AAPL','REGULAR']])assert.equal(live(q,s,session,now),false);
});
test('crypto is live only while its provider and request timestamps remain fresh',()=>{
 const q={...quote,symbol:'BTC/USD',session:'CRYPTO_24X7',providerTimestamp:new Date(now-240000).toISOString()};
 assert.equal(live(q,'BTC/USD','CRYPTO_24X7',now),true);
 assert.equal(live({...q,providerTimestamp:new Date(now-301000).toISOString()},'BTC/USD','CRYPTO_24X7',now),false);
});
