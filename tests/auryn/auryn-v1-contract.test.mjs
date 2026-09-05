import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const r=p=>fs.readFileSync(p,'utf8');
test('AURYN brand is wired into metadata and shell',()=>{assert.match(r('app/layout.tsx'),/AURYN — Investment Intelligence/);assert.match(r('components/AppShell.tsx'),/AurynLogo/);assert.doesNotMatch(r('components/AppShell.tsx'),/>Analyze</)});
test('navigation follows new product mental model',()=>{const x=r('components/AppShell.tsx');for(const label of ['Research','Portfolio','Monitor','Lab'])assert.ok(x.includes(label))});
test('research home exposes six evidence families',()=>{const x=r('app/analyze/page.tsx');for(const label of ['Business','Fundamentals','Technicals','Expectations','Catalysts','Risk'])assert.ok(x.includes(label))});
test('portfolio hero exposes decision-grade metrics',()=>{const x=r('components/portfolio/PortfolioPulse.tsx');for(const label of ['YOUR RETURN','SPY','QQQ','CASH','LARGEST POSITION','COST BASIS','CAPITAL PRIORITIES'])assert.ok(x.includes(label))});
test('help affordances are secondary',()=>{const x=r('app/auryn.css');assert.match(x,/\.v658InfoButton\{opacity:\.34!important/);assert.match(x,/@media\(max-width:720px\)[\s\S]*\.v658InfoButton\{opacity:\.24!important/s)});
test('mobile is a first-class four-destination experience',()=>{const x=r('app/auryn.css');assert.match(x,/\.aurynMobileNav\{position:fixed[\s\S]*grid-template-columns:repeat\(4,1fr\)/)});
