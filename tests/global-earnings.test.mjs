import { providerFixtureFunction } from "./helpers/sentisense-transport.mjs";
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import ts from 'typescript';
import {globalEarnings,earningsWindow,calendarDate} from '../lib/global-earnings.ts';
const window={from:'2026-11-18',to:'2026-12-01'};
const row={ticker:'EXMP',companyName:'Example',earningsDate:'2026-11-21',earningsTime:'unknown',confirmed:false,fiscalQuarter:null,estimatedEps:0,estimatedRevenue:1000000,actualEps:null,actualRevenue:null,callTime:null,webcastUrl:null};
const fixture=()=>({isPreview:true,totalCount:20,data:{earnings:[{...row}],metadata:{source:'sentisense',windowStart:'2026-11-18',windowEnd:'2026-11-24',count:1,generatedAt:1794956400}}});
test('Eastern day boundaries and valid ISO dates are explicit, including legitimate weekends',()=>{
 assert.deepEqual(earningsWindow(7,new Date('2026-11-18T03:00:00Z')),{from:'2026-11-17',to:'2026-11-23'});assert.equal(earningsWindow(8),null);assert.equal(calendarDate('2026-02-30'),false);
 const x=globalEarnings(fixture(),window,'2026-11-18T12:00:00Z');assert.equal(x.events[0].date,'2026-11-21');assert.equal(x.events[0].session,'unknown');assert.equal(x.events[0].confirmed,false);assert.equal(x.events[0].eps,0);assert.equal(x.events[0].revenue,1000000);assert.equal(x.preview,true);assert.equal(x.totalCount,20);
});
test('confirmation, offset call times, URLs and report status never inferred from schedule',()=>{
 const f=fixture();Object.assign(f.data.earnings[0],{confirmed:true,callTime:'2026-11-22T10:00:00-05:00',webcastUrl:'https://example.com/call',actualEps:0});const x=globalEarnings(f,window,'2026-11-18T12:00:00Z');assert.equal(x.events[0].reported,true);assert.equal(x.events[0].callTime,'2026-11-22T10:00:00-05:00');
 Object.assign(f.data.earnings[0],{confirmed:false,actualEps:null});const y=globalEarnings(f,window,'2026-11-18T12:00:00Z');assert.equal(y.events[0].webcast,null);assert.equal(y.events[0].callTime,null);assert.equal(y.events[0].reported,false);
 Object.assign(f.data.earnings[0],{confirmed:true,callTime:'2026-11-22T10:00:00',webcastUrl:'javascript:alert(1)'});const z=globalEarnings(f,window,'2026-11-18T12:00:00Z');assert.equal(z.events[0].webcast,null);assert.equal(z.events[0].callTime,null);
});
test('schema/window/count inconsistencies reject; malformed rows counted; no arbitrary fields exposed',()=>{
 for(const mutate of [f=>f.isPreview='false',f=>f.data.metadata.source='other',f=>f.data.metadata.count=2,f=>f.data.metadata.windowStart='2026-11-01',f=>{f.data.earnings.push({...row});f.data.metadata.count=2;}]){const f=fixture();mutate(f);assert.equal(globalEarnings(f,window,'2026-11-18T12:00:00Z'),null);}
 const f=fixture();f.data.earnings[0].secret='SECRET_MARKER_NEVER_EXPORT';assert.ok(!JSON.stringify(globalEarnings(f,window,'2026-11-18T12:00:00Z')).includes('SECRET_MARKER_NEVER_EXPORT'));
 f.data.earnings[0].confirmed='yes';const x=globalEarnings(f,window,'2026-11-18T12:00:00Z');assert.equal(x.omitted,1);assert.equal(x.events.length,0);
});
function route({sample=false,allowed=true}={}){const calls=[];class HttpError extends Error{constructor(m,status){super(m);this.status=status}}
 const src=fs.readFileSync('app/api/global-earnings/route.ts','utf8');const ast=ts.createSourceFile('route.ts',src,ts.ScriptTarget.Latest,true);const js=ts.transpileModule(ast.statements.filter(n=>!ts.isImportDeclaration(n)).map(n=>n.getText(ast).replace(/^export /,'')).join('\n'),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
 const bindings={HttpError,earningsWindow,account:async()=>({user:{id:'test'}}),requestAccess:async()=>({sampleOnly:sample}),requireFeature:(_,f)=>{calls.push(f);if(!allowed)throw new HttpError('Forbidden',403)},limit:async()=>calls.push('limit'),reserveAccess:async()=>calls.push('reserve'),readGlobalEarnings:async w=>{calls.push('provider');return w},privateJson:x=>x,failure:e=>({status:e.status})};return {calls,get:providerFixtureFunction(...Object.keys(bindings),js+';return GET')(...Object.values(bindings))};}
test('route gates before fetch and rejects duplicate/unsupported parameters',async()=>{
 for(const opts of [{sample:true},{allowed:false}]){const h=route(opts);assert.equal((await h.get(new Request('https://app.test/api/global-earnings'))).status,403);assert.ok(!h.calls.includes('provider'));}
 for(const query of ['days=99','days=7&days=14','ticker=AAPL']){const h=route();assert.equal((await h.get(new Request('https://app.test/api/global-earnings?'+query))).status,400);assert.ok(!h.calls.includes('provider'));}
 const h=route();await h.get(new Request('https://app.test/api/global-earnings?days=14'));assert.deepEqual(h.calls,['overview','analysts','limit','reserve','provider']);
});
test('UI distinguishes scope, preview and no-results, filters local rows, preserves safe links',()=>{const s=fs.readFileSync('components/GlobalEarningsCalendar.tsx','utf8');for(const text of ['curated US equity universe','Limited provider preview','does not establish','Company confirmed','Estimated date','noopener noreferrer'])assert.ok(s.includes(text));assert.match(s,/!e.reported/);assert.match(s,/slice\(page \* 25/);});
test('server uses fixed bounded authenticated request, preserves cache receipt time and neutralizes failures',async()=>{
 const {createHash}=await import('node:crypto');const {readBoundedMarketJson}=await import('../lib/market-response.ts');
 class HttpError extends Error{constructor(m,status){super(m);this.status=status}}
 const src=fs.readFileSync('lib/global-earnings.server.ts','utf8');const ast=ts.createSourceFile('s.ts',src,ts.ScriptTarget.Latest,true);
 const js=ts.transpileModule(ast.statements.filter(n=>!ts.isImportDeclaration(n)).map(n=>n.getText(ast).replace(/^export /,'')).join('\n'),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
 const read=providerFixtureFunction('createHash','globalEarnings','readBoundedMarketJson','HttpError','limit',js+';return readGlobalEarnings')(createHash,globalEarnings,readBoundedMarketJson,HttpError,async()=>{});
 let calls=0;const fetcher=async(url,options)=>{calls++;assert.equal(new URL(url).origin,'https://app.sentisense.ai');assert.equal(new URL(url).pathname,'/api/v1/calendar/earnings');assert.equal(options.redirect,'error');assert.equal(options.cache,'no-store');assert.equal(options.headers['X-SentiSense-API-Key'],'fixture-key');return new Response(JSON.stringify(fixture()));};
 const first=await read(window,{key:'fixture-key',fetcher}),second=await read(window,{key:'fixture-key',fetcher});assert.equal(calls,1);assert.equal(first.retrievedAt,second.retrievedAt);
 await assert.rejects(read(window,{key:'other-key',fetcher:async()=>new Response('SECRET_PROVIDER_DETAIL',{status:403})}),e=>e.status===403&&!e.message.includes('SECRET'));
 await assert.rejects(read(window,{key:'large-key',fetcher:async()=>new Response('x'.repeat(2100000))}),e=>e.status===502);
});
test('Eastern day cache key rolls over and stale client day is rejected before provider work',async()=>{
 const s=fs.readFileSync('components/GlobalEarningsCalendar.tsx','utf8');assert.match(s,/days=\$\{days\}&day=/);assert.match(s,/key=\{`\$\{days\}:\$\{day\}`\}/);assert.match(s,/window.setInterval\(update, 60000\)/);assert.match(s,/300000/);assert.match(s,/loaded\s+view\s+can\s+be\s+older/);
 const h=route();assert.equal((await h.get(new Request('https://app.test/api/global-earnings?days=14&day=2000-01-01'))).status,400);assert.ok(!h.calls.includes('provider'));
});
