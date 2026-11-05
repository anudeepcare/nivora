import test from 'node:test';import assert from 'node:assert/strict';
import {supportInput} from '../lib/support-input.ts';
const input={id:'12345678-1234-4234-8234-123456789012',email:'a@example.com',category:'Technical issue',message:'The chart is not loading',page:'/contact',diagnostics:{version:'0.2.0-rc.2',page:'/research/APP?token=secret',viewport:'390×844',holdings:'PRIVATE'}};
test('opt-in diagnostics append only bounded version, coarse page and viewport',()=>{const out=supportInput(input);assert.match(out.message,/0.2.0-rc.2/);assert.match(out.message,/\/research\/\[symbol\]/);assert.ok(!out.message.includes('APP'));assert.ok(!out.message.includes('PRIVATE'));assert.ok(!out.message.includes('secret'));});
test('no diagnostic input means no diagnostic attachment',()=>{assert.equal(supportInput({...input,diagnostics:undefined}).message,input.message)});
test('screenshots accept bounded JPEG data only and reject active formats',()=>{
 assert.throws(()=>supportInput({...input,screenshot:'data:image/svg+xml;base64,PHN2Zz4='}),/JPEG/);
 assert.throws(()=>supportInput({...input,screenshot:'data:image/jpeg;base64,'+'/9j/'+ 'A'.repeat(410001)}),/large/);
 assert.equal(supportInput({...input,screenshot:'data:image/jpeg;base64,/9j/AAAA'}).screenshot,'data:image/jpeg;base64,/9j/AAAA');
});
