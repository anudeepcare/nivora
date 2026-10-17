#!/usr/bin/env node
/**
 * Current-release local Chromium QA. Run AFTER a production build and local start.
 * Never use this runner against a deployed account. No external writes are sent.
 *
 * Fixture build (do not deploy its output):
 * NEXT_PUBLIC_SUPABASE_URL=https://visual.supabase.co NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=visual-public-test-key npm run build
 * npm run start -- --hostname 127.0.0.1 --port 3102
 * AURYN_TEST_URL=http://127.0.0.1:3102 node scripts/verify-product-recovery-browser.mjs
 *
 * Optional: PLAYWRIGHT_MODULE_PATH, CHROMIUM_EXECUTABLE_PATH, CHROMIUM_ARGS (JSON),
 * AURYN_BROWSER_WIDTHS=320,375,390,430,768,1280,1440,1920,
 * AURYN_BROWSER_THEMES=light,dark, AURYN_BROWSER_GROUPS=routes,research,interactions,
 * AURYN_BROWSER_OUT=verification/next-build/browser-fixture (new/empty directory).
 */
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const root=fileURLToPath(new URL('../',import.meta.url));
const mode=process.env.AURYN_BROWSER_MODE||'fixture';
assert.ok(['fixture','public'].includes(mode),'AURYN_BROWSER_MODE must be fixture or public');
const base=new URL(process.env.AURYN_TEST_URL||'http://127.0.0.1:3102');
assert.ok(['127.0.0.1','localhost','[::1]'].includes(base.hostname),'Only a local release server is permitted');
assert.ok(!base.username&&!base.password&&base.protocol==='http:','Use credential-free local HTTP');
const out=path.resolve(root,process.env.AURYN_BROWSER_OUT||`verification/next-build/browser-${mode}`);
assert.ok(out.startsWith(path.join(root,'verification','next-build')+path.sep),'Output must be isolated under verification/next-build');
fs.mkdirSync(path.join(out,'screenshots'),{recursive:true});
assert.ok(!fs.existsSync(path.join(out,'report.json')),'Use a new AURYN_BROWSER_OUT to preserve existing run evidence');
const widths=(process.env.AURYN_BROWSER_WIDTHS||'390,1440').split(',').map(Number);
assert.ok(widths.every(n=>Number.isInteger(n)&&n>=320&&n<=3840),'Invalid responsive widths');
const themes=(process.env.AURYN_BROWSER_THEMES||'light,dark').split(',');
assert.ok(themes.every(s=>['light','dark'].includes(s)),'Invalid themes');
const groups=(process.env.AURYN_BROWSER_GROUPS||'routes,research,interactions').split(',');
const playwright=process.env.PLAYWRIGHT_MODULE_PATH|| (process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'):'playwright');
const {chromium}=require(playwright);
const read=name=>JSON.parse(fs.readFileSync(path.join(root,'verification',name),'utf8'));
const fixture=read('research-fixture.json');
// Compile pure local model modules only to make source-correct synthetic fixture responses.
// This is a browser adapter, not a claim of server execution or RLS validation.
function fixtureModel(file){const ts=require('typescript'),module={exports:{}};new Function('module','exports',ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(module,module.exports);return module.exports;}
const workspaceModel=fixtureModel('lib/auryn/workspace/model.ts');
const financialModel=fixtureModel('lib/research-financial-assessment.ts');
const companyCases={MSFT:read('fixtures/valuation-msft-synthetic.json'),APP:read('fixtures/valuation-app-discontinued-synthetic.json'),NBIS:{company:read('fixtures/product-company.json')},IREN:{company:{dataQuality:{evidenceContract:'sec-company-evidence-v3'},evidence:[]}},ASTS:{company:{dataQuality:{evidenceContract:'sec-company-evidence-v3'},evidence:[]}},'BTC/USD':{company:{dataQuality:{evidenceContract:'sec-company-evidence-v3'},evidence:[]}}};
const completeFinancialFixture=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/mature-financial-complete-synthetic.json'),'utf8'));
companyCases['QA-MATURE']={...completeFinancialFixture,currentPrice:80};
const report={startedAt:new Date().toISOString(),mode,scope:mode==='fixture'?'Local production Chromium with intercepted synthetic auth/database/market/paper services. No actual login delivery, RLS, provider entitlement, broker order or investment-performance certification.':'Actual locally served anonymous pages with no service fixtures or credentials; external page requests blocked. No deployed authenticated integration claim.',baseUrl:base.origin,widths,themes,groups,node:process.version,browserVersion:null,release:{},cases:[],runtimeErrors:[],requestCounts:{},blockedExternal:[],unhandledFixtures:[],warnings:[],notVerified:['Deployed owner/admin mapping','Live cross-user Supabase RLS','Real signup/password-reset email delivery','Vendor entitlements and freshness','Actual paper submission, broker fill and reconciliation','Physical devices, Safari/Firefox and assistive technology','Human usability approval','Investment performance or model calibration']};
for(const file of ['.next/BUILD_ID','package-lock.json'])if(fs.existsSync(path.join(root,file))){const bytes=fs.readFileSync(path.join(root,file));report.release[file]=file.endsWith('BUILD_ID')?bytes.toString().trim():createHash('sha256').update(bytes).digest('hex');}
try{report.release.gitHead=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();}catch{}
if(!report.release['.next/BUILD_ID'])report.warnings.push('No .next/BUILD_ID found: this run cannot establish that the server is a production build.');
const safe=s=>s.replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/^-|-$/g,'')||'home';
const user={id:'00000000-0000-0000-0000-000000000001',email:'fixture-user@example.invalid',app_metadata:{role:'admin'},user_metadata:{full_name:'Synthetic QA User',auryn_onboarded:true},aud:'authenticated',role:'authenticated'};
const access=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url')+'.'+Buffer.from(JSON.stringify({sub:user.id,exp:Math.floor(Date.now()/1000)+36000,aud:'authenticated'})).toString('base64url')+'.synthetic-not-valid';
const session={access_token:access,refresh_token:'synthetic-not-valid',expires_in:36000,expires_at:Math.floor(Date.now()/1000)+36000,token_type:'bearer',user};
const db={portfolio_positions:[],watchlists:[{id:'synthetic-list',user_id:user.id}],watchlist_items:[],alerts:[]};
const writes=[];
const longBars=[];
for(let day=new Date('2021-09-27T00:00:00Z'),i=0;day<=new Date('2026-10-09T00:00:00Z');day.setUTCDate(day.getUTCDate()+1)){
 if([0,6].includes(day.getUTCDay()))continue;
 const close=80+i*.06+25*Math.sin(i/31)+9*Math.sin(i/9),open=close+Math.sin(i)*1.3;
 longBars.push({time:day.toISOString().slice(0,10),open,high:Math.max(open,close)+2,low:Math.min(open,close)-2,close,volume:1000000+i*100});i++;
}
const marketIntelligence={snapshotId:'synthetic-ui-fixture-only',confirmed:Object.fromEntries(['15M','1H','4H','1D','1W'].map(tf=>[tf,{rating:'NEUTRAL',score:0,price:150,counts:{buy:1,neutral:3,sell:1},trend:{score:50},momentum:{score:50},participation:{score:50},relativeStrength:{score:50}}])),livePreview:{},actionMap:{preferredEntry:{low:140,high:145},confirm:155,support:140,majorSupport:130,t1:160,t2:170,invalidation:125},coverage:{requested:['15M','1H','4H','1D','1W']}};
const observedAt='2026-10-15T20:00:00Z';
const fixtureEventDate=new Date(Date.now()+3*86400000).toISOString();
function syntheticDecision(symbol){
 const scores={business:75,earningsRevisions:70,valuation:70,marketStructure:55,catalystsRegime:60,riskAsymmetry:65};
 const pillars=Object.fromEntries(Object.entries(scores).map(([key,score])=>[key,{key,label:key,score,state:'CONSTRUCTIVE',impact:'POSITIVE',why:'SYNTHETIC QA: dated '+key+' evidence for interface testing only.',evidenceIds:['synthetic-'+key],asOf:observedAt}]));
 return {version:'auryn-v9.3.1',policyVersion:'auryn-intelligence-2026-10-16-identity-v2',snapshotId:'synthetic-decision-'+symbol,symbol,newMoneyAction:'WAIT',ownerAction:'HOLD',longTermAction:'ATTRACTIVE',executionAction:'BLOCKED',canonicalPrimaryAction:'WAIT',legacyChallengerAction:null,hardVetoReasons:[],policyReasons:['SYNTHETIC QA ONLY: no execution permission'],setupState:'REPAIRING',decisionScore:66,confidenceScore:75,confidenceBasis:'EVIDENCE_QUALITY_UNCALIBRATED',evidenceCompleteness:75,pillars,attribution:Object.values(pillars).map(p=>({pillar:p.key,label:p.label,score:p.score,weight:1/6,contribution:1,direction:'POSITIVE'})),drivers:['SYNTHETIC QA: comparable business evidence retained.'],counterEvidence:['SYNTHETIC QA: financing and concentration require review.'],nextDecisionTrigger:'SYNTHETIC QA: wait for a dated delivery update.',invalidationTrigger:'SYNTHETIC QA: a documented loss of operating economics.',horizons:{now:'WAIT',swing:'WAIT',sixToTwelveMonths:'SELECTIVE',threeToFiveYears:'ATTRACTIVE'},changeExplanation:{changed:false,from:null,to:'REPAIRING',trigger:'Synthetic baseline',changedEvidence:[],unchangedEvidence:['synthetic-business']},dimensions:{business:{score:75,assessment:'ATTRACTIVE'},valuation:{score:70,state:'SUPPORTED'},timing:{score:55,state:'REPAIRING'},portfolioFit:{state:'UNASSESSED',reason:'Synthetic fixture has no account execution permission.'},evidence:{coverage:75,calibratedProbability:null},execution:{state:'BLOCKED',reasons:['SYNTHETIC QA ONLY']}}};
}
function canonical(symbol){
 const businessModel=symbol==='ASTS'?'SPACE_SATELLITE':['IREN','NBIS'].includes(symbol)?'AI_DATA_CENTER_INFRA':symbol==='BTC/USD'?'CRYPTO':'GENERAL_COMPOUNDER';
 const item=companyCases[symbol]||companyCases.NBIS;
 const financialEvidence=financialModel.buildFinancialAssessment({symbol,businessModel,lifecycle:'COMPOUNDER',asOf:observedAt,currentPrice:25,priceAsOf:observedAt,priceCurrency:'USD',company:item.company});
 financialEvidence.metrics=[{key:'revenue',label:'Revenue — SYNTHETIC QA',value:symbol==='MSFT'?1200000000:1000000000,unit:'USD',currency:'USD',scope:'ANNUAL',periodStart:'2025-01-01',periodEnd:'2025-12-31',definition:'Synthetic reported annual revenue for UI comparison only',source:'SYNTHETIC QA FIXTURE',asOf:observedAt,accountingBasis:'GAAP',evidenceIds:['synthetic-revenue']}];
 const decision=syntheticDecision(symbol);
 return {snapshotId:'synthetic-canonical-'+symbol,security:{symbol,name:symbol+' — SYNTHETIC QA FIXTURE',currency:'USD'},market:{...fixture.market,displayPrice:symbol==='BTC/USD'?65000:item.currentPrice||25,priceState:'OFFICIAL_CLOSE',session:'CLOSED',regularCloseAsOf:observedAt,sources:[{provider:'SYNTHETIC QA FIXTURE'}]},research:{state:'READY',policyVersion:decision.policyVersion,decisionSnapshotId:decision.snapshotId,decision,financialEvidence,action:decision.newMoneyAction,ownerAction:decision.ownerAction,longTermAction:decision.longTermAction,setupState:decision.setupState,thesisScore:75,archetype:businessModel,observedAt,evidence:[{id:'synthetic-business-fact',label:'Synthetic business fact',value:'UI research fixture only',source:'SYNTHETIC QA FIXTURE',asOf:observedAt,role:'reason'}],events:[{id:'synthetic-event-'+symbol,label:'SYNTHETIC QA milestone',date:fixtureEventDate,source:'SYNTHETIC QA FIXTURE'}]}};
}
const workspaceRows=[];
function saveRow(kind,key,payload){const row={kind,key,payload,updated_at:new Date().toISOString()},index=workspaceRows.findIndex(x=>x.kind===kind&&x.key===key);if(index<0)workspaceRows.push(row);else workspaceRows[index]=row;return row;}
for(const symbol of ['NBIS','MSFT']){const snapshot=workspaceModel.snapshotFromCanonical(canonical(symbol),'synthetic-saved-'+symbol);saveRow('snapshot',snapshot.snapshotId,snapshot);}
saveRow('watch','NBIS',{symbol:'NBIS',reason:'SYNTHETIC QA watch reason',awaited:{kind:'milestone',text:'SYNTHETIC QA dated delivery evidence'}});
async function workspaceFixture(route,url){
 const request=route.request();if(request.method()==='GET'){if(url.searchParams.get('scope')==='contribution')return fulfill(route,{settings:workspaceRows.find(r=>r.kind==='allocation-plan'&&r.key===`contribution:${url.searchParams.get('symbol')}`)?.payload.plan??null});if(url.searchParams.get('scope')==='planning'){const decisions=workspaceRows.filter(r=>r.kind==='decision-journal'&&r.payload.symbol===url.searchParams.get('symbol')).map(r=>r.payload),ids=decisions.map(x=>x.id);return fulfill(route,{decisions,reviews:workspaceRows.filter(r=>r.kind==='decision-review'&&ids.includes(r.payload.decisionId)).map(r=>r.payload),truncated:false});}return fulfill(route,{rows:workspaceRows,watchSymbols:[...new Set([...db.watchlist_items.map(r=>r.symbol),...workspaceRows.filter(r=>r.kind==='watch').map(r=>r.payload.symbol)])],portfolioSymbols:db.portfolio_positions.filter(r=>r.asset_type!=='CASH').map(r=>r.symbol),limitations:['SYNTHETIC QA account data; no live account access.'],positions:db.portfolio_positions,storage:'account'});}
 const b=request.postDataJSON();if(b.op==='contribution'){const settings=workspaceModel.validateContribution(b.settings);saveRow('allocation-plan',`contribution:${b.symbol}`,{symbol:b.symbol,plan:settings});return fulfill(route,{saved:true,settings});}writes.push({table:'research-workspace-synthetic',op:b.op});
 try{
 if(b.op==='watch'){const watch=workspaceModel.validateWatch(b.watch);saveRow('watch',watch.symbol,watch);if(!db.watchlist_items.some(r=>r.symbol===watch.symbol))db.watchlist_items.push({id:'synthetic-watch-'+watch.symbol,user_id:user.id,watchlist_id:'synthetic-list',symbol:watch.symbol});return fulfill(route,{saved:true});}
 if(b.op==='remove-watch'){db.watchlist_items=db.watchlist_items.filter(r=>r.symbol!==b.symbol);const index=workspaceRows.findIndex(r=>r.kind==='watch'&&r.key===b.symbol);if(index>=0)workspaceRows.splice(index,1);return fulfill(route,{saved:true});}
 if(b.op==='save-view'){const id=b.id||'synthetic-view-'+Date.now();saveRow('view',id,{...workspaceModel.validateView(b.view),id});return fulfill(route,{saved:true,id});}
 if(b.op==='delete-view'){const index=workspaceRows.findIndex(r=>r.kind==='view'&&r.key===b.id);if(index>=0)workspaceRows.splice(index,1);return fulfill(route,{saved:true});}
 if(b.op==='preferences'){saveRow('preferences','alerts',workspaceModel.validatePreferences(b.preferences));return fulfill(route,{saved:true});}
 if(b.op==='refresh'){let savedCount=0,alertCount=0;for(const symbol of b.symbols){const previous=workspaceRows.filter(r=>r.kind==='snapshot'&&r.payload.symbol===symbol).map(r=>r.payload).at(-1)||null,snapshot=workspaceModel.snapshotFromCanonical(canonical(symbol),'synthetic-saved-'+symbol);if(!previous){saveRow('snapshot',snapshot.snapshotId,snapshot);savedCount++;}const prefs=workspaceRows.find(r=>r.kind==='preferences')?.payload||workspaceModel.DEFAULT_PREFERENCES;for(const alert of workspaceModel.buildAlerts(previous,snapshot,prefs,workspaceRows.filter(r=>r.kind==='alert').map(r=>r.payload))){saveRow('alert',alert.id,alert);alertCount++;}}return fulfill(route,{saved:true,savedCount,alertCount,errors:[]});}
 if(b.op==='read-alert'){const row=workspaceRows.find(r=>r.kind==='alert'&&r.key===b.id);if(row)row.payload.read=true;return fulfill(route,{saved:true});}
 if(b.op==='ask'){const row=workspaceRows.find(r=>r.kind==='snapshot'&&r.key===b.snapshotId);return row?fulfill(route,{answer:workspaceModel.answerEvidence(b.question,row.payload,null)}):fulfill(route,{error:'Save a research snapshot first.'},409);}
 if(b.op==='save-planning'){const payload=workspaceModel.validatePlanningRecord(b.kind,b.key,b.payload);if(workspaceRows.some(r=>r.kind===b.kind&&r.key===b.key))return fulfill(route,{error:'Original record already exists.'},409);saveRow(b.kind,b.key,payload);return fulfill(route,{saved:true});}
 return fulfill(route,{error:'Unsupported synthetic workspace operation'},400);
 }catch(error){return fulfill(route,{error:error.message},400);}
}

const fulfill=(route,data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
async function fixtureRoute(route){
 const req=route.request(),url=new URL(req.url()),p=url.pathname,method=req.method();
 const key=`${method} ${p}${url.search}`;report.requestCounts[key]=(report.requestCounts[key]||0)+1;
 if(url.hostname==='visual.supabase.co'){
  if(p.includes('/auth/')){
   if(p.endsWith('/logout'))return fulfill(route,{});
   if(p.endsWith('/recover'))return fulfill(route,{});
   if(p.endsWith('/signup'))return fulfill(route,{user,session:null});
   if(method==='PUT'){const payload=req.postDataJSON()||{};Object.assign(user.user_metadata,payload.data||{});writes.push({table:'user',method,fieldNames:Object.keys(payload)});}
   return fulfill(route,p.endsWith('/user')?user:session);
  }
  const table=p.split('/').at(-1);
  if(!(table in db)){report.unhandledFixtures.push({method,path:p});return fulfill(route,[]);}
  const matches=row=>[...url.searchParams].every(([field,filter])=>!filter.startsWith('eq.')||String(row[field])===filter.slice(3));
  let rows=db[table].filter(matches),data;
  if(method==='POST'){
   const payload=req.postDataJSON();const records=Array.isArray(payload)?payload:[payload];
   if(table==='watchlist_items'&&records.some(x=>!x.watchlist_id))return fulfill(route,{message:'watchlist_id is required'},400);
   rows=records.map((x,i)=>({id:`synthetic-${table}-${Date.now()}-${i}`,created_at:new Date().toISOString(),...x}));db[table].push(...rows);writes.push({table,method,rows});data=rows;
  }else if(method==='PATCH'){const payload=req.postDataJSON();rows.forEach(x=>Object.assign(x,payload));writes.push({table,method,payload:structuredClone(payload),matchedIds:rows.map(x=>x.id),rows});data=rows;}
  else if(method==='DELETE'){db[table]=db[table].filter(x=>!matches(x));writes.push({table,method,count:rows.length});data=[];}
  else data=rows;
  if(req.headers().accept?.includes('object'))data=data[0]||null;
  return fulfill(route,data);
 }
 if(url.origin!==base.origin){report.blockedExternal.push({host:url.hostname,path:p});return route.abort();}
 if(!p.startsWith('/api/'))return route.continue();
 const symbol=decodeURIComponent(p.split('/').at(-1)),item=companyCases[symbol]||companyCases.NBIS;
 const market={...fixture.market,symbol,snapshotId:'synthetic-'+symbol,sources:[{provider:'SYNTHETIC QA FIXTURE'}],...(item.currentPrice?{displayPrice:item.currentPrice,decisionPrice:item.currentPrice,regularClose:item.currentPrice,regularClosePrice:item.currentPrice}:{})};
 let data;
 if(p==='/api/research-workspace')return workspaceFixture(route,url);
 if(p==='/api/search')data={results:[{symbol:'NBIS',name:'Nebius — SYNTHETIC QA FIXTURE',exchange:'NASDAQ'},{symbol:'APP',name:'AppLovin — SYNTHETIC QA FIXTURE',exchange:'NASDAQ'}]};
 else if(p==='/api/canonical')data={items:(url.searchParams.get('symbols')||'').split(',').filter(Boolean).map(canonical)};
 else if(p.includes('/analyze/'))data={...fixture.analysis,marketIntelligence,symbol,name:symbol+' — SYNTHETIC QA FIXTURE',assetType:symbol==='BTC/USD'?'crypto':'stock',marketTruth:market,price:market.displayPrice,analysisAnchorPrice:market.displayPrice};
 else if(p.includes('/company/'))data=item.company;
 else if(p.includes('/context/'))data={profile:item.profile||{name:symbol+' — SYNTHETIC QA FIXTURE',currency:'USD'},news:[]};
 else if(p.includes('/canonical/'))data={...canonical(symbol),market};
 else if(p.includes('/quote/'))data={...market,marketTruth:market,price:market.displayPrice};
 else if(p.includes('/chart/'))data={candles:url.searchParams.get('range')==='5Y'?longBars:fixture.bars};
 else if(p.includes('/options/'))data={enabled:false,reason:'Synthetic QA fixture has no licensed options feed.'};
 else if(p==='/api/portfolio/pulse')data={items:[{asOf:'2026-09-01T20:00:00Z',totalValue:20000},{asOf:'2026-10-15T20:00:00Z',totalValue:29000}]};
 else if(p==='/api/trading-lab/status')data={broker:{connected:true,configured:true,equity:100000,cash:50000,positions:2,clock:{isOpen:true}},execution:{enabled:true,paused:false},readiness:{storage:'ready',configuration:'ready',research:'synthetic',strategy:'synthetic'},access:{authentication:'synthetic authenticated',administrator:'synthetic admin'},recentEvaluations:[],recentRuns:[],metrics:{trades:0},orders:0,runner:{schedule:'SYNTHETIC QA FIXTURE — no actual schedule checked'}};
 else if(p==='/api/trading-lab/manual'&&method==='GET')data={items:[]};
 else if(p.startsWith('/api/market-intelligence/live/'))data={version:'synthetic-live-context',symbol,asOf:observedAt,confirmed:marketIntelligence.confirmed,livePreview:{},coverage:marketIntelligence.coverage,status:'OK'};
 else if(p==='/api/validation/snapshot')data={saved:false,reason:'Synthetic browser fixture does not persist engine validation.'};
 else if(p==='/api/trading-lab/manual'&&method==='POST'){const b=req.postDataJSON();writes.push({table:'paper-api-synthetic-only',method,preview:Boolean(b.preview),confirmed:Boolean(b.confirmed)});data=b.preview&&!b.confirmed?{preview:{...b,notional:b.quantity*b.limitPrice,quoteAsOf:new Date().toISOString(),userId:user.id}}:{order:{status:'accepted'}};}
 else if(p==='/api/trading-lab/run-now')data={paper:{status:'disabled',processed:0,results:[]}};
 else if(p.includes('/calibration'))data={outcomes:{},cohorts:[],learning:{maturedOutcomes:0}};
 else if(p.includes('/model-health'))data={proof:{grade:'UNPROVEN',exactSampleN:0}};
 else if(p==='/api/discover')data={items:['NBIS','MSFT'].map(symbol=>({symbol,name:symbol+' — SYNTHETIC QA FIXTURE',scannedAt:observedAt,reason:'Synthetic source-backed fixture for UI coverage.'})),coverage:{lastScanAt:observedAt},partial:true};
 else if(['/api/news/'+symbol,'/api/institutional/'+symbol,'/api/research-lab'].includes(p))data={items:[]};
 else{report.unhandledFixtures.push({method,path:p});data={items:[],fixtureReason:'No fixture contract was defined for this API; this response does not establish capability.'};}
 return fulfill(route,data);
}
async function newContext(browser,{theme='light',width=390,authenticated=mode==='fixture'}={}){
 const context=await browser.newContext({viewport:{width,height:900},locale:'en-US',reducedMotion:'reduce',serviceWorkers:'block'});
 await context.addInitScript(value=>{if(!localStorage.getItem('auryn-theme'))localStorage.setItem('auryn-theme',value)},theme);
 if(authenticated)await context.addCookies([{name:'sb-visual-auth-token',value:'base64-'+Buffer.from(JSON.stringify(session)).toString('base64url'),domain:base.hostname,path:'/'}]);
 await context.route('**/*',mode==='fixture'?fixtureRoute:async route=>{const u=new URL(route.request().url());if(u.origin===base.origin&&['GET','HEAD'].includes(route.request().method()))return route.continue();report.blockedExternal.push({host:u.hostname,path:u.pathname});return route.abort();});
 return context;
}
async function measured(page){return page.evaluate(()=>{
 const shown=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);for(let parent=e.parentElement;parent;parent=parent.parentElement)if(parent.tagName==='DETAILS'&&!parent.open&&!parent.querySelector(':scope > summary')?.contains(e))return false;return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none';};
 const controls=[...document.querySelectorAll('button,input,select,textarea,a,[role=button],[role=tab]')].filter(shown);
 const label=e=>e.getAttribute('aria-label')||e.innerText||e.labels?.[0]?.textContent||e.getAttribute('title')||e.getAttribute('placeholder')||'';
 return {title:document.querySelector('h1')?.textContent?.trim(),viewport:innerWidth,scroll:document.documentElement.scrollWidth,renderedControls:controls.map(e=>({tag:e.tagName,role:e.getAttribute('role'),label:label(e).trim().slice(0,140),disabled:Boolean(e.disabled)})),unlabeled:controls.filter(e=>!label(e).trim()&&!e.getAttribute('aria-labelledby')).map(e=>({tag:e.tagName,type:e.getAttribute('type'),class:e.className})),smallInputs:controls.filter(e=>['INPUT','SELECT','TEXTAREA'].includes(e.tagName)&&!['checkbox','radio'].includes(e.type)&&parseFloat(getComputedStyle(e).fontSize)<16).map(e=>({label:label(e),font:getComputedStyle(e).fontSize})),smallTargets:controls.filter(e=>{const r=e.getBoundingClientRect();return e.tagName==='BUTTON'&&(r.width<44||r.height<44);}).map(e=>({label:label(e),width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height})),overflow:[...document.querySelectorAll('body *')].filter(shown).filter(e=>{const r=e.getBoundingClientRect();return r.right>innerWidth+3&&getComputedStyle(e).position!=='absolute'&&getComputedStyle(e).position!=='fixed';}).slice(0,12).map(e=>({tag:e.tagName,class:e.className,text:e.textContent?.trim().slice(0,80)}))};
 });}
async function settle(page){await page.waitForLoadState('networkidle',{timeout:15000});await page.locator('h1:visible').first().waitFor({timeout:15000});if(new URL(page.url()).pathname.startsWith('/stock/'))await page.locator('.au-tabs').waitFor();await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}
async function capture(page,name){await page.evaluate(()=>{document.activeElement?.blur();window.scrollTo({top:0,behavior:'instant'});});const file=path.join('screenshots',safe(name)+'.png');await page.screenshot({path:path.join(out,file),fullPage:true,animations:'disabled'});return file;}
async function waitFixture(predicate,reason){const deadline=Date.now()+5000;while(!predicate()&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,25));assert.ok(predicate(),reason);}
async function test(name,metadata,fn){const row={name,...metadata,passed:false};report.cases.push(row);try{Object.assign(row,await fn()||{});row.passed=true;}catch(error){row.error=String(error.message||error);console.error('FAIL',name,row.error.slice(0,350));}finally{fs.writeFileSync(path.join(out,'progress.json'),JSON.stringify({completed:report.cases.length,failed:report.cases.filter(x=>!x.passed).length,last:name},null,2)+'\n');}}
function attachErrors(page,scope){page.on('pageerror',error=>report.runtimeErrors.push({...scope,url:new URL(page.url()).pathname,error:error.message}));}

