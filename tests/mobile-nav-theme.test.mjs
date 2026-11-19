import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync('components/WorkspaceShell.module.css','utf8');
test('mobile selection shares desktop navigation palette instead of obsolete olive',()=>{
 assert.doesNotMatch(css,/#647a13/);
 assert.match(css,/\.shell \.dock a\[aria-current="page"\]\s*\{\s*color: var\(--nav-active\)/);
 assert.match(css,/\.shell \.dock a\[aria-current="page"\]::after/);
 assert.match(css,/background: var\(--nav-solid\)/);
 assert.match(css,/--nav-solid: #ffffff/);assert.match(css,/--nav-solid: #080d18/);
});
test('mobile navigation preserves touch targets, safe area and visible focus',()=>{
 assert.match(css,/min-height: 48px/);
 assert.match(css,/env\(safe-area-inset-bottom/);
 assert.match(css,/\.shell \.dock a:focus-visible/);
 assert.match(css,/outline: 2px solid var\(--blue\)/);
 assert.match(css,/repeat\(5, minmax\(0, 1fr\)\)/);
});
