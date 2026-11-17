import test from'node:test';
import assert from'node:assert/strict';
import{readFile}from'node:fs/promises';
import{buildCompareCandidates,placeCompareCandidate,renderCompareCandidates}from'../src/public/compare-candidates.js';
const escape=value=>String(value);

test('compare candidates canonicalize saved US aliases without ranking or duplicates',()=>{const value=buildCompareCandidates(['msft','AAPL.US','AAPL','BRK.B.US','<script>']);assert.deepEqual(value,{status:'available',symbols:['AAPL.US','BRK.B.US','MSFT.US']});const html=renderCompareCandidates(value,escape);for(const symbol of value.symbols)assert.match(html,new RegExp(`data-compare-candidate="${symbol.replace('.','\\.')}"`));assert.doesNotMatch(html,/rank|best|recommended|<script>/i)});
test('compare candidate fills the first empty slot and never duplicates a resolved security',()=>{assert.deepEqual(placeCompareCandidate(['AAPL.US','',''],'MSFT'),{status:'placed',slots:['AAPL.US','MSFT.US','']});assert.deepEqual(placeCompareCandidate(['AAPL','MSFT.US',''],'AAPL.US'),{status:'duplicate',slots:['AAPL','MSFT.US','']});assert.deepEqual(placeCompareCandidate(['AAPL.US','MSFT.US','NVDA.US'],'BRK.B.US'),{status:'full',slots:['AAPL.US','MSFT.US','NVDA.US']})});
test('Compare binds saved candidate buttons to visible slots without auto-submitting',async()=>{const source=await readFile(new URL('../src/public/app.js',import.meta.url),'utf8');for(const term of['buildCompareCandidates','renderCompareCandidates','placeCompareCandidate','data-compare-candidate','watchlist.symbols'])assert.ok(source.includes(term),term);assert.doesNotMatch(source,/data-compare-candidate[^\n]+requestSubmit\(\)/)});
