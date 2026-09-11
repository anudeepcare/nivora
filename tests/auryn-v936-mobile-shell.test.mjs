import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const root=new URL('../',import.meta.url).pathname;
const read=p=>fs.readFileSync(root+p,'utf8');

test('premium stylesheet loads after legacy product styles',()=>{
 const layout=read('app/layout.tsx');
 const legacy=layout.indexOf('auryn-product.css');
 const premium=layout.indexOf('auryn-premium.css');
 assert.ok(legacy>=0&&premium>legacy);
});

test('375px mobile contract prevents page overflow and uses two-column key metrics',()=>{
 const css=read('app/auryn-premium.css');
 assert.match(css,/@media\(max-width:760px\)/);
 assert.match(css,/\.v936MetricGrid\{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/s);
 assert.match(css,/overflow-x:hidden/);
 assert.match(css,/\.aurynBottomNav/);
});

test('premium shell defines modern surface, shadow and radius tokens',()=>{
 const css=read('app/auryn-premium.css');
 assert.match(css,/--v936-surface/);
 assert.match(css,/--v936-radius/);
 assert.match(css,/--v936-shadow/);
});
