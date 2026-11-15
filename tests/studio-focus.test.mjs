import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import postcss from 'postcss';
const read=p=>fs.readFileSync(p,'utf8');
test('approved glass chrome has a theme-aware visible keyboard focus indicator',()=>{
 const css=read('components/WorkspaceShell.module.css');
 assert.match(css,/\.shell :is\(\.nav, \.dock, \.actions\) :is\(a, button\):focus-visible/);
 assert.match(css,/outline: 2px solid var\(--blue\)/);
 const luminance=h=>h.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
 for(const [fg,bg] of [['#245bdb','#f4f8ff'],['#9fc2ff','#142631']]){const a=luminance(fg),b=luminance(bg);assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=3);}
});
test('historical periods are explicitly grouped with the chart and keep all nine ranges',()=>{
 const source=read('components/Research.tsx');
 assert.match(source,/className="chart-period-label">Price history range/);
 assert.match(source,/role="group" aria-label="Price history range"/);
 for(const range of ['1D','1W','1M','3M','6M','YTD','1Y','5Y','ALL']) assert.ok(source.includes(`"${range}"`));
 assert.match(source,/setRange\(x\)/);
});
test('reduced transparency makes the approved chrome opaque in both themes',()=>{
 const root=postcss.parse(read('components/WorkspaceShell.module.css'));
 let found=false; root.walkAtRules('media',a=>{if(a.params==='(prefers-reduced-transparency: reduce)')a.walkRules(r=>{if(r.selector.includes('.shell .header')&&r.selector.includes('.shell .dock'))r.walkDecls('background',d=>{if(d.value==='var(--chrome-surface)')found=true;});});});
 assert.ok(found);
});
