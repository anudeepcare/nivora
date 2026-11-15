import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import postcss from 'postcss';
test('always-dark desktop and mobile chrome retain a high-contrast keyboard focus indicator',()=>{
 const root=postcss.parse(fs.readFileSync('components/WorkspaceShell.module.css','utf8'));
 const luminance=h=>h.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
 for(const [media,selector] of [['(min-width: 1000px)','.shell .header :is(a, button):focus-visible'],['(max-width: 767px)','.shell .dock a:focus-visible']]){
 let outline='';root.walkAtRules('media',rule=>{if(rule.params===media)rule.walkRules(selector,r=>r.walkDecls('outline',d=>outline=d.value));});
 const color=outline.match(/#[a-f0-9]{6}/)?.[0];assert.ok(color,selector);
 const a=luminance(color),b=luminance('#172c36');assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=3,selector);
 }
});
test('historical periods are explicitly grouped with the chart and keep all nine ranges',()=>{
 const source=fs.readFileSync('components/Research.tsx','utf8');
 assert.match(source,/className="chart-period-label">Price history range/);
 assert.match(source,/role="group" aria-label="Price history range"/);
 for(const range of ['1D','1W','1M','3M','6M','YTD','1Y','5Y','ALL']) assert.ok(source.includes(`"${range}"`));
 assert.match(source,/setRange\(x\)/);
});
test('reduced transparency makes only the always-dark chrome opaque',()=>{
 const root=postcss.parse(fs.readFileSync('components/WorkspaceShell.module.css','utf8'));
 for(const [media,selector] of [['(prefers-reduced-transparency: reduce) and (min-width: 1000px)','.shell .header'],['(prefers-reduced-transparency: reduce) and (max-width: 767px)','.shell .dock']]){
  let background;root.walkAtRules('media',a=>{if(a.params===media)a.walkRules(selector,r=>r.walkDecls('background',d=>background=d.value));});
  assert.equal(background,'#172c36');
 }
});
