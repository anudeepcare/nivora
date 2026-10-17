import test from 'node:test';import assert from 'node:assert/strict';
import {saveAppearance} from '../lib/appearance-persistence.mjs';
import {normalizePreferences,resolveTheme} from '../lib/appearance.mjs';
test('saved account settings contain only normalized appearance preferences',async()=>{
 let sent;const auth={getSession:async()=>({data:{session:{user:{id:'a'}}}}),updateUser:async v=>{sent=v;return{data:{user:{id:'a'}}}}};
 assert.equal((await saveAppearance(auth,{theme:'system',accent:'violet',role:'admin'})).scope,'account');
 assert.deepEqual(sent,{data:{auryn_appearance:normalizePreferences({theme:'system',accent:'violet'})}});
 assert.equal(resolveTheme(sent.data.auryn_appearance.theme,true),'dark');assert.equal(resolveTheme(sent.data.auryn_appearance.theme,false),'light');
});
test('failed remote saves are not reported as account persistence',async()=>{
 await assert.rejects(saveAppearance({getSession:async()=>({data:{session:{}}}),updateUser:async()=>({error:new Error('offline')})},{theme:'dark'}),/offline/);
});
test('signed-out preferences remain device-only without an account write',async()=>{
 const result=await saveAppearance({getSession:async()=>({data:{session:null}}),updateUser:()=>{throw Error('must not write')}},{theme:'light'});assert.equal(result.scope,'device');
});
