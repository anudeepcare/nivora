import test from 'node:test';import assert from 'node:assert/strict';
import { supportInput } from '../lib/support-input.ts';
const body={id:'00000000-0000-4000-8000-000000000001',category:'Technical issue',email:'person@example.com',message:'The search control does not open.',page:'/research/APP'};
test('support validates categories and bounded messages',()=>{
 assert.equal(supportInput(body).email,'person@example.com');
 assert.throws(()=>supportInput({...body,category:'arbitrary'}));
 assert.throws(()=>supportInput({...body,email:'a\r\nb@example.com'}));
 assert.throws(()=>supportInput({...body,message:'x'.repeat(5001)}));
});
test('support strips query parameters and never accepts external page URLs',()=>{
 assert.equal(supportInput({...body,page:'/research?token=secret'}).page,'/research');
 assert.equal(supportInput({...body,page:'https://external.example'}).page,'/contact');
});
test('support requires a stable request id and rejects honeypot spam',()=>{
 assert.throws(()=>supportInput({...body,id:'bad'}));
 assert.throws(()=>supportInput({...body,website:'spam'}));
});
