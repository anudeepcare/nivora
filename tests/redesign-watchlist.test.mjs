import test from 'node:test';
import assert from 'node:assert/strict';
import {saveWatchlistSymbol} from '../lib/watchlist.mjs';
function client({existing={id:'owned-list'},readError=null,writeError=null}={}) {
 const calls=[];
 return {calls,from(table){const q={select(){return q},eq(key,value){calls.push({key,value});return q},limit(){return q},async maybeSingle(){return {data:existing,error:readError}},insert(payload){calls.push({table,payload});return q},async single(){return {data:{id:'created-list'}}},async upsert(payload,options){calls.push({table,payload,options});return {error:writeError}}};return q}};
}
test('saving a symbol includes the owning watchlist and authenticated user',async()=>{const c=client();await saveWatchlistSymbol(c,'user-1','IREN');assert.deepEqual(c.calls.at(-1).payload,{watchlist_id:'owned-list',user_id:'user-1',symbol:'IREN'});assert.deepEqual(c.calls[0],{key:'user_id',value:'user-1'});});
test('missing list is created before its item',async()=>{const c=client({existing:null});await saveWatchlistSymbol(c,'user-1','BTC/USD');assert.equal(c.calls.at(-1).payload.watchlist_id,'created-list');});
test('read failure prevents writes',async()=>{const c=client({readError:Error('RLS denied')});await assert.rejects(saveWatchlistSymbol(c,'user-1','IREN'),/RLS denied/);assert.equal(c.calls.length,1);});
test('write failure is propagated to UI',async()=>{const c=client({writeError:Error('Unable to save')});await assert.rejects(saveWatchlistSymbol(c,'user-1','IREN'),/Unable to save/);});
