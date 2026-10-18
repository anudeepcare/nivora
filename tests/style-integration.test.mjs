import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const postcss=require('postcss');

test('the imported integration sheet styles the current React shell and home feed',()=>{
  const source=fs.readFileSync(new URL('../app/globals.css',import.meta.url),'utf8');
  const css=postcss.parse(source);
  const selectors=new Set();
  css.walkRules(rule=>rule.selectors.forEach(s=>selectors.add(s)));
  // These elements differ from the static foundation's #app, #main and button nav.
  // Replacing this sheet with that foundation left them visibly unstyled.
  for(const selector of ['.product','.content','.desktop-nav a','.brand-link','.skip','.skip:focus','.page-heading','.updates-grid','.update-row','.context-highlights','.mobile-dock a']) {
    assert.ok(selectors.has(selector),`Missing integration for ${selector}`);
  }
  const foundation=fs.readFileSync(new URL('../app/studio-foundation.css',import.meta.url),'utf8');
  assert.notEqual(source.slice(0,400),foundation.slice(0,400),'The integration sheet must not be overwritten by another foundation copy');
});
