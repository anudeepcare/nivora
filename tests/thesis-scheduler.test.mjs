import test from 'node:test';
import assert from 'node:assert/strict';
import { runThesisQueue } from '../lib/thesis-scheduler.ts';
function fixture({ enabled=true, allowed=true, fail=false }={}) {
 const calls=[];
 const jobs=['alice','bob'].map(user_id=>({user_id,symbol:'APP',lease_token:user_id+'-lease'}));
 const deps={enabled,claim:async n=>{calls.push(['claim',n]);return jobs},eligible:async user=>{calls.push(['access',user]);return allowed},check:async job=>{calls.push(['check',job]);if(fail)throw Error('provider');return true},finish:async(job,ok)=>calls.push(['finish',job,ok])};
 return {calls,deps};
}
test('disabled global job performs no access, claim, provider or write work',async()=>{const f=fixture({enabled:false});assert.deepEqual(await runThesisQueue(f.deps),{enabled:false,processed:0});assert.deepEqual(f.calls,[])});
test('leased work preserves exact account, symbol and token across check and finish',async()=>{const f=fixture();assert.equal((await runThesisQueue(f.deps)).processed,2);assert.deepEqual(f.calls.filter(x=>x[0]==='check').map(x=>x[1]),[{user_id:'alice',symbol:'APP',lease_token:'alice-lease'},{user_id:'bob',symbol:'APP',lease_token:'bob-lease'}]);assert.deepEqual(f.calls[0],['claim',4])});
test('ineligible accounts never fetch evidence and retry without success',async()=>{const f=fixture({allowed:false});await runThesisQueue(f.deps);assert.equal(f.calls.filter(x=>x[0]==='check').length,0);assert.deepEqual(f.calls.filter(x=>x[0]==='finish').map(x=>x[2]),[false,false])});
test('a failed account does not starve the next leased account',async()=>{const f=fixture({fail:true});await runThesisQueue(f.deps);assert.equal(f.calls.filter(x=>x[0]==='check').length,2);assert.deepEqual(f.calls.filter(x=>x[0]==='finish').map(x=>x[2]),[false,false])});
