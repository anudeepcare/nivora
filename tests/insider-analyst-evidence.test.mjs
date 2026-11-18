import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import ts from 'typescript';
import {projectEvidence,evidenceSymbol} from '../lib/insider-analyst-evidence.ts';
const cluster={ticker:'A',companyName:'Synthetic A',insiderCount:3,tradeCount:4,totalShares:10,totalValue:100,firstBuyDate:'2026-01-01',lastBuyDate:'2026-01-02'};
const move={moveStartDate:'2026-01-05',moveEndDate:'2026-01-10',movePct:-12,coveringFirms:5,revisedWithMove:2,revisedAgainstMove:1,leftUnchanged:2,calls:[{firm:'Synthetic Firm',analystName:null,attribution:'firm',priceTarget:50,priorPriceTarget:60,publishedOn:'2026-01-02',daysBeforeMove:3}]};
test('clusters preserve preview and stock isolation; absent preview is not zero universe',()=>{
 const raw={isPreview:true,data:[cluster,{...cluster,ticker:'B'}],secret:'excluded'};
 const r=projectEvidence(raw,'clusters','A');assert.equal(r.clusters.length,1);assert.equal(r.isPreview,true);assert.equal(r.totalCount,null);assert.ok(!JSON.stringify(r).includes('secret'));assert.equal(projectEvidence(raw,'clusters','C').clusters.length,0);
 assert.equal(projectEvidence({...raw,data:[{...cluster,insiderCount:2}]},'clusters','A'),null);
 assert.equal(projectEvidence({...raw,data:[{...cluster,totalValue:[100]}]},'clusters','A'),null);
 assert.equal(projectEvidence({...raw,data:[{...cluster,firstBuyDate:'2026-02-30'}]},'clusters','A'),null);
});
test('recorded moves preserve counterevidence counts and firm attribution without scoring',()=>{
 const raw={isPreview:false,totalCount:3,data:{ticker:'A',moves:[move]}};
 const r=projectEvidence(raw,'calls','A');assert.equal(r.moves[0].movePct,-12);assert.equal(r.moves[0].revisedAgainstMove,1);assert.equal(r.moves[0].calls[0].analystName,null);assert.equal(r.totalCount,3);assert.ok(!JSON.stringify(r).includes('accuracy'));
 assert.equal(projectEvidence(raw,'calls','B'),null);assert.equal(projectEvidence({...raw,data:{ticker:'A',moves:[{...move,calls:[{...move.calls[0],publishedOn:'2026-01-06'}]}]}},'calls','A'),null);
 assert.equal(projectEvidence({...raw,isPreview:undefined},'calls','A'),null);assert.equal(evidenceSymbol('A/evil'),null);
});
function load(file,name,b){const ast=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true);const out=ts.transpileModule(ast.statements.filter(n=>!ts.isImportDeclaration(n)).map(n=>n.getText(ast).replace(/^export default /,'').replace(/^export /,'')).join('\n'),{compilerOptions:{target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React}}).outputText;return new Function(...Object.keys(b),out+`;return ${name};`)(...Object.values(b));}
class HttpError extends Error{constructor(m,status){super(m);this.status=status;}}
test('fixed endpoints bound requests, no redirect or provider secret errors',async()=>{
 let requests=[];const read=load('lib/insider-analyst-evidence.server.ts','readInsiderAnalystEvidence',{evidenceSymbol,projectEvidence,HttpError,limit:async()=>{}});
 const fetcher=async(url,options)=>{requests.push(url);assert.equal(options.redirect,'error');return new Response(JSON.stringify({isPreview:true,data:[cluster]}));};
 await read('A','clusters',{key:'synthetic-key',fetcher});assert.equal(requests.length,1);assert.equal(requests[0],'https://app.sentisense.ai/api/v1/insider/cluster-buys?lookbackDays=90');
 for(const status of [401,403,404,429])await assert.rejects(read('A','calls',{key:'synthetic-key',fetcher:async()=>new Response('secret',{status})}),e=>e.status===(status===401?403:status)&&!e.message.includes('secret'));
 await assert.rejects(read('A/evil','calls',{key:'synthetic-key',fetcher}),e=>e.status===400);assert.equal(requests.length,1);
});
test('route stops feature/sample/quota denial before provider',async()=>{
 let calls=0,sample=false,allowed=false;const bindings={HttpError,evidenceSymbol,account:async()=>({user:{id:'synthetic'}}),requestAccess:async()=>({sampleOnly:sample}),requireFeature:()=>{if(!allowed)throw new HttpError('blocked',403);},limit:async()=>{},reserveAccess:async()=>{},readInsiderAnalystEvidence:async()=>{calls++;return{};},privateJson:x=>({status:200}),failure:e=>({status:e.status})};
 const get=load('app/api/research-evidence/[symbol]/route.ts','GET',bindings);const req=()=>new Request('https://local.test/api/research-evidence/A?kind=calls');const args={params:Promise.resolve({symbol:'A'})};
 assert.equal((await get(req(),args)).status,403);allowed=true;sample=true;assert.equal((await get(req(),args)).status,403);assert.equal(calls,0);sample=false;assert.equal((await get(req(),args)).status,200);assert.equal(calls,1);
});

test('evidence component is opt-in and absent preview never claims no buying',()=>{
 let opened=false;const keys=[];
 const View=load('components/InsiderAnalystEvidence.tsx','InsiderAnalystEvidence',{React,useState:()=>[opened,()=>{opened=true;}],useResource:key=>{keys.push(key);return{data:opened?{kind:'clusters',symbol:'A',isPreview:true,sampleCompany:false,totalCount:null,clusters:[],moves:[],source:'Synthetic',retrievedAt:'2026-01-01'}:undefined};},s:{}});
 const props={symbol:'A',kind:'clusters'};
 const closed=renderToStaticMarkup(React.createElement(View,props));assert.deepEqual(keys,[null]);assert.match(closed,/Load cluster evidence/);
 opened=true;const html=renderToStaticMarkup(React.createElement(View,props));assert.match(keys[1],/research-evidence\/A\?kind=clusters/);assert.match(html,/Full cluster coverage is unknown/);assert.doesNotMatch(html,/No cluster for this stock/);
});

test('retrospective evidence rejects future purchase, move and publication dates using UTC as-of',()=>{
 const clusterBody=row=>({isPreview:false,data:[row]});
 assert.equal(projectEvidence(clusterBody({...cluster,firstBuyDate:'2030-01-01',lastBuyDate:'2030-01-02'}),'clusters','A','2026-11-18'),null);
 assert.equal(projectEvidence(clusterBody({...cluster,lastBuyDate:'2026-11-19'}),'clusters','A','2026-11-18'),null);
 assert.equal(projectEvidence(clusterBody({...cluster,lastBuyDate:'2026-11-18'}),'clusters','A','2026-11-18').clusters.length,1);
 const moves=row=>({isPreview:false,totalCount:1,data:{ticker:'A',moves:[row]}});
 assert.equal(projectEvidence(moves({...move,moveEndDate:'2030-01-01'}),'calls','A','2026-11-18'),null);
 assert.equal(projectEvidence(moves({...move,moveStartDate:'2030-01-01',moveEndDate:'2030-01-02',calls:[{...move.calls[0],publishedOn:'2029-12-31'}]}),'calls','A','2026-11-18'),null);
 assert.equal(projectEvidence(moves({...move,moveEndDate:'2026-11-18'}),'calls','A','2026-11-18').moves.length,1);
 assert.equal(projectEvidence(clusterBody(cluster),'clusters','A','not-a-date'),null);
});
