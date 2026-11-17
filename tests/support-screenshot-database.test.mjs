import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {PGlite} from '@electric-sql/pglite';
test('optional support screenshot is retained privately and idempotently',async()=>{
 const db=new PGlite();try{
 await db.exec('create role anon;create role authenticated;create role service_role bypassrls;');
 for(const f of ['20261025002448_auryn_support_inbox.sql','202611050001_support_screenshot.sql'])await db.exec(fs.readFileSync('supabase/migrations/'+f,'utf8'));
 const body={id:'12345678-1234-4234-8234-123456789012',email:'a@example.com',category:'Technical issue',message:'The chart is not loading',page:'/contact',screenshot:'data:image/jpeg;base64,/9j/AAAA'};
 await db.query('select auryn_submit_support($1::jsonb,$2,$3)',[JSON.stringify(body),'sender','hash']);await db.query('select auryn_submit_support($1::jsonb,$2,$3)',[JSON.stringify(body),'sender','hash']);
 const r=await db.query('select screenshot from auryn_support_requests');assert.equal(r.rows.length,1);assert.equal(r.rows[0].screenshot,body.screenshot);
 for(const role of ['anon','authenticated'])assert.equal((await db.query("select has_table_privilege($1,'auryn_support_requests','SELECT') as allowed",[role])).rows[0].allowed,false);
 }finally{await db.close()}
});
