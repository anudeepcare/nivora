import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import ts from 'typescript';
import {screenInput,screenRows} from '../lib/stock-screener.ts';
test('screen input permits documented fields and finite bounded numeric conditions only',()=>{
 assert.deepEqual(screenInput({field:'PRICE',op:'GTE',value:0}),{field:'PRICE',op:'GTE',value:0});
 for(const v of [null,[],{field:'URL',op:'GTE',value:1},{field:'PRICE',op:'OR',value:1},{field:'PRICE',op:'GTE',value:[1]},{field:'PRICE',op:'GTE',value:Infinity},{field:'PRICE',op:'GTE',value:-1},{field:'ANALYST_COUNT',op:'GTE',value:1.5},{field:'PRICE',op:'GTE',value:1,endpoint:'evil'}])assert.equal(screenInput(v),null);
});
test('closed results preserve missing versus zero, dates in milliseconds, and truncation',()=>{
 const v=screenRows({matched:200,results:[{ticker:'AAPL',currentPrice:12,priceAsOf:1760449500000,changePercent:0,analystCount:0,secret:'hidden',lastUpdated:123,sentiSenseScore7D:40}]});
 assert.equal(v.matched,200);assert.equal(v.results[0].priceAsOf,1760449500000);assert.equal(v.results[0].changePercent,0);assert.equal(v.results[0].marketCap,null);assert.equal(v.results[0].analystCount,0);assert.ok(!JSON.stringify(v).includes('secret'));assert.ok(!JSON.stringify(v).includes('sentiSenseScore'));
 assert.equal(screenRows({matched:1,results:[{ticker:'BAD/URL'}]}),null);
 assert.equal(screenRows({matched:0,results:[{ticker:'A'}]}),null);
 assert.equal(screenRows({matched:2,results:[{ticker:'A'},{ticker:'A'}]}),null);
 assert.equal(screenRows({matched:101,results:Array.from({length:101},(_,i)=>({ticker:`S${i}`}))}),null);
 assert.equal(screenRows({matched:1,results:[{ticker:'A',currentPrice:[2],priceAsOf:null,lastUpdated:123}]}).results[0].priceAsOf,null);
});
function loader(file,bindings){const ast=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true);const src=ast.statements.filter(n=>!ts.isImportDeclaration(n)).map(n=>n.getText(ast).replace(/^export /,'')).join('\n');const out=ts.transpileModule(src,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;return new Function(...Object.keys(bindings),out+';return runStockScreen;')(...Object.values(bindings));}
class HttpError extends Error{constructor(m,status){super(m);this.status=status;}}
test('transport uses one fixed POST with limit100, no redirects or raw error leakage',async()=>{
 let calls=0,quota=0;const run=loader('lib/stock-screener.server.ts',{screenInput,screenRows,HttpError,limit:async()=>{quota++;}});
 const fetcher=async(url,init)=>{calls++;assert.equal(url,'https://app.sentisense.ai/api/v1/screener/execute');assert.equal(init.redirect,'error');assert.equal(init.method,'POST');assert.equal(JSON.parse(init.body).limit,100);assert.equal(init.headers['X-SentiSense-API-Key'],'test-only');return new Response(JSON.stringify({matched:0,results:[]}));};
 assert.equal((await run({field:'PRICE',op:'GTE',value:2},{key:'test-only',fetcher})).matched,0);assert.equal(calls,1);assert.equal(quota,1);
 await assert.rejects(run({field:'evil'},{key:'test-only',fetcher}),e=>e.status===400);assert.equal(calls,1);
 for(const status of [401,403,429])await assert.rejects(run({field:'PRICE',op:'GTE',value:2},{key:'test-only',fetcher:async()=>new Response('secret',{status})}),e=>e.status===(status===429?429:403)&&!e.message.includes('secret'));
 await assert.rejects(run({field:'PRICE',op:'GTE',value:2},{key:'test-only',fetcher:async()=>{throw Error('secret');}}),e=>e.status===503&&!e.message.includes('secret'));
});
test('route guards account deployment feature and research allowance before provider',()=>{
 const s=fs.readFileSync('app/api/stock-screener/route.ts','utf8');
 for(const term of ['account(request','access.sampleOnly','requireFeature(access','reserveAccess(user.id','stock-screener:${user.id}'])assert.ok(s.replace(/\s+/g,'').includes(term.replace(/\s+/g,'')));
 assert.ok(s.indexOf('await reserveAccess')<s.indexOf('await runStockScreen'));
 const ui=fs.readFileSync('components/StockScreener.tsx','utf8');assert.doesNotMatch(ui,/useEffect|setInterval|SENTISENSE_API/);assert.match(ui,/Run screen/);assert.match(ui,/Time not supplied/);
});
test('route blocks sample, feature, invalid input and exhausted quota before any provider request',async()=>{
 const file='app/api/stock-screener/route.ts',ast=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true);
 const code=ts.transpileModule(ast.statements.filter(n=>!ts.isImportDeclaration(n)).map(n=>n.getText(ast).replace(/^export /,'')).join('\n'),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
 let sample=false,allowed=true,quota=true,calls=0;
 const bindings={HttpError,screenInput,account:async()=>({user:{id:'synthetic'}}),requestAccess:async()=>({sampleOnly:sample,features:{analysts:true,technicals:true}}),requireFeature:()=>{if(!allowed)throw new HttpError('blocked',403);},limit:async()=>{},reserveAccess:async()=>{if(!quota)throw new HttpError('quota',429);},runStockScreen:async()=>{calls++;return{results:[]};},privateJson:x=>({status:200,data:x}),failure:e=>({status:e.status})};
 const post=new Function(...Object.keys(bindings),code+';return POST;')(...Object.values(bindings));
 const request=(body={field:'PRICE',op:'GTE',value:2})=>new Request('https://local.test/api/stock-screener',{method:'POST',body:JSON.stringify(body)});
 sample=true;assert.equal((await post(request())).status,403);sample=false;allowed=false;assert.equal((await post(request())).status,403);allowed=true;
 assert.equal((await post(request({field:'URL'}))).status,400);quota=false;assert.equal((await post(request())).status,429);assert.equal(calls,0);
 quota=true;assert.equal((await post(request())).status,200);assert.equal(calls,1);
});

