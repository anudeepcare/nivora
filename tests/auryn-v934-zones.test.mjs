import test from 'node:test';import assert from 'node:assert/strict';
const {buildStructuralPriceMap}=await import('../.engine-test/auryn/v934/zones.js').catch(()=>({}));
function makeBars(n=260){const out=[];let p=70;for(let i=0;i<n;i++){const wave=Math.sin(i/9)*2.4+Math.sin(i/31)*4.2;const close=70+i*.16+wave;const open=p;const high=Math.max(open,close)+1.4+(i%7===0?1.2:0);const low=Math.min(open,close)-1.2-(i%11===0?1.5:0);const volume=1_000_000*(1+(i%13)/18)+(i>220?250_000:0);out.push({datetime:new Date(Date.UTC(2025,0,1+i)).toISOString().slice(0,10),open,high,low,close,volume});p=close}return out}

test('structural price map is deterministic and publishes evidence for every actionable level',()=>{const b=makeBars();const a=buildStructuralPriceMap(b,[]);const c=buildStructuralPriceMap(b,[]);assert.deepEqual(a,c);assert.ok(a);for(const k of ['preferredEntry','confirm','support','invalidation','t1','t2'])assert.notEqual(a[k],undefined);assert.ok(a.zones.length>1);assert.ok(a.zones.every(z=>z.evidence.length>0));assert.ok(a.preferredEntry?.evidence.length);});

test('action map ordering is coherent for a normal long setup',()=>{const m=buildStructuralPriceMap(makeBars(),[]);assert.ok(m&&m.preferredEntry&&m.confirm&&m.support&&m.invalidation&&m.t1&&m.t2);assert.ok(m.invalidation<m.support);assert.ok(m.preferredEntry.low<=m.preferredEntry.high);assert.ok(m.preferredEntry.high<=m.confirm);assert.ok(m.confirm<m.t1);assert.ok(m.t1<m.t2);});

test('identical completed bars keep levels stable regardless of a hypothetical live price tick',()=>{const b=makeBars();const a=buildStructuralPriceMap(b,[]);const copy=b.map(x=>({...x}));const c=buildStructuralPriceMap(copy,[]);assert.deepEqual(a,c);});
