import test from 'node:test';import assert from 'node:assert/strict';
import {normalizePriceTick,mergePriceTick,streamTicker} from '../lib/live-price.ts';
const now=Date.parse('2026-10-19T13:42:00Z');
test('stream parses dated US and crypto trades without accepting unrelated, old or invalid prices',()=>{
 const allowed=new Set(['IREN','ADA/USD']);
 const tick=normalizePriceTick({s:'IREN',p:28,t:now-1000,ms:'open'},'us',allowed,now);assert.equal(tick.session,'Live · regular session');
 assert.equal(normalizePriceTick({s:'ADA-USD',p:'0.4',dc:'2',t:now},'crypto',allowed,now).symbol,'ADA/USD');
 for(const patch of [{p:0},{t:now-121000},{t:now+20000},{s:'APP'},{ms:'closed'}])assert.equal(normalizePriceTick({s:'IREN',p:28,t:now,ms:'open',...patch},'us',allowed,now),null);
 assert.equal(streamTicker('BRK.B'),'BRK-B');
});
test('extended sessions use actual trade time and merging never invents daily change or regress timestamps',()=>{
 const allowed=new Set(['IREN']),pre=Date.parse('2026-10-19T11:00:00Z');assert.equal(normalizePriceTick({s:'IREN',p:28,t:pre,ms:'extended-hours'},'us',allowed,pre).session,'Live · premarket');
 const tick={symbol:'IREN',price:28,asOf:new Date(now).toISOString(),session:'Live · regular session',changePct:null};
 const base={price:27,asOf:'2026-10-19T13:40:00Z',currency:'USD',changePct:1,session:'Market open',source:'test',stale:false,previousClose:25};
 assert.ok(Math.abs(mergePriceTick(base,tick,now).changePct-12)<1e-10);assert.equal(mergePriceTick({...base,previousClose:null},tick,now).changePct,null);
 assert.equal(mergePriceTick({...base,asOf:'2026-10-19T13:43:00Z'},tick,now).price,27);
});

test('relay shares a market socket, scopes delivery and releases subscriptions',async()=>{
 const {PriceStreamHub}=await import('../lib/price-stream-hub.ts');
 const sockets=[];class Fake extends EventTarget{readyState=0;sent=[];constructor(url){super();this.url=url;sockets.push(this);}send(s){this.sent.push(JSON.parse(s));}close(){this.readyState=3;this.dispatchEvent(new Event('close'));}open(){this.readyState=1;this.dispatchEvent(new Event('open'));}message(data){const e=new Event('message');Object.defineProperty(e,'data',{value:JSON.stringify(data)});this.dispatchEvent(e);}}
 const hub=new PriceStreamHub('private-token',url=>new Fake(url)),a=[],b=[];
 const closeA=hub.add('a',['IREN'],e=>a.push(e));const closeB=hub.add('b',['IREN','APP'],e=>b.push(e));assert.equal(sockets.length,1);sockets[0].open();assert.deepEqual(sockets[0].sent[0],{action:'subscribe',symbols:'IREN,APP'});
 sockets[0].message({s:'APP',p:30,t:Date.now(),ms:'open'});assert.equal(a.filter(e=>e.type==='price').length,0);assert.equal(b.filter(e=>e.type==='price').length,1);
 closeB();assert.deepEqual(sockets[0].sent.at(-1),{action:'unsubscribe',symbols:'APP'});closeA();assert.equal(sockets[0].readyState,3);
});
