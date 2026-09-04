import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const page=fs.readFileSync('app/portfolio/page.tsx','utf8');
const pulse=fs.readFileSync('components/portfolio/PortfolioPulse.tsx','utf8');
const xray=fs.readFileSync('components/portfolio/PortfolioXRay.tsx','utf8');
const css=fs.readFileSync('app/globals.css','utf8');

test('portfolio has one holdings experience and no duplicate intelligence table',()=>{
 assert.ok(!page.includes('HoldingsIntelligence'));
 assert.ok(!pulse.includes('PortfolioActionCenter'));
 assert.ok(!pulse.includes('pulseDecisionRail'));
});

test('missing history and classification do not render giant junk states',()=>{
 assert.ok(!pulse.includes('pulseHistoryEmpty'));
 assert.ok(!pulse.includes('Not enough actual history'));
 assert.ok(!xray.includes('Building'));
 assert.ok(!xray.includes('Unknown'));
});

test('portfolio adds compact analyst and useful xray modes',()=>{
 assert.match(pulse,/Portfolio analyst/i);
 assert.match(xray,/Sector/);
 assert.match(xray,/Theme/);
 assert.match(xray,/Risk/);
});

test('metric info retains visible circular i affordance',()=>{
 assert.match(css,/\.v658InfoButton[^}]*border-radius\s*:\s*50%/s);
});
