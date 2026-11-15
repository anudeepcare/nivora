import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
test('Research masthead has one dedicated layout owner and compact navigation',()=>{
 assert.match(read('components/Research.tsx'),/ResearchMasthead.module.css/);
 const css=read('components/ResearchMasthead.module.css');
 assert.match(css,/grid-template-columns: minmax\(0, 1fr\) auto/);
 assert.match(css,/min-width: 0/);
 assert.match(read('components/ResearchNavigation.module.css'),/margin: 4px 0 14px/);
});
test('Dark glass uses one neutral navy family, not mixed teal and opaque blue slabs',()=>{
 const css=read('app/core/tokens.css');
 assert.match(css,/--chrome-surface: #111b2c/);
 assert.match(css,/--workspace-glass: #17243bd9/);
 for(const p of ['app/layout.tsx','components/Pwa.tsx','components/Session.tsx']) assert.ok(read(p).includes('#111b2c'));
});