// This suite uses production-API financial responses when requested. Authentication,
// quotes, decisions and database writes remain explicitly synthetic browser fixtures.
if(process.env.AURYN_REAL_COMPANY==='1')for(const symbol of ['MSFT','IREN','ASTS','APP'])companyCases[symbol]={company:JSON.parse(fs.readFileSync(path.join(root,'verification/product-recovery/live-evidence',symbol+'.json'),'utf8'))};
db.portfolio_positions=[{id:'stock-1',user_id:user.id,symbol:'MSFT',asset_type:'EQUITY',shares:10,avg_cost:20},{id:'cash-1',user_id:user.id,symbol:'USD',asset_type:'CASH',shares:1000,avg_cost:1}];
db.watchlist_items=[{id:'watch-1',user_id:user.id,symbol:'MSFT'},{id:'watch-2',user_id:user.id,symbol:'NBIS'}];
let browser;
const sectionKeys={Overview:'thesis',Business:'fundamentals',Financials:'financials',Valuation:'valuation',Technicals:'technical','Earnings & events':'earnings',Ownership:'institutions',Risks:'risk',Options:'options'};
async function selectSection(page,name){await page.locator('.au-tabs').waitFor();const direct=page.locator('.au-tabs').getByRole('button',{name,exact:true});if(await direct.count())await direct.click();else{await page.locator('.au-more').click();await page.locator('.au-morepanel').getByRole('button',{name,exact:true}).click();}}
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:JSON.parse(process.env.CHROMIUM_ARGS||'[]')});report.browserVersion=browser.version();
 for(const theme of (process.env.AURYN_INTERACTIONS_ONLY==='1'?[]:themes))for(const width of widths){const context=await newContext(browser,{theme,width}),page=await context.newPage();page.setDefaultTimeout(8000);attachErrors(page,{theme,width});
 const routes=process.env.AURYN_GLASS_QUICK==='1'?['/dashboard','/portfolio','/analyze']:['/dashboard','/discover','/portfolio','/watchlist','/alerts','/analyze','/trading-lab','/research-lab','/calibration','/personalization','/profile','/faq','/methodology','/privacy','/terms','/disclaimer','/login','/register','/forgot-password','/reset-password','/onboarding'];
 for(const route of routes)await test(`${theme} ${width} ${route}`,{theme,width,route},async()=>{await page.goto(base.origin+route);await settle(page);const measurement=await measured(page),screenshot=await capture(page,`${theme}-${width}-${safe(route)}`);assert.ok(measurement.scroll<=width+2,`Document overflow ${measurement.scroll} > ${width}`);return{measurement,screenshot};});
 await page.goto(base.origin+'/stock/MSFT');await settle(page);
 for(const name of (process.env.AURYN_GLASS_QUICK==='1'?['Overview','Technicals','Financials','Valuation']:Object.keys(sectionKeys)))await test(`${theme} ${width} research ${name}`,{theme,width},async()=>{await selectSection(page,name);await settle(page);await page.locator('#research-tab-panel').waitFor();assert.equal(await page.getByText('Loading AURYN…',{exact:true}).count(),0);const measurement=await measured(page),screenshot=await capture(page,`${theme}-${width}-MSFT-${name}`);assert.ok(measurement.scroll<=width+2,`Document overflow ${measurement.scroll} > ${width}`);assert.equal(new URL(page.url()).searchParams.get('section'),sectionKeys[name]);return{measurement,screenshot};});await context.close();
 }
 if(process.env.AURYN_GLASS_QUICK!=='1'){
 const context=await newContext(browser,{width:390}),page=await context.newPage();page.setDefaultTimeout(8000);attachErrors(page,{group:'interactions'});
 await test('chart range changes preserve canvas and wheel scroll moves the page',{},async()=>{await page.goto(base.origin+'/stock/MSFT');await settle(page);const canvas=page.locator('.glassPricePlot canvas').first();await canvas.waitFor();await canvas.evaluate(el=>el.dataset.glassIdentity='stable');for(const range of ['1W','1D','1M','1Y','5Y']){await page.getByRole('button',{name:range,exact:true}).click();await page.waitForTimeout(80);assert.equal(await canvas.getAttribute('data-glass-identity'),'stable');assert.ok(Object.keys(report.requestCounts).some(k=>k.includes(`/api/chart/MSFT?range=${range}`)))}for(const range of ['3M','6M','3Y']){await page.getByLabel('Additional chart periods',{exact:true}).selectOption(range);await page.waitForTimeout(80);assert.equal(await canvas.getAttribute('data-glass-identity'),'stable');assert.ok(Object.keys(report.requestCounts).some(k=>k.includes(`/api/chart/MSFT?range=${range}`)))}await canvas.scrollIntoViewIfNeeded();const box=await canvas.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);const before=await page.evaluate(()=>scrollY);await page.mouse.wheel(0,350);await page.waitForTimeout(250);assert.ok(await page.evaluate(()=>scrollY)>before);});
 await test('metric help and More menu support keyboard dismissal',{},async()=>{await selectSection(page,'Financials');await page.getByRole('button',{name:'About Revenue',exact:true}).first().click();await page.getByRole('dialog').waitFor();await page.keyboard.press('Escape');await page.locator('.au-more').click();assert.equal(await page.locator('.au-morepanel').count(),1);await page.keyboard.press('Escape');assert.equal(await page.locator('.au-morepanel').count(),0);await page.getByRole('button',{name:'Quarter',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Quarter',exact:true}).getAttribute('aria-pressed'),'true')});
 await test('DCA is above the chart and needs no contribution amount',{},async()=>{await page.goto(base.origin+'/stock/MSFT');await settle(page);const dca=page.locator('.nativeDca');await dca.waitFor();assert.equal(await dca.getAttribute('data-multiple')!=='unknown',true);assert.equal(await page.getByText('Set amount',{exact:true}).count(),0);const d=await dca.boundingBox(),chart=await page.locator('.nativeChart').boundingBox();assert.ok(d.y+d.height<=chart.y,'DCA must appear before chart');await dca.getByRole('button',{name:'About DCA intensity',exact:true}).click();await page.getByRole('dialog').waitFor();assert.match(await page.getByRole('dialog').innerText(),/experimental|Performance has not been validated/i);await page.keyboard.press('Escape');});
 await test('weekly Fibonacci controls, custom ratio and expansion work',{},async()=>{await selectSection(page,'Technicals');await page.getByText('Chart settings & swing anchors',{exact:true}).click();await page.getByLabel('Average calculation',{exact:true}).selectOption('WMA');await page.getByLabel('Custom 0.686 · 68.6%',{exact:true}).check();await page.getByRole('cell',{name:/0\.686/}).waitFor();await page.getByRole('button',{name:'Expand',exact:true}).click();await page.locator('dialog[open].glassChartModal').waitFor();await page.locator('dialog[open]').getByRole('button',{name:/zoom in/i}).click();await page.keyboard.press('Escape');assert.equal(await page.locator('dialog[open].glassChartModal').count(),0);});
 await test('saved note and comparison remain available',{},async()=>{await page.goto(base.origin+'/watchlist');await settle(page);await page.getByRole('button',{name:'Edit note',exact:true}).first().click();await page.getByLabel('Why I am watching',{exact:true}).fill('SYNTHETIC QA saved investment thesis');await page.getByLabel('Condition I want to see',{exact:true}).fill('SYNTHETIC QA source-backed milestone');await page.getByRole('button',{name:'Save watch reason',exact:true}).click();await page.getByText(/watch reason saved to your account/).waitFor();assert.ok(workspaceRows.some(r=>r.kind==='watch'&&r.payload.reason==='SYNTHETIC QA saved investment thesis'));});
 await test('late explanation cannot appear under another company or account',{},async()=>{
  for(const symbol of ['MSFT','NBIS']){const snapshot=workspaceModel.snapshotFromCanonical(canonical(symbol),'synthetic-race-'+symbol);saveRow('snapshot',snapshot.snapshotId,snapshot);}
  await page.goto(base.origin+'/watchlist');await settle(page);await page.getByText('Explain saved research',{exact:true}).click();await page.getByLabel('Company',{exact:true}).selectOption('MSFT');
  let finish;const gate=new Promise(resolve=>{finish=resolve});
  const handler=async route=>{const body=route.request().method()==='POST'?route.request().postDataJSON():null;if(body?.op==='ask'){await gate;return fulfill(route,{answer:{supported:true,text:'STALE QA answer for former scope',citations:[]}})}return route.fallback()};
  await page.route('**/api/research-workspace',handler);const started=page.waitForRequest(r=>r.url().includes('/api/research-workspace')&&r.method()==='POST'&&r.postDataJSON().op==='ask');
  await page.getByRole('button',{name:'Explain the assessment',exact:true}).click();await started;await page.getByLabel('Company',{exact:true}).selectOption('NBIS');finish();await page.waitForTimeout(200);assert.equal(await page.getByText('STALE QA answer for former scope',{exact:true}).count(),0);await page.unroute('**/api/research-workspace',handler);
  let release;const ownerGate=new Promise(resolve=>{release=resolve});const accountHandler=async route=>{const body=route.request().method()==='POST'?route.request().postDataJSON():null;if(body?.op==='ask'){await ownerGate;return fulfill(route,{answer:{supported:true,text:'STALE QA account answer',citations:[]}})}return route.fallback()};
  await page.route('**/api/research-workspace',accountHandler);const nextStarted=page.waitForRequest(r=>r.url().includes('/api/research-workspace')&&r.method()==='POST'&&r.postDataJSON().op==='ask');await page.getByRole('button',{name:'Explain the assessment',exact:true}).click();await nextStarted;
  await page.evaluate(value=>{const channel=new BroadcastChannel('sb-visual-auth-token');channel.postMessage({event:'SIGNED_IN',session:{...value,user:{...value.user,id:'synthetic-other-owner'}}});setTimeout(()=>channel.close(),100)},session);await page.waitForTimeout(100);release();await page.waitForTimeout(200);assert.equal(await page.getByText('STALE QA account answer',{exact:true}).count(),0);await page.unroute('**/api/research-workspace',accountHandler);
 });
 await test('account navigation opens and outside click closes it',{},async()=>{await page.getByRole('button',{name:'Account and navigation',exact:true}).click();assert.equal(await page.locator('#account-menu').count(),1);await page.mouse.click(8,450);assert.equal(await page.locator('#account-menu').count(),0)});

 await test('tab changes preserve chart canvas and do not reload chart histories',{},async()=>{
  await page.goto(base.origin+'/stock/MSFT');await settle(page);
  const canvas=page.locator('.glassPricePlot canvas').first();await canvas.evaluate(e=>e.dataset.stability='saved');
  const before=Object.entries(report.requestCounts).filter(([k])=>k.includes('/api/chart/MSFT')).reduce((n,[,v])=>n+v,0);
  for(const section of ['Financials','Business','Technicals','Overview']){await selectSection(page,section);await settle(page)}
  assert.equal(await canvas.getAttribute('data-stability'),'saved');
  const after=Object.entries(report.requestCounts).filter(([k])=>k.includes('/api/chart/MSFT')).reduce((n,[,v])=>n+v,0);assert.equal(after,before);
 });
 await test('live quote badge expires after failed polling without hiding the last price',{},async()=>{
  await page.clock.install({time:new Date('2026-10-16T15:00:00Z')});let count=0;
  await page.route('**/api/quote/MSFT',route=>{count++;return count===1?fulfill(route,{symbol:'MSFT',price:150,changePct:1.2,session:'REGULAR',displayState:'LIVE',freshness:'LIVE',providerTimestamp:'2026-10-16T14:59:50Z',retrievedAt:'2026-10-16T15:00:00Z'}):fulfill(route,{error:'SYNTHETIC outage'},503)});
  await page.goto(base.origin+'/stock/MSFT');await settle(page);await page.locator('.glassQuoteChange').getByText('LIVE',{exact:true}).waitFor();
  await page.clock.runFor(95000);assert.equal(await page.locator('.glassQuoteChange').getByText('LIVE',{exact:true}).count(),0);
  assert.match(await page.locator('.au-quote').innerText(),/150.00/);assert.match(await page.locator('.glassQuoteChange').innerText(),/LAST AVAILABLE|LAST VERIFIED/);
 });

 await test('search shows local company logos and navigates without a document reload',{},async()=>{
  await page.getByRole('button',{name:'Open search',exact:true}).click();
  await page.locator('.aurynSearch input').fill('neb');
  const result=page.locator('.uxSearchResults a').filter({hasText:'NBIS'});await result.waitFor();
  const logo=result.locator('img');await logo.waitFor();await page.waitForFunction(()=>[...document.querySelectorAll('.uxSearchResults img')].some(i=>i.complete&&i.naturalWidth>0));
  await page.evaluate(()=>window.__navigationMarker='kept');await result.click();await settle(page);
  assert.ok(new URL(page.url()).pathname.endsWith('/NBIS'));assert.equal(await page.evaluate(()=>window.__navigationMarker),'kept');
 });
 await test('Light Dark and System preferences save to account and survive reload',{},async()=>{
  await page.goto(base.origin+'/personalization');await settle(page);
  for(const theme of ['Dark','Light']){await page.getByRole('button',{name:theme,exact:true}).click();await page.waitForFunction(value=>document.documentElement.dataset.theme===value,theme.toLowerCase());}
  await page.getByRole('button',{name:'Dark',exact:true}).click();await page.getByRole('button',{name:'Save preferences',exact:true}).click();
  await page.getByText('Preferences saved to your account and this device.',{exact:true}).waitFor();
  assert.equal(user.user_metadata.auryn_appearance.theme,'dark');await page.reload();await settle(page);assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
  await page.getByRole('button',{name:'System',exact:true}).click();await page.emulateMedia({colorScheme:'light'});await page.waitForFunction(()=>document.documentElement.dataset.theme==='light');
  await page.emulateMedia({colorScheme:'dark'});await page.waitForFunction(()=>document.documentElement.dataset.theme==='dark');
  await page.getByRole('button',{name:'Save preferences',exact:true}).click();await page.getByText('Preferences saved to your account and this device.',{exact:true}).waitFor();assert.equal(user.user_metadata.auryn_appearance.theme,'system');
  const fresh=await newContext(browser,{theme:'light',width:390}),other=await fresh.newPage();await other.emulateMedia({colorScheme:'dark'});await other.goto(base.origin+'/personalization');await settle(other);await other.waitForFunction(()=>document.documentElement.dataset.theme==='dark');assert.equal(await other.getByRole('button',{name:'System',exact:true}).getAttribute('aria-pressed'),'true');await fresh.close();
 });
 await context.close();}
}finally{if(browser)await browser.close();report.finishedAt=new Date().toISOString();report.summary={passed:report.cases.filter(x=>x.passed).length,failed:report.cases.filter(x=>!x.passed).length,runtimeErrors:report.runtimeErrors.length};fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report.summary));if(report.summary.failed||report.runtimeErrors.length)process.exitCode=1;}
