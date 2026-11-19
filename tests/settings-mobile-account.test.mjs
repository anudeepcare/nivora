import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('final mobile account layout reserves identity width before account actions',()=>{
 const css=readFileSync('components/SettingsPage.module.css','utf8').split('/* Last account-row rule:')[1];
 assert.match(css,/max-width: 600px/); assert.match(css,/display: grid/);
 assert.match(css,/grid-template-columns: 44px minmax\(0, 1fr\)/);
 assert.match(css,/grid-column: 1 \/ -1/); assert.match(css,/min-height: 44px/);
});
test('final mobile header is opaque in each theme with no backdrop dependency',()=>{
 const css=readFileSync('components/WorkspaceShell.module.css','utf8').split('/* Opaque mobile chrome')[1];
 assert.match(css,/background: #fff/); assert.match(css,/data-theme="dark"[\s\S]*background: #080d18/);
 assert.doesNotMatch(css,/rgba\(|blur\(/);
});
