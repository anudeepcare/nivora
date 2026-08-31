import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const investor=fs.readFileSync(new URL('../lib/nivora-investor.ts',import.meta.url),'utf8');
const intel=fs.readFileSync(new URL('../lib/nivora-intelligence.ts',import.meta.url),'utf8');
const hero=fs.readFileSync(new URL('../components/InvestorDecisionHero.tsx',import.meta.url),'utf8');

test('technicals do not enter fundamental thesis formula',()=>{
  const block=investor.slice(investor.indexOf('// Fundamental thesis'),investor.indexOf('const thesisScore'));
  assert.ok(!/trend|momentum|flow|entry|extension/.test(block),'technical timing leaked into thesis formula');
});

test('Wall Street target is not NIVORA valuation',()=>{
  const valBlock=investor.slice(investor.indexOf('function valuationScore'),investor.indexOf('function buildZones'));
  assert.ok(!/targetMean|priceTarget/.test(valBlock),'analyst target leaked into independent valuation model');
});

test('legacy intelligence is an adapter to the canonical engine',()=>{
  assert.match(intel,/buildInvestorDecision/);
  assert.match(intel,/one canonical investment engine/i);
});

test('UI does not call data coverage calibrated confidence',()=>{
  assert.match(hero,/DATA COVERAGE/);
  assert.match(hero,/Model confidence: \{decision\.modelConfidenceLabel\}/);
});

test('price map exposes tiered execution zones',()=>{
  assert.match(investor,/Starter \/ first support/);
  assert.match(investor,/Accumulate \/ major support/);
  assert.match(investor,/Strong accumulate only with intact thesis/);
  assert.match(investor,/Do not chase \/ resistance/);
});
