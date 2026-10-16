// Synthetic financial fixtures test interaction and evidence gates, not investment estimates.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const base=process.env.AURYN_TEST_URL||'http://127.0.0.1:3102';
const read=name=>JSON.parse(fs.readFileSync('verification/'+name,'utf8'));
const fixture=read('research-fixture.json');
const cases={MSFT:read('fixtures/valuation-msft-synthetic.json'),APP:read('fixtures/valuation-app-discontinued-synthetic.json'),NBIS:{company:read('fixtures/product-company.json')},IREN:{company:{dataQuality:{evidenceContract:'sec-company-evidence-v3'},evidence:[]}},'BTC/USD':{company:{dataQuality:{evidenceContract:'sec-company-evidence-v3'},evidence:[]}}};
(async()=>{
 const reports=[],errors=[];
 const user={id:'00000000-0000-0000-0000-000000000001',email:'visual-test@example.invalid',app_metadata:{role:'admin'},user_metadata:{auryn_onboarded:true},aud:'authenticated',role:'authenticated'};
 const access=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url')+'.'+Buffer.from(JSON.stringify({sub:user.id,exp:Math.floor(Date.now()/1000)+3600,aud:'authenticated'})).toString('base64url')+'.visual';
 const session={access_token:access,refresh_token:'visual-refresh',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user};
 for(const width of [375,390,1280,1920]){
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,args:process.env.CHROMIUM_ARGS?JSON.parse(process.env.CHROMIUM_ARGS):['--no-sandbox']});
  const context=await browser.newContext({viewport:{width,height:900},locale:'en-US',reducedMotion:'reduce'});
  await context.addCookies([{name:'sb-visual-auth-token',value:'base64-'+Buffer.from(JSON.stringify(session)).toString('base64url'),domain:new URL(base).hostname,path:'/'}]);
  await context.addInitScript(()=>localStorage.setItem('auryn-theme','light'));
  await context.route('https://visual.supabase.co/**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(route.request().url().includes('/auth/')?user:[])}));
  await context.route('https://financialmodelingprep.com/**',route=>route.abort());
  let symbol='MSFT';
  await context.route('**/api/**',route=>{
   const path=new URL(route.request().url()).pathname,item=cases[symbol];
   const market={...fixture.market,symbol,snapshotId:'offline-'+symbol,...(item.currentPrice?{displayPrice:item.currentPrice,decisionPrice:item.currentPrice,regularClose:item.currentPrice,regularClosePrice:item.currentPrice}:{})};
   let data={items:[]};
   if(path.includes('/analyze/'))data={...fixture.analysis,symbol,name:symbol+' — TEST FIXTURE',assetType:symbol==='BTC/USD'?'crypto':'stock',marketTruth:market,price:market.displayPrice,analysisAnchorPrice:market.displayPrice};
   if(path.includes('/company/'))data=item.company;
   if(path.includes('/context/'))data={profile:item.profile||{name:symbol,currency:'USD'},news:[]};
   if(path.includes('/canonical/'))data={market,research:{state:'READY'}};
   if(path.includes('/quote/'))data={...market,marketTruth:market,price:market.displayPrice};
   if(path.includes('/chart/'))data={candles:fixture.bars};
   if(path.includes('/options/'))data={enabled:false,reason:'Offline test'};
   return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
  });
  const page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push({width,symbol,error:e.message}));
  for(symbol of Object.keys(cases)){
   console.log(`Company ${symbol} ${width}`);
   await page.goto(base+'/stock/'+encodeURIComponent(symbol),{waitUntil:'domcontentloaded'});
   await page.getByRole('tab',{name:'Valuation',exact:true}).click();
   const panel=page.locator('.valuationWorkbench');await panel.waitFor();
   if(symbol==='MSFT'){
    await panel.locator('.valuationRange').waitFor();
    const before=await panel.locator('.valuationScenario.base strong').innerText();
    await page.getByRole('spinbutton',{name:'Annual cash-flow growth',exact:true}).fill('5');
    const after=await panel.locator('.valuationScenario.base strong').innerText();
    assert.notEqual(after,before,'Growth edit recalculates the visible estimate');
    await page.getByRole('spinbutton',{name:'Equity discount rate',exact:true}).fill('1');
    await panel.locator('[role=alert]').waitFor();
    assert.equal(await panel.locator('.valuationScenario.base strong').innerText(),'Needs inputs','Invalid terminal/discount combination blocks estimate');
    await panel.getByRole('button',{name:'Reset examples',exact:true}).click();
    assert.equal(await panel.locator('.valuationScenario.base strong').innerText(),before,'Reset restores starting assumptions');
    await panel.getByRole('button',{name:'About Equity discount rate',exact:true}).click();
    await page.getByRole('dialog').waitFor();
    assert.match(await page.getByRole('dialog').innerText(),/cost-of-equity/);
    await page.keyboard.press('Escape');
   }else{
    await panel.locator('.valuationUnavailable').waitFor();
    assert.equal(await panel.locator('.valuationAssumptions input').count(),0,'Unsupported/missing/negative cash flow blocks projection inputs');
    if(symbol==='APP'){
     await panel.getByText('Reported FCF',{exact:true}).waitFor();
     assert.match(await panel.innerText(),/continuing-business cash flow is not verified/);
    }
    if(symbol==='BTC/USD')assert.match(await panel.innerText(),/different valuation method/);
   }
   const measure=await page.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth}));
   assert.ok(measure.scroll<=measure.viewport+2,`${symbol} overflow at ${width}`);
   reports.push({symbol,width,...measure,scenarioEditor:symbol==='MSFT',passed:true});
   await page.evaluate(()=>{document.activeElement?.blur();window.scrollTo({top:0,behavior:'instant'});});
   if([390,1280].includes(width)&&['MSFT','APP'].includes(symbol))await page.screenshot({path:`verification/screenshots/premium-valuation-${symbol}-${width}.png`,fullPage:true});
  }
  await browser.close();
 }
 fs.writeFileSync('verification/premium-company-browser-report.json',JSON.stringify({scope:'20 local Chromium cases with intercepted services. MSFT/APP financial inputs are synthetic; NBIS uses the saved public evidence fixture. No actual estimate or live service claim.',reports,errors},null,2)+'\n');
 assert.equal(errors.length,0);console.log(JSON.stringify({cases:reports.length,runtimeErrors:errors.length}));
})().catch(error=>{console.error(error);process.exit(1)});
