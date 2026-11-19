import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
test('empty calendar uses compact full-width status while keeping real news and coverage states',()=>{
 const src=fs.readFileSync('components/HomeWorkspace.tsx','utf8');
 const css=fs.readFileSync('components/HomeWorkspace.module.css','utf8');
 assert.match(src,/data-calendar-empty=\{!eventGroups.length && !brief.reported.length\}/);
 assert.match(css,/\[data-calendar-empty="true"\][^{]*\{[^}]*grid-template-columns: minmax\(0, 1fr\)/s);
 assert.match(css,/\.home-events-panel[\s\S]*align-self: start/);
 assert.match(css,/grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
 assert.match(src,/Calendar coverage is incomplete/);
 assert.match(src,/Missing coverage does not mean no events/);
 assert.match(src,/headlines.slice\(0, 6\).map\(renderHeadline\)/);
 assert.ok(src.indexOf('title="What changed"') < src.indexOf('<PortfolioDay'));
});
test('secondary holdings comparison keeps totals beside bounded contribution rows on desktop',()=>{
 const css=fs.readFileSync('components/PortfolioDay.module.css','utf8');
 assert.match(css,/grid-template-columns: minmax\(240px, 0.65fr\) minmax\(0, 1fr\)/);
 assert.match(css,/grid-template-columns: 72px minmax\(70px, 1fr\) max-content/);
 assert.match(css,/@container holdings-snapshot \(max-width:360px\)/);
});
