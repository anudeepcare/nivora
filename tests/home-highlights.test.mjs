import test from 'node:test';import assert from 'node:assert/strict';
import * as inbox from '../lib/research-inbox.ts';
test('Home highlights stay small and prioritize dated events over a news backlog',()=>{
 assert.equal(typeof inbox.homeHighlights,'function');
 const rows=Array.from({length:102},(_,i)=>({id:`A${i}:news:url`,symbol:`A${i}`,date:'2026-11-03',title:'Company update',detail:'News',href:'/research'}));
 rows.push({id:'APP:earnings:2026-11-04',symbol:'APP',date:'2026-11-04',title:'APP · Earnings scheduled today',detail:'Earnings',href:'/research/APP?tab=News'},{id:'alert:a',symbol:'MSFT',date:'2026-11-04',title:'MSFT · Saved alert reached',detail:'Price alert',href:'/alerts'});
 const result=inbox.homeHighlights(rows,'2026-11-04');assert.equal(result.length,2);assert.equal(result[0].symbol,'APP');assert.ok(!result.some(x=>x.id.includes(':news:')));
});
