import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import postcss from 'postcss';
const sheet=postcss.parse(fs.readFileSync('components/HomeWorkspace.module.css','utf8'));
const declarations=(selector,prop)=>{const values=[];sheet.walkRules(r=>{if(r.selector===selector)r.walkDecls(prop,d=>values.push(d.value));});return values;};
const luminance=hex=>{const rgb=hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
test('Today evidence panels stretch within their grid without a stale self-alignment override',()=>{
 assert.equal(declarations('.home.home.home :global(.home-evidence-layout)','align-items').at(-1),'stretch');
 assert.ok(declarations('.home.home.home :global(.home-evidence-panel)','align-self').every(v=>v==='stretch'||v==='auto'));
});
test('Today event date badge pairs pale accent background with a readable foreground in both themes',()=>{
 const selector='.home.home.home :global(.home-event-day) > time';
 assert.equal(declarations(selector,'background').at(-1),'var(--blue-soft)');
 assert.equal(declarations(selector,'color').at(-1),'var(--date-badge-ink)');
 const fg=declarations('.home','--date-badge-ink').at(-1);
 assert.equal(fg,'#171c27');
 const tokens=postcss.parse(fs.readFileSync('app/core/tokens.css','utf8'));
 for(const selector of [':root',':root[data-theme="dark"]']){
  let bg;tokens.walkRules(r=>{if(r.selector===selector)r.walkDecls('--blue-soft',d=>bg=d.value);});
  assert.ok(bg,selector);assert.ok((luminance(bg)+.05)/(luminance(fg)+.05)>=4.5,selector+' contrast');
 }
});
