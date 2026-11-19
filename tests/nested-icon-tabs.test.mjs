import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
test('nested views retain labelled buttons and explicit decorative icons without changing the main research bar',()=>{
 for(const name of ['ResearchWorkspace','SentiSensePanels','MarketMood']) {
  const s=fs.readFileSync(`components/${name}.tsx`,'utf8');
  assert.match(s,/data-nested-navigation/);
  assert.match(s,/aria-hidden="true"[^>]*data-nav-icon|data-nav-icon[^>]*aria-hidden="true"/);
  assert.match(s,/aria-pressed=/);
 }
 const s=fs.readFileSync('components/ResearchWorkspace.tsx','utf8');
 assert.match(s,/navigateSelection\(event\)/);
 assert.match(s,/preserveState/);
 assert.match(s,/aria-controls=/);
 assert.doesNotMatch(fs.readFileSync('components/Research.tsx','utf8'),/data-nested-navigation/);
});
test('nested tabs use theme-safe, bounded icon and text layout with visible keyboard focus',()=>{
 const css=fs.readFileSync('app/core/nested-navigation.css','utf8');
 for(const pattern of [/min-height: 44px/,/flex-wrap: wrap/,/min-width: 0/,/font-weight: 500/,/font-size: 14px/,/:focus-visible/,/aria-pressed="true"/,/mask-image/,/forced-colors/]) assert.match(css,pattern);
 assert.doesNotMatch(css,/font-weight: [789]00|border-top:|linear-gradient/);
 assert.match(fs.readFileSync('app/layout.tsx','utf8'),/nested-navigation.css/);
});
