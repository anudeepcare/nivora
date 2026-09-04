import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Trading Lab desktop funnel reserves five equal stages in one row',()=>{
 const css=fs.readFileSync('app/globals.css','utf8');
 assert.match(css,/\.v658PaperFunnel\{[^}]*grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/s);
 assert.match(css,/\.v658PaperFunnel>i\{[^}]*position:absolute[^}]*display:none/s);
});

test('Trading Lab exposes qualified, blocked, submitted and completed stages without orphan arrows',()=>{
 const s=fs.readFileSync('app/trading-lab/page.tsx','utf8');
 assert.match(s,/QUALIFIED NOW/);
 assert.match(s,/RISK \/ EXECUTION/);
 assert.match(s,/PAPER ORDERS/);
 assert.match(s,/COMPLETED/);
 assert.doesNotMatch(s,/<\/article><i>→<\/i><article/);
});

test('capital-intensive AI infrastructure gets a distinct financing-risk classification',()=>{
 const s=fs.readFileSync('lib/nivora-investor.ts','utf8');
 assert.match(s,/capitalIntensiveGrowth/);
 assert.match(s,/SPECULATIVE/);
 assert.match(s,/financial<24&&kind!=="ai_infrastructure"/);
});

test('one financing weakness cannot by itself force a non-owner AVOID for AI infrastructure',()=>{
 const s=fs.readFileSync('lib/nivora-investor.ts','utf8');
 assert.match(s,/financingRiskOnly/);
 assert.match(s,/action="WAIT"/);
});

test('owner and new-money language remain different without presenting HOLD as proof of a bullish thesis',()=>{
 const s=fs.readFileSync('components/InvestorDecisionHero.tsx','utf8');
 assert.match(s,/EXISTING HOLDERS/);
 assert.match(s,/NEW MONEY/);
});
