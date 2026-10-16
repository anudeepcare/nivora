import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
function load(){const m={exports:{}};new Function('module','exports',ts.transpileModule(fs.readFileSync('lib/research-discovery.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(m,m.exports);return m.exports;}
test('exact ticker wins over a company name prefix',()=>{const x=load().rankSearchResults('app',[{symbol:'AAPL',name:'Apple'},{symbol:'APP',name:'AppLovin'},{symbol:'APPB',name:'Applied'}]);assert.equal(x[0].symbol,'APP');});
test('empty search has no promoted ticker list',()=>{assert.deepEqual(load().rankSearchResults('',[{symbol:'IREN',name:'IREN'}]),[]);});
test('search discards invalid results, deduplicates and caps count',()=>{const x=load().rankSearchResults('a',[null,{symbol:'../bad',name:'Bad'},{symbol:'AAPL',name:'Apple'},{symbol:'AAPL',name:'Apple'},...Array.from({length:20},(_,i)=>({symbol:'A'+i,name:'Asset '+i}))]);assert.equal(x.length,7);assert.ok(!x.some(x=>x.symbol.includes('..')));});
test('recent research is bounded, validated and never invented',()=>{const x=load().mergeRecentResearch([{symbol:'APP',name:'AppLovin',visitedAt:'2026-10-16T01:00:00Z'},{symbol:'<script>',name:'bad'}],{symbol:'BTC/USD',name:'Bitcoin',visitedAt:'2026-10-16T02:00:00Z'});assert.deepEqual(x.map(x=>x.symbol),['BTC/USD','APP']);assert.deepEqual(load().mergeRecentResearch(null),[]);});
