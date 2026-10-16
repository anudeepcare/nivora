// Run against a local production build with visual Supabase settings.
// Install Playwright separately, or provide PLAYWRIGHT_MODULE_PATH.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const base=process.env.AURYN_TEST_URL||'http://127.0.0.1:3102';
const fixture=JSON.parse(fs.readFileSync('verification/research-fixture.json','utf8'));
const company=JSON.parse(fs.readFileSync('verification/fixtures/product-company.json','utf8'));
// Synthetic completed-bar states exercise the multi-timeframe layout only.
const timeframes=['15M','1H','4H','1D','1W'];
const marketIntelligence={snapshotId:'product-layout-fixture',confirmed:Object.fromEntries(timeframes.map(tf=>[tf,{rating:'NEUTRAL',score:0,price:150,counts:{buy:1,neutral:3,sell:1},trend:{score:50},momentum:{score:50},participation:{score:50},relativeStrength:{score:50}}])),livePreview:{},actionMap:{preferredEntry:{low:140,high:145},confirm:155,support:140,majorSupport:130,t1:160,t2:170,invalidation:125},coverage:{requested:timeframes}};

(async()=>{
 const args=process.env.CHROMIUM_ARGS?JSON.parse(process.env.CHROMIUM_ARGS):['--no-sandbox'];
 const launchOptions={headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,args};
 const reports=[],errors=[],network=[];
 const user={id:'00000000-0000-0000-0000-000000000001',email:'visual-test@example.invalid',app_metadata:{role:'admin'},user_metadata:{full_name:'Visual Test',auryn_onboarded:true},aud:'authenticated',role:'authenticated'};
 const access=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url')+'.'+Buffer.from(JSON.stringify({sub:user.id,exp:Math.floor(Date.now()/1000)+3600,aud:'authenticated'})).toString('base64url')+'.visual';
 const session={access_token:access,refresh_token:'visual-refresh',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user};
 for(const theme of ['light','dark'])for(const width of [320,390,430,1440]){
  const browser=await chromium.launch(launchOptions);
  const context=await browser.newContext({viewport:{width,height:900},locale:'en-US',reducedMotion:'reduce'});
  await context.addCookies([{name:'sb-visual-auth-token',value:'base64-'+Buffer.from(JSON.stringify(session)).toString('base64url'),domain:new URL(base).hostname,path:'/'}]);
  await context.addInitScript(theme=>localStorage.setItem('auryn-theme',theme),theme);
  await context.route('https://visual.supabase.co/**',route=>{const p=new URL(route.request().url()).pathname;let data=[];if(p.includes('/auth/'))data=p.endsWith('/user')?user:session;if(p.includes('profiles'))data={full_name:'Visual Test'};return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});});
  await context.route('https://financialmodelingprep.com/**',route=>route.abort());
  const counts={};
  await context.route('**/api/**',route=>{
   const url=new URL(route.request().url()),p=url.pathname,key=p+url.search;counts[key]=(counts[key]||0)+1;
   let data={items:[]};
   if(p.includes('/analyze/'))data={...fixture.analysis,marketIntelligence,symbol:'NBIS',name:'Research verification fixture'};
   if(p.includes('/company/'))data=company;
   if(p.includes('/canonical/'))data={market:fixture.market,research:{state:'READY'}};
   if(p.includes('/quote/'))data={...fixture.market,marketTruth:fixture.market,price:fixture.market.displayPrice};
   if(p.includes('/chart/'))data={candles:fixture.bars};
   if(p.includes('/calibration'))data={outcomes:{},cohorts:[],learning:{maturedOutcomes:0}};
   if(p.includes('/model-health'))data={proof:{grade:'UNPROVEN',exactSampleN:0}};
   if(p.includes('/options/'))data={enabled:false,reason:'Offline verification has no options feed.'};
   return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
  });
  console.log(`Checking ${theme} ${width}`);
  const page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push({theme,width,error:e.message}));
  await page.goto(base+'/stock/NBIS',{waitUntil:'domcontentloaded',timeout:60000});
  await page.locator('.researchThesis').waitFor();
  await page.getByRole('tab',{name:'Business',exact:true}).click();
  await page.getByRole('heading',{name:'Moat unassessed',exact:true}).waitFor();
  await page.getByRole('tab',{name:'Overview',exact:true}).click();
  await page.getByRole('button',{name:'5Y',exact:true}).click();
  await page.getByRole('tab',{name:'Business',exact:true}).click();
  await page.getByRole('tab',{name:'Overview',exact:true}).click();
  assert.equal(counts['/api/chart/NBIS?range=5Y'],1,'5Y selected chart and roadmap must share their cached request');
  assert.equal(counts['/api/chart/NBIS?range=3M'],1,'Overview reentry must reuse the recent 3M chart');
  network.push({theme,width,chartRequests:Object.fromEntries(Object.entries(counts).filter(([key])=>key.includes('/chart/')))});
  for(const tab of ['Overview','Business','Earnings','Financials','Valuation','Ownership','Catalysts','Options','News','Technicals','Risk']){
   await page.getByRole('tab',{name:tab,exact:true}).click();
   const panel=page.locator('#research-tab-panel');
   if(tab==='Overview'){
    await panel.getByText('New money · today',{exact:true}).waitFor();
    const order=await page.evaluate(()=>({decision:document.querySelector('.researchThesis').getBoundingClientRect().top,chart:document.querySelector('.researchChart').getBoundingClientRect().top}));
    if(width<=760)assert.ok(order.decision<order.chart,'Mobile business/decision context must precede chart');
   }
   if(tab==='Business'){
    const text=await panel.innerText();assert.ok(text.includes('USD 529.8M'),'Current reported USD revenue must render');
    assert.ok(!text.includes('$800.13B'),'RUB predecessor revenue cannot be relabeled as USD');
    assert.ok(text.includes('Moat unassessed'));
   }
   if(tab==='Valuation'){
    await panel.getByText('Why valuation is unavailable',{exact:true}).click();
    assert.ok((await panel.innerText()).includes('Refreshing the stock price cannot complete this valuation model.'));
   }
   if(tab==='Technicals')await page.getByText('Multi-timeframe evidence',{exact:true}).click();
   const measure=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
   assert.ok(measure.scroll<=measure.viewport+2,`${tab} document overflows at ${width}`);
   reports.push({theme,width,tab,...measure});
   if(['Overview','Business','Technicals'].includes(tab)&&[390,1440].includes(width)){
    await page.evaluate(()=>{window.scrollTo({top:0,behavior:'instant'});document.activeElement?.blur();});
    await page.screenshot({path:`verification/screenshots/product-${theme}-${tab}-${width}.png`,fullPage:true});
   }
  }
  await browser.close();
 }
 const report={scope:'Local production Chromium, intercepted auth/APIs, synthetic price/action fixtures and public SEC company-facts fixture. Not real-device Safari or live brokerage verification.',reports,network,errors};
 fs.writeFileSync('verification/product-browser-report.json',JSON.stringify(report,null,2)+'\n');
 assert.equal(errors.length,0,'No browser runtime errors');
 console.log(JSON.stringify({screens:reports.length,networkCases:network.length,runtimeErrors:errors.length}));
})().catch(error=>{console.error(error);process.exit(1);});
