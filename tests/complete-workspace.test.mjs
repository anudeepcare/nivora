import test from 'node:test';import assert from 'node:assert/strict';
import {workspacePreferences} from '../lib/workspace-preferences.ts';
import {researchInbox} from '../lib/research-inbox.ts';
test('upcoming-event sort and visible metrics survive preference validation',()=>{const p=workspacePreferences({watchSort:'event',visibleMetrics:['business','price','invalid','price']});assert.equal(p.watchSort,'event');assert.deepEqual(p.visibleMetrics,['business','price']);});
test('checklist includes scoped dated news, changes and unread alerts without future or duplicate entries',()=>{
 const common={today:'2026-11-04',events:[],positions:[],followed:['APP'],news:[{symbol:'APP',date:'2026-11-04',title:'Quarterly report',url:'https://example.com/report'},{symbol:'OTHER',date:'2026-11-04',title:'Other',url:'https://example.com/other'},{symbol:'APP',date:'2026-11-06',title:'Future',url:'https://example.com/future'}],changes:[{symbol:'APP',at:'2026-11-04',changes:['Confirmed Pace changed from P1 to P2.']}],alerts:[{id:'a',symbol:'APP',created_at:'2026-11-04T12:00:00Z',read_at:null,message:'Price level reached'}]};
 const rows=researchInbox(common);assert.equal(rows.length,3);assert.equal(new Set(rows.map(x=>x.id)).size,3);assert.ok(rows.some(x=>x.title.includes('update')));assert.ok(rows.some(x=>x.detail.includes('Pace')));assert.ok(rows.some(x=>x.detail.includes('Price level')));
});
