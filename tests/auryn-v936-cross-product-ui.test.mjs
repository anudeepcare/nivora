import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const root=new URL('../',import.meta.url).pathname;
const read=p=>fs.readFileSync(root+p,'utf8');

test('Portfolio Monitor and Trading Lab expose premium page roots',()=>{
 assert.match(read('app/portfolio/page.tsx'),/aurynPortfolioPage/);
 assert.match(read('app/alerts/page.tsx'),/aurynAlertsPage/);
 assert.match(read('app/trading-lab/page.tsx'),/aurynLabPage/);
});

test('premium stylesheet styles all three product surfaces',()=>{
 const css=read('app/auryn-premium.css');
 assert.match(css,/\.aurynPortfolioPage/);
 assert.match(css,/\.aurynAlertsPage/);
 assert.match(css,/\.aurynLabPage/);
 assert.match(css,/\.aurynMonitorSummary/);
});
