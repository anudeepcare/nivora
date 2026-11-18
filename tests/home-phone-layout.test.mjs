import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=name=>readFileSync(`components/${name}.module.css`,'utf8');
test('320px shell preserves all utilities, reducing only the wordmark',()=>{
 assert.match(css('WorkspaceShell'),/@media \(max-width: 360px\)[\s\S]*\.shell \.brand span \{ display: none;/);
 assert.doesNotMatch(css('WorkspaceShell').split('/* Four 44px utilities')[1],/\.actions.*display: none/);
});
test('phone followed prices use three columns with the chart on a second row',()=>{
 const phone=css('HomeWorkspace').split('/* Preserve name, price and trend')[1];
 assert.match(phone,/max-width: 430px/);
 assert.match(phone,/grid-template-columns: 32px minmax\(0, 1fr\) auto/);
 assert.match(phone,/grid-column: 2 \/ -1;\s*grid-row: 2/);
});
test('phone graph cards remain legible across 320 through 430 widths',()=>{
 const phone=css('HomeMarketCards').split('/* Keep chart labels')[1];
 assert.match(phone,/max-width: 430px/); assert.match(phone,/grid-template-columns: minmax\(0, 1fr\)/);
 assert.match(phone,/min-width: 44px; height: 44px/);
});
test('public phone workflow and conversion controls can reflow without fixed height',()=>{
 const phone=css('PublicLanding').slice(css('PublicLanding').lastIndexOf('@media (max-width: 430px)'));
 assert.match(phone,/grid-template-columns: minmax\(0, 1fr\)/);
 assert.match(phone,/min-height: 0/); assert.match(phone,/flex-wrap: wrap/);
});
