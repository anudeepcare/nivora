import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import postcss from 'postcss';
const css=readFileSync('components/StockFacts.module.css','utf8');
test('dialog facts use region container breakpoints, overriding viewport six-column defaults',()=>{
 const root=postcss.parse(css);let container=false;root.walkDecls('container-type',d=>{if(d.parent.selector==='.region'&&d.value==='inline-size')container=true});assert.ok(container);
 for(const width of [300,480,1000])assert.ok(css.includes(`@container (min-width: ${width}px)`));
 const rules=[];root.walkRules(r=>{if(r.selector==='.region:not([data-price-context]) .strip')rules.push(r)});
 function columns(width){let count=1;for(const r of rules){if(r.parent.type==='atrule'&&r.parent.name==='container'&&width<Number(r.parent.params.match(/\d+/)[0]))continue; const d=r.nodes.find(x=>x.prop==='grid-template-columns');if(d) count=d.value.includes('--fact-columns')?6:d.value.includes('repeat(3')?3:d.value.includes('repeat(2')?2:1;}return count;}
 for(const viewport of [320,390,768,1024,1440]){const modalContent=Math.min(560,viewport-72);assert.equal(columns(modalContent),modalContent<300?1:modalContent<480?2:3);assert.ok(modalContent/columns(modalContent)>=140);}
});
test('number tokens stay unbroken and dates/help remain available',()=>{
 const tail=css.split('/* Facts may live inside')[1];assert.match(tail,/overflow-wrap: normal/);assert.match(tail,/word-break: normal/);assert.match(tail,/flex-shrink: 0/);
 const source=readFileSync('components/StockFacts.tsx','utf8');assert.match(source,/data-value-type=/);assert.match(source,/\{row.value\}/);assert.match(tail,/white-space: nowrap/);assert.match(source,/<small>\{row.date\}<\/small>/);assert.match(source,/<Help label=\{row.label\}/);
});
