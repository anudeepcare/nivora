import test from 'node:test';import assert from 'node:assert/strict';
import {scaleStones,scaleBalance,scaleLayout} from '../lib/decision-scale.ts';import {demoData} from './fixtures/demo.ts';
const r=demoData.research.MSFT;
test('stones come only from existing evidence and have unique ids, valid sides and weights',()=>{
 const s=scaleStones(r);const ids=new Set(s.map(x=>x.id));assert.equal(ids.size,s.length);
 for(const x of s){assert.ok(x.side==='for'||x.side==='against');assert.ok([1,2,3].includes(x.weight));assert.ok(x.title.length>0&&x.detail.length>0);}
});
test('missing company evidence never creates stones or throws',()=>{
 const bare={...r,evidence:undefined,history:[]};
 assert.doesNotThrow(()=>scaleStones(bare));
 for(const x of scaleStones(bare)) assert.ok(!/NaN|undefined/.test(x.title+x.detail+(x.fact??'')));
});
test('balance weighs only what is kept on the scale and tilts toward the heavier side',()=>{
 const stones=[{id:'a',side:'for',weight:1},{id:'b',side:'for',weight:2},{id:'c',side:'against',weight:3},{id:'d',side:'against',weight:1}];
 let x=scaleBalance(stones);assert.equal(x.forWeight,3);assert.equal(x.againstWeight,4);assert.equal(x.lean,'even');assert.ok(x.tilt>0);
 x=scaleBalance(stones,['c']);assert.equal(x.againstWeight,1);assert.equal(x.lean,'supportive');assert.ok(x.tilt<0);
 x=scaleBalance(stones,['a','b']);assert.equal(x.lean,'cautious');
 x=scaleBalance([],[]);assert.equal(x.lean,'even');assert.equal(x.tilt,0);
 assert.equal(scaleBalance([{id:'z',side:'against',weight:3},{id:'y',side:'against',weight:3},{id:'x',side:'against',weight:3}]).tilt,14);
});
test('pan layout stays inside the pan and wraps upward',()=>{
 const l=scaleLayout([3,3,3,3,3]);assert.equal(l.length,5);
 for(const p of l){assert.ok(p.cx-p.r>=-48.01&&p.cx+p.r<=48.5);assert.ok(p.cy<0);}
 assert.ok(Math.min(...l.map(p=>p.cy))<l[0].cy);
 assert.deepEqual(scaleLayout([]),[]);
});
