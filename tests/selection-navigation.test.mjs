import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { nextSelectionIndex, navigateSelection } from '../lib/selection-navigation.ts';
test('navigation wraps and handles boundary keys without consuming activation',()=>{
 assert.equal(nextSelectionIndex('ArrowRight',2,3),0);
 assert.equal(nextSelectionIndex('ArrowLeft',0,3),2);
 assert.equal(nextSelectionIndex('Home',2,3),0);
 assert.equal(nextSelectionIndex('End',0,3),2);
 for(const key of ['Enter',' ','Tab','ArrowDown']) assert.equal(nextSelectionIndex(key,1,3),null);
 assert.equal(nextSelectionIndex('End',0,0),null);
});
test('keyboard navigation focuses one enabled sibling without activating it',()=>{
 const focused=[]; const buttons=[0,1,2].map(i=>({focus:()=>focused.push(i)})); let prevented=0;
 navigateSelection({key:'ArrowRight',target:buttons[0],currentTarget:{querySelectorAll:s=>{assert.match(s,/:not\(:disabled\)/);return buttons;}},preventDefault:()=>prevented++});
 assert.deepEqual(focused,[1]); assert.equal(prevented,1);
});
function lum(hex){return hex.match(/\w\w/g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((a,x,i)=>a+x*[.2126,.7152,.0722][i],0);}
const ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
test('explicit selected and inactive colors exceed normal text contrast in both themes',()=>{
 assert.ok(ratio('24324a','e9edf6')>=4.5);
 assert.ok(ratio('e7edf8','26344b')>=4.5);
 assert.ok(ratio('465064','f7f8fc')>=4.5);
 assert.ok(ratio('c4ccda','111b2b')>=4.5);
 const css=fs.readFileSync('app/core/surfaces.css','utf8');
 for(const token of ['#e9edf6','#24324a','#26344b','#e7edf8','#465064','#f7f8fc','#c4ccda','#111b2b']) assert.ok(css.includes(token));
 assert.match(css,/data-selection-navigation/);
});
test('shared workspace and nested navigation opt into selection treatment',()=>{
 for(const file of ['ResearchWorkspace','Research','AdvancedResearch','SentiSensePanels','DecisionInsights','TargetsEstimates']) assert.match(fs.readFileSync(`components/${file}.tsx`,'utf8'),/data-selection-navigation/);
});

test('selected research tabs use quiet emphasis not saturated aqua, bold or underlined text',()=>{const css=fs.readFileSync('app/core/surfaces.css','utf8');const block=css.slice(css.indexOf('/* Explicit opt-in: research view navigation'));assert.doesNotMatch(block,/#79eadc|text-decoration: underline|font-weight: 600/);assert.match(block,/font-weight: 500/);assert.match(block,/text-decoration: none/);assert.match(block,/border-color: var\(--selection-border\)/);assert.match(block,/:focus-visible/);});
