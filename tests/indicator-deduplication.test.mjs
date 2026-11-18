import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
test('Indicators suppress only repeated range and momentum summaries, preserving standalone risk views', () => {
 const lenses = fs.readFileSync('components/DirectResearchLenses.tsx','utf8');
 const advanced = fs.readFileSync('components/AdvancedResearch.tsx','utf8');
 const dashboard = fs.readFileSync('components/AdvancedDashboard.tsx','utf8');
 assert.match(lenses, /<IndicatorOverview research=\{research\}/);
 assert.match(lenses, /<AdvancedResearch research=\{research\} overviewPresent/);
 assert.match(advanced, /overviewPresent = false/);
 assert.match(advanced, /<AdvancedDashboard research=\{r\} overviewPresent=\{overviewPresent\}/);
 assert.match(dashboard, /overviewPresent = false/);
 assert.match(dashboard, /new Set\(\["atr", "momentum20", "momentum60"\]\)/);
 assert.match(dashboard, /!overviewPresent \|\| !overviewKeys.has\(m.key\)/);
 assert.match(dashboard, /d\.metrics\s*\.slice\(0, 4\)\s*\.filter\(notRepeated\)/);
 assert.match(dashboard, /d\.metrics\s*\.slice\(4\)\s*\.filter\(notRepeated\)/);
 for (const unique of ['drawdown-chart','return-distribution','volatility-comparison']) assert.ok(dashboard.includes(unique));
});
