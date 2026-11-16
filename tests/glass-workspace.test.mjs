import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const tokens=fs.readFileSync('app/core/tokens.css','utf8');
function luminance(hex){const rgb=hex.match(/\w\w/g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;}
function contrast(a,b){const x=luminance(a.slice(1)),y=luminance(b.slice(1));return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
test('workspace uses shared responsive geometry and a single reference-aligned glass surface',()=>{
 for(const token of ['workspace-gap','workspace-radius','workspace-inset','workspace-glass','workspace-canvas','workspace-edge','workspace-shadow']) assert.match(tokens,new RegExp(`--${token}:`));
 assert.match(fs.readFileSync('app/core/foundation.css','utf8'),/background: var\(--app-background\)/);
 assert.match(fs.readFileSync('app/core/primitives.css','utf8'),/padding: var\(--workspace-inset\)/);
});
test('neutral text maintains readable contrast in light and dark workspace themes',()=>{
 for(const selector of [':root[data-theme="light"]',':root[data-theme="dark"]']){
  const block=tokens.slice(tokens.indexOf(selector)).split('}')[0];
  const color=key=>block.match(new RegExp(`--${key}: (#[a-f0-9]{6});`))[1];
  assert.ok(contrast(color('ink'),color('card'))>=7);
  assert.ok(contrast(color('muted'),color('card'))>=4.5);
 }
});
