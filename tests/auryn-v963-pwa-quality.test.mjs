import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const themes=fs.readFileSync(new URL('../app/auryn-themes.css',import.meta.url),'utf8');
const mobile=fs.readFileSync(new URL('../app/auryn-mobile.css',import.meta.url),'utf8');

test('standalone iOS root owns theme chrome while app shell owns page canvas',()=>{
  assert.match(themes,/@media\(display-mode:standalone\) and \(max-width:760px\)\{[\s\S]*html,body\{background:var\(--auryn-chrome\)!important\}[\s\S]*\.aurynAppShell\{background:var\(--auryn-page-bg\)!important\}/);
});

test('mobile masthead allows status copy to wrap instead of truncating',()=>{
  assert.match(mobile,/\.aurynStockMobileMeta span\{[^}]*white-space:normal!important[^}]*overflow:visible!important/s);
  assert.match(mobile,/\.aurynStockMobilePrimary\{[^}]*grid-template-columns:minmax\(0,1fr\) minmax\(118px,auto\)!important/s);
  assert.match(mobile,/\.aurynStockMobilePrice small\{[^}]*max-width:none!important[^}]*white-space:normal!important/s);
});

test('evidence tabs make horizontal overflow intentional',()=>{
  assert.match(mobile,/\.aurynEvidenceNav\{[^}]*scroll-snap-type:x proximity!important[^}]*scroll-padding-inline:8px!important/s);
  assert.match(mobile,/\.aurynEvidenceNav button,.aurynEvidenceNav a\{[^}]*scroll-snap-align:start!important/s);
  assert.match(mobile,/\.aurynEvidenceNav:after\{[^}]*position:sticky!important[^}]*right:0!important/s);
});

test('text size preference no longer globally rescales core product copy',()=>{
  assert.doesNotMatch(themes,/\[data-text-size="large"\] \.aurynAppMain p/);
  assert.doesNotMatch(themes,/\[data-text-size="large"\] \.aurynEvidenceNav/);
  assert.match(themes,/\[data-text-size="large"\] :where\(\.aurynSupportText,\.aurynSecondaryText,\.aurynHelperText,\.aurynProductFooter/);
});
