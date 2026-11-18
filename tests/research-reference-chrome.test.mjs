import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8');
test('primary lenses remain flat icon and text tabs with a restrained selected underline',()=>{
 const css=read('components/ReferenceCockpit.module.css');
 assert.doesNotMatch(css,/--tab-accent|linear-gradient\(90deg, #79eadc/);
 assert.match(css,/background: var\(--research-selection-mark\)/);
 assert.match(css,/--research-tab-ink: #a6b2c5/);
 assert.match(css,/font-size: 13px/);
 assert.match(read('components/Research.tsx'),/ResearchTabIcon section=\{lens.sections\[0\]\}/);
});
test('secondary choices share one compact surface and wrap safely on phones',()=>{
 const css=read('app/core/surfaces.css').split('/* Secondary research navigation')[1];
 assert.match(css,/width: fit-content/);assert.match(css,/max-width: 100%/);
 assert.match(css,/flex-wrap: wrap/);assert.match(css,/overflow-wrap: anywhere/);
 assert.match(css,/--selection-fill: #ffffff/);assert.match(css,/--selection-fill: #26344b/);
 assert.doesNotMatch(css,/border-color: var\(--workspace-accent/);
});
const lum=h=>h.match(/\w\w/g).map(x=>parseInt(x,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
const contrast=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
test('actual main and secondary text palette has normal text contrast in both themes',()=>{
 for(const [text,fill] of [['536176','f8fafc'],['a6b2c5','0b121f'],['465064','e5e9f0'],['24324a','ffffff'],['c4ccda','111b2b'],['e7edf8','26344b']]) assert.ok(contrast(text,fill)>=4.5,`${text} on ${fill}`);
});
