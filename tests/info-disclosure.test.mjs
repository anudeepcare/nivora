import test from 'node:test';
import assert from 'node:assert/strict';
import { installInfoDisclosures } from '../lib/info-disclosure.ts';
function setup(){
 class Node {constructor(parent=null){this.parent=parent;}contains(node){for(let n=node;n;n=n.parent)if(n===this)return true;return false;}}
 const handlers=new Map(),rootHandlers=new Map();
 const doc={defaultView:{Node},activeElement:null,addEventListener:(n,f)=>handlers.set(n,f),removeEventListener:n=>handlers.delete(n)};
 const item=()=>{const d=new Node();d.open=false;d.matches=s=>s==='details[data-info-disclosure]';d.summary=new Node(d);d.summary.focus=()=>{doc.activeElement=d.summary;};d.querySelector=()=>d.summary;d.content=new Node(d);return d;};
 const a=item(),b=item();const ordinary=item();ordinary.open=true;
 const root={ownerDocument:doc,querySelectorAll:()=>[a,b].filter(d=>d.open),addEventListener:(n,f)=>rootHandlers.set(n,f),removeEventListener:n=>rootHandlers.delete(n)};
 const cleanup=installInfoDisclosures(root);return {a,b,ordinary,doc,handlers,rootHandlers,cleanup,outside:new Node()};
}
test('outside pointer/click dismiss without preventing form action; inside click stays open',()=>{
 const t=setup();t.a.open=true;t.handlers.get('pointerdown')({target:t.a.content});assert.equal(t.a.open,true);
 const event={target:t.outside,preventDefault:()=>assert.fail('must not block interactions')};t.handlers.get('pointerdown')(event);assert.equal(t.a.open,false);
 t.a.open=true;t.handlers.get('click')(event);assert.equal(t.a.open,false);assert.equal(t.ordinary.open,true);
});
test('opening a different info closes the former and native same-trigger closing remains closed',()=>{
 const t=setup();t.a.open=t.b.open=true;t.rootHandlers.get('toggle')({target:t.b});assert.equal(t.a.open,false);assert.equal(t.b.open,true);
 t.b.open=false;t.rootHandlers.get('toggle')({target:t.b});assert.equal(t.b.open,false);
});
test('Escape restores the active summary; focus outside closes without stealing focus',()=>{
 const t=setup();t.a.open=true;t.doc.activeElement=t.a.content;t.handlers.get('keydown')({key:'Escape'});assert.equal(t.a.open,false);assert.equal(t.doc.activeElement,t.a.summary);
 t.a.open=true;t.doc.activeElement=t.outside;t.handlers.get('focusin')({target:t.outside});assert.equal(t.a.open,false);assert.equal(t.doc.activeElement,t.outside);
 t.cleanup();assert.equal(t.handlers.size,0);assert.equal(t.rootHandlers.size,0);
});
test('workspace owns one controller and only informational source icons opt in', async()=>{
 const {readFileSync}=await import('node:fs');const read=n=>readFileSync(`components/${n}.tsx`,'utf8');
 assert.match(read('Shell'),/useEffect\(\(\) => installInfoDisclosures\(document.body\), \[\]\)/);
 assert.doesNotMatch(read('IndicatorOverview'),/installInfoDisclosures/);
 for(const file of ['IndicatorOverview','OptionsPositioningOverview','MarketCapHistory','CompanyRelationships']) assert.match(read(file),/data-info-disclosure/);
 for(const file of ['FundedScenarios','HoldingsImport','PaceHistoryInsights']) assert.doesNotMatch(read(file),/data-info-disclosure/);
});
