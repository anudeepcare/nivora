#!/usr/bin/env node
/**
 * Current-release local Chromium QA. Run AFTER a production build and local start.
 * Never use this runner against a deployed account. No external writes are sent.
 *
 * Fixture build (do not deploy its output):
 * NEXT_PUBLIC_SUPABASE_URL=https://visual.supabase.co NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=visual-public-test-key npm run build
 * npm run start -- --hostname 127.0.0.1 --port 3102
 * AURYN_TEST_URL=http://127.0.0.1:3102 node scripts/verify-next-build-browser.mjs
 * AURYN_BROWSER_MODE=public node scripts/verify-next-build-browser.mjs
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
const widths=(process.env.AURYN_BROWSER_WIDTHS||'320,375,390,430,768,1280,1440,1920').split(',').map(Number);
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
 return {version:'auryn-v9.3.1',policyVersion:'auryn-intelligence-2026-10-16',snapshotId:'synthetic-decision-'+symbol,symbol,newMoneyAction:'WAIT',ownerAction:'HOLD',longTermAction:'ATTRACTIVE',executionAction:'BLOCKED',canonicalPrimaryAction:'WAIT',legacyChallengerAction:null,hardVetoReasons:[],policyReasons:['SYNTHETIC QA ONLY: no execution permission'],setupState:'REPAIRING',decisionScore:66,confidenceScore:75,confidenceBasis:'EVIDENCE_QUALITY_UNCALIBRATED',evidenceCompleteness:75,pillars,attribution:Object.values(pillars).map(p=>({pillar:p.key,label:p.label,score:p.score,weight:1/6,contribution:1,direction:'POSITIVE'})),drivers:['SYNTHETIC QA: comparable business evidence retained.'],counterEvidence:['SYNTHETIC QA: financing and concentration require review.'],nextDecisionTrigger:'SYNTHETIC QA: wait for a dated delivery update.',invalidationTrigger:'SYNTHETIC QA: a documented loss of operating economics.',horizons:{now:'WAIT',swing:'WAIT',sixToTwelveMonths:'SELECTIVE',threeToFiveYears:'ATTRACTIVE'},changeExplanation:{changed:false,from:null,to:'REPAIRING',trigger:'Synthetic baseline',changedEvidence:[],unchangedEvidence:['synthetic-business']},dimensions:{business:{score:75,assessment:'ATTRACTIVE'},valuation:{score:70,state:'SUPPORTED'},timing:{score:55,state:'REPAIRING'},portfolioFit:{state:'UNASSESSED',reason:'Synthetic fixture has no account execution permission.'},evidence:{coverage:75,calibratedProbability:null},execution:{state:'BLOCKED',reasons:['SYNTHETIC QA ONLY']}}};
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
 const request=route.request();if(request.method()==='GET'){if(url.searchParams.get('scope')==='planning'){const decisions=workspaceRows.filter(r=>r.kind==='decision-journal'&&r.payload.symbol===url.searchParams.get('symbol')).map(r=>r.payload),ids=decisions.map(x=>x.id);return fulfill(route,{decisions,reviews:workspaceRows.filter(r=>r.kind==='decision-review'&&ids.includes(r.payload.decisionId)).map(r=>r.payload),truncated:false});}return fulfill(route,{rows:workspaceRows,watchSymbols:[...new Set([...db.watchlist_items.map(r=>r.symbol),...workspaceRows.filter(r=>r.kind==='watch').map(r=>r.payload.symbol)])],portfolioSymbols:db.portfolio_positions.filter(r=>r.asset_type!=='CASH').map(r=>r.symbol),limitations:['SYNTHETIC QA account data; no live account access.'],storage:'account'});}
 const b=request.postDataJSON();writes.push({table:'research-workspace-synthetic',op:b.op});
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
async function settle(page){await page.waitForLoadState('networkidle',{timeout:15000});await page.locator('h1:visible').first().waitFor({timeout:15000});if(new URL(page.url()).pathname.startsWith('/stock/'))await page.getByRole('tab',{name:'Overview',exact:true}).waitFor();await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}
async function capture(page,name){await page.evaluate(()=>{document.activeElement?.blur();window.scrollTo({top:0,behavior:'instant'});});const file=path.join('screenshots',safe(name)+'.png');await page.screenshot({path:path.join(out,file),fullPage:true,animations:'disabled'});return file;}
async function waitFixture(predicate,reason){const deadline=Date.now()+5000;while(!predicate()&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,25));assert.ok(predicate(),reason);}
async function test(name,metadata,fn){const row={name,...metadata,passed:false};report.cases.push(row);try{Object.assign(row,await fn()||{});row.passed=true;}catch(error){row.error=String(error.message||error);console.error('FAIL',name,row.error.slice(0,350));}finally{fs.writeFileSync(path.join(out,'progress.json'),JSON.stringify({completed:report.cases.length,failed:report.cases.filter(x=>!x.passed).length,last:name},null,2)+'\n');}}
function attachErrors(page,scope){page.on('pageerror',error=>report.runtimeErrors.push({...scope,url:new URL(page.url()).pathname,error:error.message}));}
const routes=['/','/login','/register','/forgot-password','/onboarding','/personalization','/analyze','/portfolio','/watchlist','/alerts','/trading-lab','/profile','/faq','/about','/methodology','/terms','/privacy','/disclaimer','/calibration','/research-lab','/stock/NBIS','/reset-password','/auth/callback','/dashboard','/discover','/not-a-real-route'];
const publicRoutes=['/','/login','/register','/forgot-password','/faq','/about','/methodology','/terms','/privacy','/disclaimer','/auth/callback','/not-a-real-route'];
let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,args:process.env.CHROMIUM_ARGS?JSON.parse(process.env.CHROMIUM_ARGS):['--no-sandbox','--disable-gpu','--disable-software-rasterizer']});report.browserVersion=browser.version();
 if(groups.includes('routes'))for(const theme of themes)for(const width of widths){
  console.log(`Routes: ${mode} ${theme} ${width}`);
  const context=await newContext(browser,{theme,width});const page=await context.newPage();attachErrors(page,{group:'routes',theme,width});
  for(const route of mode==='fixture'?routes:publicRoutes)await test(`route ${theme} ${width} ${route}`,{group:'routes',theme,width,route},async()=>{
   const response=await page.goto(base.origin+route,{waitUntil:'domcontentloaded',timeout:45000});await settle(page);const measurement=await measured(page);const screenshot=await capture(page,`${theme}-${width}-${safe(route)}`);Object.assign(report.cases.at(-1),{measurement,screenshot,status:response.status(),destination:new URL(page.url()).pathname});
   assert.ok(measurement.scroll<=measurement.viewport+2,`Document overflow ${measurement.scroll} > ${measurement.viewport}`);
   assert.ok(response.status()<400||route==='/not-a-real-route',`Unexpected HTTP ${response.status()}`);
   if(mode==='fixture'&&!['/login','/register','/forgot-password','/auth/callback'].includes(route))assert.ok(!/Unable to open your workspace/.test(measurement.title||''),'Authenticated fixture did not open: build with visual.supabase.co public configuration');
   return {status:response.status(),destination:new URL(page.url()).pathname,measurement,screenshot};
  });await context.close();
 }
 if(mode==='fixture'&&groups.includes('research'))for(const theme of themes)for(const width of widths){
  console.log(`Research: ${theme} ${width}`);const context=await newContext(browser,{theme,width});const page=await context.newPage();attachErrors(page,{group:'research',theme,width});
  await test(`research opens ${theme} ${width}`,{group:'research',theme,width},async()=>{await page.goto(base.origin+'/stock/NBIS',{waitUntil:'domcontentloaded'});await page.getByRole('tab',{name:'Overview',exact:true}).waitFor();});
  for(const tab of ['Overview','Business','Earnings','Financials','Valuation','Ownership','Catalysts','Options','News','Technicals','Risk'])await test(`research ${theme} ${width} ${tab}`,{group:'research',theme,width,tab},async()=>{
   await page.getByRole('tab',{name:tab,exact:true}).click();await page.locator('#research-tab-panel').waitFor();await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));const measurement=await measured(page),screenshot=await capture(page,`${theme}-${width}-research-${tab}`);Object.assign(report.cases.at(-1),{measurement,screenshot});assert.ok(measurement.scroll<=measurement.viewport+2,`Document overflow ${measurement.scroll} > ${measurement.viewport}`);return {measurement,screenshot};
  });await context.close();
 }
 if(mode==='fixture'&&groups.includes('interactions')){
  const context=await newContext(browser,{width:390});const page=await context.newPage();page.setDefaultTimeout(12000);attachErrors(page,{group:'interactions',width:390});page.on('dialog',dialog=>dialog.accept());
  const go=async route=>{await page.goto(base.origin+route,{waitUntil:'domcontentloaded'});await settle(page);};
  await test('portfolio add/edit/remove and holding research link',{group:'interactions',ids:['H01','K07']},async()=>{
   db.portfolio_positions=[];await go('/portfolio?symbol=IREN');await page.getByLabel('Quantity',{exact:true}).fill('10');await page.getByLabel('Average cost ($)',{exact:true}).fill('25');await page.getByRole('button',{name:'Save position',exact:true}).click();await page.getByText('Position saved.',{exact:true}).waitFor();assert.equal(db.portfolio_positions[0]?.shares,10);
   assert.equal(await page.getByRole('link',{name:'Open IREN investment research',exact:true}).getAttribute('href'),'/stock/IREN');
   await page.getByRole('button',{name:'Edit IREN',exact:true}).click();await page.getByRole('heading',{name:'Edit position',exact:true}).waitFor();await page.getByLabel('Quantity',{exact:true}).fill('12');await page.getByRole('button',{name:'Save position',exact:true}).click();await page.getByRole('button',{name:'Save position',exact:true}).waitFor({state:'hidden'});await waitFixture(()=>db.portfolio_positions[0]?.shares===12,'Edited shares must reach synthetic storage');assert.equal(db.portfolio_positions[0]?.shares,12);
   await page.getByRole('button',{name:'Remove IREN',exact:true}).click();await page.getByText('Your portfolio starts here',{exact:true}).waitFor();assert.equal(db.portfolio_positions.length,0);
  });
  await test('watch reason save/filter/remove',{group:'interactions',ids:['K07','L02']},async()=>{await go('/watchlist');await page.getByRole('button',{name:'Add watch reason',exact:true}).click();await page.getByLabel('Symbol',{exact:true}).fill('IREN');await page.getByLabel('Why I am watching',{exact:true}).fill('SYNTHETIC QA: investigate infrastructure delivery.');await page.getByLabel('Condition I want to see',{exact:true}).fill('SYNTHETIC QA: dated operating capacity filing.');await page.getByRole('button',{name:'Save watch reason',exact:true}).click();await page.getByText('IREN watch reason saved to your account.',{exact:true}).waitFor();assert.equal(db.watchlist_items.find(r=>r.symbol==='IREN')?.watchlist_id,'synthetic-list');await page.getByLabel('Filter watched symbols',{exact:true}).fill('no-match');await page.getByText('No symbols match these filters.',{exact:true}).waitFor();await page.getByLabel('Filter watched symbols',{exact:true}).fill('');await page.getByRole('button',{name:'Remove IREN from watchlist',exact:true}).click();await page.getByText('IREN removed from your watchlist.',{exact:true}).waitFor();assert.ok(!db.watchlist_items.some(r=>r.symbol==='IREN'));});
  await test('price alert create/pause/resume/remove',{group:'interactions',ids:['K07','L04']},async()=>{db.alerts=[];await go('/alerts');await page.getByText('Saved price targets',{exact:true}).click();await page.getByLabel('Symbol',{exact:true}).fill('IREN');await page.getByLabel('Target price ($)',{exact:true}).fill('42');await page.locator('form').getByRole('button',{name:'Create alert',exact:true}).click();await page.getByRole('button',{name:'Pause',exact:true}).click();await page.getByRole('button',{name:'Resume',exact:true}).waitFor();assert.equal(db.alerts[0]?.is_active,false);await page.getByRole('button',{name:'Resume',exact:true}).click();await page.getByRole('button',{name:'Pause',exact:true}).waitFor();assert.equal(db.alerts[0]?.is_active,true);await page.getByRole('button',{name:'Remove IREN alert',exact:true}).click();await page.getByText('IREN removed.',{exact:true}).waitFor();assert.equal(db.alerts.length,0);});
  await test('profile and appearance save/reload',{group:'interactions',ids:['K06','K07']},async()=>{await go('/profile');await page.getByLabel('Full name',{exact:true}).fill('Synthetic Updated User');await page.getByRole('button',{name:'Save changes',exact:true}).click();await page.getByText('Profile saved.',{exact:true}).waitFor();assert.equal(user.user_metadata.full_name,'Synthetic Updated User');await page.getByRole('button',{name:'Dark',exact:true}).click();await page.getByRole('button',{name:'Save preferences',exact:true}).click();await page.reload({waitUntil:'domcontentloaded'});assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),'dark');});
  await test('onboarding save and continuation',{group:'interactions',ids:['K06','K07']},async()=>{await go('/onboarding');await page.getByRole('button',{name:'Beginner',exact:true}).click();await page.getByRole('button',{name:'Continue',exact:true}).click();await page.waitForURL('**/personalization?welcome=1');assert.equal(user.user_metadata.experience_level,'Beginner');});
  await test('search keyboard selection and metric help Escape',{group:'interactions',ids:['K03','K05','K07']},async()=>{await go('/analyze');const search=page.getByRole('combobox',{name:'Search investments'});assert.equal(await search.count(),1);await search.fill('app');await page.locator('.uxSearchResults [role=option]').first().waitFor();assert.equal(await page.locator('.uxSearchResults [role=option]').first().getAttribute('href'),'/stock/APP');await search.press('ArrowDown');assert.ok(await search.getAttribute('aria-activedescendant'));await search.press('Escape');assert.equal(await search.getAttribute('aria-expanded'),'false');await page.getByRole('button',{name:'About Business quality',exact:true}).click();await page.getByRole('dialog').waitFor();await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);});
  await test('FAQ search filters results',{group:'interactions',ids:['K06','K07']},async()=>{await go('/faq');const before=await page.locator('.secondaryQuestion').count();await page.getByRole('searchbox',{name:'Search help articles'}).fill('missing');const count=await page.locator('.secondaryQuestion').count();assert.ok(count>0&&count<before);});
  await test('paper ticket preview precedes mocked acceptance',{group:'interactions',ids:['J05','J08','K07'],boundary:'UI request flow only; no order leaves the browser fixture'},async()=>{await go('/trading-lab');await page.getByLabel('Symbol',{exact:true}).fill('IREN');await page.getByLabel('Quantity',{exact:true}).fill('10');await page.getByLabel('Limit price ($)',{exact:true}).fill('25');const start=writes.length;await page.getByRole('button',{name:'Review paper order',exact:true}).click();await page.getByRole('button',{name:'Confirm paper order',exact:true}).waitFor();assert.equal(writes.slice(start).filter(x=>x.confirmed).length,0);await page.getByRole('button',{name:'Confirm paper order',exact:true}).click();await page.getByText('Paper order recorded: accepted.',{exact:false}).waitFor();assert.equal(writes.slice(start).filter(x=>x.confirmed).length,1);return {screenshot:await capture(page,'synthetic-paper-ticket-390')};});
  await test('weekly chart controls and invalid-anchor rejection',{group:'interactions',ids:['F01','F03','F04','F07']},async()=>{await go('/stock/NBIS');await page.getByRole('tab',{name:'Technicals',exact:true}).click();const study=page.getByRole('region',{name:'Weekly Fibonacci research'});await study.locator('canvas').first().waitFor();await study.getByLabel('Average calculation',{exact:true}).selectOption('WMA');await study.getByLabel('Fibonacci price scale',{exact:true}).selectOption('log');await study.getByLabel('Conditional extensions',{exact:true}).check();await study.getByLabel('Swing anchor selection',{exact:true}).selectOption('manual');const start=await study.getByLabel('Swing start week',{exact:true}).inputValue(),end=await study.getByLabel('Swing end week',{exact:true}).inputValue();await study.getByLabel('Swing end week',{exact:true}).selectOption(start);assert.equal(await study.locator('.weeklyAnchorSummary').count(),0);await study.getByLabel('Swing end week',{exact:true}).selectOption(end);await study.getByLabel('Swing anchor selection',{exact:true}).selectOption('auto');await study.getByRole('button',{name:'Expand weekly chart',exact:true}).click();await page.locator('dialog[open].weeklyExpanded').waitFor();await page.keyboard.press('Escape');assert.equal(await page.locator('dialog[open].weeklyExpanded').count(),0);});
  for(const symbol of ['MSFT','APP','IREN','ASTS','BTC/USD'])await test(`valuation evidence gate ${symbol}`,{group:'interactions',ids:['E01','E02','E06','E07'],symbol},async()=>{await go('/stock/'+encodeURIComponent(symbol));await page.getByRole('tab',{name:'Valuation',exact:true}).click();const panel=page.locator('.valuationWorkbench');await panel.waitFor();if(symbol==='MSFT'){await panel.locator('.valuationRange').waitFor();const before=await panel.locator('.valuationScenario.base strong').innerText();await page.getByRole('spinbutton',{name:'Annual cash-flow growth',exact:true}).fill('5');assert.notEqual(await panel.locator('.valuationScenario.base strong').innerText(),before);await page.getByRole('spinbutton',{name:'Equity discount rate',exact:true}).fill('1');await panel.locator('[role=alert]').waitFor();assert.equal(await panel.locator('.valuationScenario.base strong').innerText(),'Needs inputs');}else{await panel.locator('.valuationUnavailable').waitFor();assert.equal(await panel.locator('.valuationAssumptions input').count(),0);}return {screenshot:await capture(page,'synthetic-valuation-'+safe(symbol)+'-390')};});
  await test('complete research journey: discover, evidence, compare, saved view, Ask and Today',{group:'interactions',ids:['B07','K01','K02','L01','L02','L03','L05','L06','N03']},async()=>{
   await go('/discover');await page.getByRole('link',{name:/NBIS/}).first().click();await page.waitForURL('**/stock/NBIS');
   const depth=page.getByRole('group',{name:'Research depth',exact:true});await depth.getByRole('button',{name:'Advanced',exact:true}).click();await page.getByLabel(/^Your horizon/).selectOption('long');await page.getByText('Model inputs & policy',{exact:false}).waitFor();
   assert.equal(await page.getByLabel(/^Your horizon/).inputValue(),'long');await depth.getByRole('button',{name:'Quick view',exact:true}).click();assert.equal(await page.getByLabel(/^Your horizon/).inputValue(),'long');await page.getByText('Main risk',{exact:true}).waitFor();
   await page.getByText('Ask AURYN, save research & compare',{exact:true}).click();const workspace=page.getByRole('region',{name:'Personal research workspace',exact:true});await workspace.getByLabel('Add comparison symbol',{exact:true}).fill('MSFT');await workspace.getByRole('button',{name:'Add peer',exact:true}).click();await workspace.getByRole('button',{name:'Load comparison evidence',exact:true}).click();await workspace.getByRole('region',{name:'Peer evidence comparison'}).waitFor();assert.match(await workspace.innerText(),/Business models differ/);
   await workspace.getByLabel('Save this view',{exact:true}).fill('Synthetic QA peer review');await workspace.getByRole('button',{name:'Save view',exact:true}).click();await workspace.getByText('Research view saved to your account.',{exact:true}).waitFor();assert.ok(workspaceRows.some(r=>r.kind==='view'&&r.payload.name==='Synthetic QA peer review'));
   await workspace.getByLabel(/^Company/).selectOption('NBIS');await workspace.getByRole('button',{name:'Strongest counterargument',exact:true}).click();await workspace.getByText('EVIDENCE ANSWER',{exact:true}).waitFor();await workspace.getByText(/Sources & saved evidence/).click();assert.match(await workspace.innerText(),/synthetic-saved-NBIS/);
   await workspace.getByLabel('Why I am watching',{exact:true}).fill('SYNTHETIC QA: inspect business evidence before allocating.');await workspace.getByLabel('Condition I want to see',{exact:true}).fill('SYNTHETIC QA: comparable dated operating evidence.');await workspace.getByRole('button',{name:'Save watch reason',exact:true}).click();await workspace.getByText('NBIS watch reason saved to your account.',{exact:true}).waitFor();
   await go('/dashboard');await page.getByRole('heading',{name:'Today, with context.',exact:true}).waitFor();await page.getByRole('button',{name:'Refresh research',exact:true}).click();await page.getByText(/new evidence snapshot/).waitFor();await page.getByText('SYNTHETIC QA milestone',{exact:true}).first().waitFor();return {screenshot:await capture(page,'synthetic-complete-journey-today-390')};
  });
  await test('research alert preferences, deduplication and read history',{group:'interactions',ids:['L04']},async()=>{
   await go('/alerts');await page.getByLabel('Enable research alerts',{exact:true}).click();await page.getByText('Alert preferences saved.',{exact:true}).waitFor();assert.equal(workspaceRows.find(r=>r.kind==='preferences')?.payload.enabled,false);await page.getByLabel('Enable research alerts',{exact:true}).click();await waitFixture(()=>workspaceRows.find(r=>r.kind==='preferences')?.payload.enabled===true,'Alert preference save must complete');await page.getByRole('button',{name:'Refresh research',exact:true}).click();await page.getByText(/new evidence snapshot/).waitFor();const before=workspaceRows.filter(r=>r.kind==='alert').length;await page.getByRole('button',{name:'Refresh research',exact:true}).click();await page.getByText(/0 new in-app alerts/).waitFor();assert.equal(workspaceRows.filter(r=>r.kind==='alert').length,before);await page.getByRole('button',{name:'Mark read',exact:true}).first().click();await page.getByText('Alert marked as read.',{exact:true}).waitFor();assert.ok(workspaceRows.some(r=>r.kind==='alert'&&r.payload.read));
  });
  await test('supported accumulation caps, pause, original journal and review',{group:'interactions',ids:['G01','G02','G03','G04','G06','H03','H05','H06','N03']},async()=>{
   await go('/stock/QA-MATURE');await page.getByText('Plan an accumulation & review portfolio impact',{exact:true}).click();const planner=page.getByRole('region',{name:'Accumulation & portfolio planning',exact:true});await planner.waitFor();await planner.getByLabel('Cash available ($)',{exact:true}).fill('1000');await planner.getByLabel('Total portfolio including cash ($)',{exact:true}).fill('10000');await planner.getByLabel('QA-MATURE existing position ($)',{exact:true}).fill('0');await planner.getByLabel('Reference share price ($)',{exact:true}).fill('80');await planner.getByLabel('Maximum period budget ($)',{exact:true}).fill('500');await planner.getByLabel(/^Requested allocation/).selectOption('4');
   const result=planner.getByText('Proposed cash allocation',{exact:true}).locator('..').locator('strong');assert.equal(await result.innerText(),'$400.00');await planner.getByLabel('Pause this plan',{exact:true}).check();assert.equal(await result.innerText(),'$0.00');await planner.getByLabel('Pause this plan',{exact:true}).uncheck();await planner.getByLabel('Maximum period budget ($)',{exact:true}).fill('50');assert.equal(await result.innerText(),'$50.00');await planner.getByLabel('Maximum period budget ($)',{exact:true}).fill('500');assert.ok(await planner.getByRole('link',{name:'Review in Paper Lab →',exact:true}).getAttribute('href'));
   await planner.getByText('Decision journal · immutable originals',{exact:true}).click();await planner.getByLabel('Original thesis & counterevidence',{exact:true}).fill('SYNTHETIC QA original thesis; funding risk recorded.');for(const label of ['I reviewed dated evidence','I recorded the main counterargument and risks','I checked cash and exposure limits'])await planner.getByLabel(label,{exact:true}).check();await planner.getByRole('button',{name:'Save original decision',exact:true}).click();await planner.getByText(/Original decision saved/).waitFor();assert.ok(workspaceRows.some(r=>r.kind==='decision-journal'&&r.payload.symbol==='QA-MATURE'),'Journal write must use authenticated storage adapter, not session-only state');
   const original=workspaceRows.find(r=>r.kind==='decision-journal'&&r.payload.symbol==='QA-MATURE');await planner.getByLabel(/^Review an original decision/).selectOption(original.key);await planner.getByLabel(/^Observed outcome/).selectOption('loss');await planner.getByLabel('New review evidence & outcome notes',{exact:true}).fill('SYNTHETIC QA loss does not erase process checklist.');await planner.getByRole('button',{name:'Append review',exact:true}).click();await planner.getByText('Review added; original evidence is unchanged.',{exact:true}).waitFor();assert.equal(original.payload.processScore,100);assert.equal(workspaceRows.filter(r=>r.kind==='decision-journal'&&r.key===original.key).length,1);return {screenshot:await capture(page,'synthetic-planning-journal-390')};
  });
  await test('accumulation visual history and imported equal-budget replay',{group:'interactions',ids:['G05','H05','K08']},async()=>{
   await go('/stock/QA-MATURE');await page.getByText('Plan an accumulation & review portfolio impact',{exact:true}).click();
   const planner=page.getByRole('region',{name:'Accumulation & portfolio planning',exact:true});
   await planner.getByLabel('Accumulation at a glance',{exact:true}).waitFor();
   await planner.getByText('Equal-budget replay & observation',{exact:true}).click();
   const bars=[{at:'2026-01-02T12:00:00Z',price:10},{at:'2026-02-02T12:00:00Z',price:8},{at:'2026-03-02T12:00:00Z',price:12}];
   const evidence={snapshotId:'SYNTHETIC-replay',knownAt:'2026-01-01T00:00:00Z',thesis:'intact',valuation:'supported',fundingRisk:'normal',evidenceReady:true,tacticalSetup:'weak',references:['SYNTHETIC-not-investment-evidence']};
   const dataset={bars,contributions:bars.map(b=>({at:b.at,amount:100})),decisions:[{knownAt:evidence.knownAt,multiplier:2,evidence,modelVersion:'SYNTHETIC-observation'}],contribution:100,initialCash:100,feeFixed:0,feeBps:5,slippageBps:10,maxPositionPct:100,policyVersion:'SYNTHETIC-observation'};
   await planner.getByLabel('Load a point-in-time replay JSON',{exact:true}).setInputFiles({name:'synthetic-replay.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(dataset))});
   await planner.getByRole('img',{name:'Fixed DCA and candidate simulated unit values over the supplied history',exact:true}).waitFor();
   assert.equal(await planner.getByLabel('Equal-budget DCA comparison',{exact:true}).locator('polyline').count(),2);
   await planner.getByText(/Allocation history ·/).click();
   assert.match(await planner.getByLabel('Accumulation at a glance',{exact:true}).innerText(),/Last saved decision/);
   for(const theme of themes)for(const width of widths){
    await page.setViewportSize({width,height:900});await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
    const measurement=await measured(page);assert.ok(measurement.scroll<=measurement.viewport+2,`Planning overflow ${width}: ${measurement.scroll}`);
    const screenshot=await capture(page,`${theme}-${width}-accumulation-replay`);report.cases.push({name:`accumulation visuals ${theme} ${width}`,group:'planning',width,theme,passed:true,measurement,screenshot});
   }
   await page.setViewportSize({width:390,height:900});
  });
  await test('workspace failure remains explicit and retry recovers',{group:'interactions',ids:['K07','N02']},async()=>{
   let fail=true;const failing=async route=>fail?fulfill(route,{error:'SYNTHETIC QA storage outage',storage:'unavailable'},503):route.fallback();await context.route('**/api/research-workspace',failing);try{await go('/watchlist');await page.getByText('Nothing has been saved locally or to your account. Existing company research is still available.',{exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Refresh research',exact:true}).isDisabled(),true);fail=false;await page.getByRole('button',{name:'Retry connection',exact:true}).click();await page.getByRole('button',{name:'Refresh research',exact:true}).waitFor();await page.waitForFunction(()=>!Array.from(document.querySelectorAll('button')).find(x=>x.textContent==='Refresh research')?.disabled);assert.equal(await page.getByRole('button',{name:'Refresh research',exact:true}).isDisabled(),false);}finally{await context.unroute('**/api/research-workspace',failing);}
  });
  db.portfolio_positions=[{id:'synthetic-stock',user_id:user.id,symbol:'IREN',asset_type:'EQUITY',shares:500,avg_cost:20,horizon:'long'},{id:'synthetic-crypto',user_id:user.id,symbol:'BTC/USD',asset_type:'CRYPTO',shares:.1,avg_cost:60000,horizon:'long'},{id:'synthetic-cash',user_id:user.id,symbol:'USD',asset_type:'CASH',shares:10000,avg_cost:1,horizon:'long'}];
  for(const theme of themes)for(const width of widths)await test(`populated portfolio ${theme} ${width}`,{group:'interactions',ids:['H01','K08'],theme,width},async()=>{await page.setViewportSize({width,height:900});await page.evaluate(value=>localStorage.setItem('auryn-theme',value),theme);await go('/portfolio');await page.getByRole('button',{name:'Holdings',exact:true}).click();await page.getByRole('link',{name:'Open IREN investment research',exact:true}).waitFor();const measurement=await measured(page);assert.ok(measurement.scroll<=measurement.viewport+2,`Document overflow ${measurement.scroll} > ${measurement.viewport}`);return {measurement,screenshot:await capture(page,`${theme}-${width}-populated-portfolio`)};});
  await test('sign out returns to login',{group:'interactions',ids:['K06','K07']},async()=>{await go('/analyze');await page.getByRole('button',{name:'Account menu',exact:true}).click();await page.getByRole('button',{name:'Sign out',exact:true}).click();await page.waitForURL(url=>url.pathname==='/login');await page.getByRole('heading',{name:'Welcome back',exact:true}).waitFor();});
  await test('sign-in, reset request and registration confirmation use intercepted auth only',{group:'interactions',ids:['K06','K07']},async()=>{
   await go('/login');await page.getByLabel('Email',{exact:true}).fill('fixture-user@example.invalid');await page.getByLabel('Password',{exact:true}).fill('Synthetic-Only-Password-2026');await page.getByRole('button',{name:'Show password',exact:true}).click();assert.equal(await page.getByLabel('Password',{exact:true}).getAttribute('type'),'text');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.waitForURL('**/dashboard');
   await go('/forgot-password');await page.getByLabel('Email',{exact:true}).fill('fixture-user@example.invalid');await page.getByRole('button',{name:'Send reset link',exact:true}).click();await page.getByText('If an account exists for this email, you will receive a password reset link.',{exact:true}).waitFor();
   await go('/register');await page.getByLabel('Full name',{exact:true}).fill('Synthetic Registration');await page.getByLabel('Email',{exact:true}).fill('synthetic-registration@example.invalid');await page.getByLabel('Password',{exact:true}).fill('Synthetic-Only-Password-2026');await page.getByRole('checkbox').check();await page.getByRole('button',{name:'Create account',exact:true}).click();await page.getByRole('heading',{name:'Check your email',exact:true}).waitFor();
  });
  await context.close();
 }
 if(mode==='public'){
  const context=await newContext(browser,{authenticated:false});
  for(const route of ['/api/trading-lab/status','/api/trading-lab/diagnostics','/api/portfolio/pulse'])await test(`anonymous local API denied ${route}`,{group:'anonymous-api',route},async()=>{const response=await context.request.get(base.origin+route);assert.ok([401,403].includes(response.status()),`Expected explicit 401/403, got ${response.status()}; missing configuration is not proof of authorization`);return {status:response.status()};});
  await context.close();
 }
}catch(error){report.fatalError=error.stack||String(error);console.error(error);}finally{
 if(browser)await browser.close();
 report.finishedAt=new Date().toISOString();report.summary={cases:report.cases.length,passed:report.cases.filter(x=>x.passed).length,failed:report.cases.filter(x=>!x.passed).length,runtimeErrors:report.runtimeErrors.length,unlabeledControlCases:report.cases.filter(x=>x.measurement?.unlabeled.length).length,smallTargetCases:report.cases.filter(x=>x.measurement?.smallTargets.length).length};
 report.fixtureWrites=mode==='fixture'?writes:undefined;
 report.sourceBoundary='Build ID and lockfile hash identify local artifacts. If source changes after build, rerun production build and all affected gates. This report does not certify the unbuilt source.';
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
 const images=report.cases.filter(x=>x.screenshot);const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
 fs.writeFileSync(path.join(out,'screenshots.html'),`<!doctype html><meta charset="utf-8"><title>AURYN current release ${mode} captures</title><style>body{font:16px system-ui;background:#edf2f9;color:#17263d;margin:24px}section{margin:24px 0;border:1px solid #b9c6da;padding:16px;background:white}img{max-width:100%;height:auto}h2{font-size:18px}</style><h1>AURYN ${mode} browser captures</h1><p>${escape(report.scope)}</p><p>Approved reference boards: docs/redesign/approved-2026-10-16. Captures are actual local app renders; synthetic market/account data is confined to this QA run. No exact pixel-fidelity claim.</p>${images.map(x=>`<section><h2>${escape(x.name)}</h2><p>${x.passed?'Passed recorded checks':'Failed recorded checks'}</p><img loading="lazy" src="${escape(x.screenshot)}" alt="${escape(x.name)}"></section>`).join('')}`);
 console.log(JSON.stringify({out,...report.summary,fatalError:report.fatalError||null}));
 if(report.fatalError||report.summary.failed||report.runtimeErrors.length)process.exitCode=1;
}