test('future quote timestamps are withheld, never replaced by retrieval or snapshot time',()=>{
 const r=screenRows({matched:1,results:[{ticker:'A',priceAsOf:2000,lastUpdated:1}]},1000);
 assert.equal(r.results[0].priceAsOf,null);
});
test('locked analyst and technical filters stop acquisition; price screens redact both domains',async()=>{
 const file='app/api/stock-screener/route.ts',ast=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true);
 const code=ts.transpileModule(ast.statements.filter(n=>!ts.isImportDeclaration(n)).map(n=>n.getText(ast).replace(/^export /,'')).join('\n'),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
 let calls=0;const features={overview:true,analysts:false,technicals:false};
 const bindings={HttpError,screenInput,account:async()=>({user:{id:'synthetic'}}),requestAccess:async()=>({sampleOnly:false,features}),requireFeature:(a,f)=>{if(!a.features[f])throw new HttpError('blocked',403);},limit:async()=>{},reserveAccess:async()=>{},runStockScreen:async()=>{calls++;return{results:[{ticker:'A',currentPrice:12,analystCount:5,analystTargetUpsidePct:20,return1Y:30,volatility30D:40}]};},privateJson:x=>({status:200,data:x}),failure:e=>({status:e.status})};
 const post=new Function(...Object.keys(bindings),code+';return POST;')(...Object.values(bindings));
 const request=field=>new Request('https://local.test/api/stock-screener',{method:'POST',body:JSON.stringify({field,op:'GTE',value:2})});
 for(const field of ['ANALYST_COUNT','ANALYST_TARGET_UPSIDE_PCT','RETURN_1Y','VOLATILITY_30D'])assert.equal((await post(request(field))).status,403);
 assert.equal(calls,0);const response=await post(request('PRICE'));assert.equal(response.status,200);assert.equal(response.data.results[0].currentPrice,12);
 for(const k of ['analystCount','analystTargetUpsidePct','return1Y','volatility30D'])assert.equal(response.data.results[0][k],null);
 assert.deepEqual(response.data.withheld,['Analyst data','Technical data']);
 features.analysts=true;const allowed=await post(request('ANALYST_COUNT'));assert.equal(allowed.data.results[0].analystCount,5);assert.equal(allowed.data.results[0].return1Y,null);
});
