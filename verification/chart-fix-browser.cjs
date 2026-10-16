// Run against a local production build with visual Supabase settings.
// Install Playwright separately, or provide PLAYWRIGHT_MODULE_PATH.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const base=process.env.AURYN_TEST_URL||'http://127.0.0.1:3102';
const fixture=JSON.parse(fs.readFileSync('verification/research-fixture.json','utf8'));
const company=JSON.parse(fs.readFileSync('verification/fixtures/product-company.json','utf8'));
// Synthetic completed-bar states exercise the multi-timeframe layout only.
const longBars=[];
for(let day=new Date('2021-09-27T00:00:00Z'),i=0;day<=new Date('2026-10-09T00:00:00Z');day.setUTCDate(day.getUTCDate()+1)){
 if([0,6].includes(day.getUTCDay()))continue;
 const close=80+i*.06+25*Math.sin(i/31)+9*Math.sin(i/9),open=close+Math.sin(i)*1.3;
 longBars.push({time:day.toISOString().slice(0,10),open,high:Math.max(open,close)+2,low:Math.min(open,close)-2,close,volume:1000000+i*100});i++;
}
const timeframes=['15M','1H','4H','1D','1W'];
const marketIntelligence={snapshotId:'product-layout-fixture',confirmed:Object.fromEntries(timeframes.map(tf=>[tf,{rating:'NEUTRAL',score:0,price:150,counts:{buy:1,neutral:3,sell:1},trend:{score:50},momentum:{score:50},participation:{score:50},relativeStrength:{score:50}}])),livePreview:{},actionMap:{preferredEntry:{low:140,high:145},confirm:155,support:140,majorSupport:130,t1:160,t2:170,invalidation:125},coverage:{requested:timeframes}};

(async()=>{
 const args=process.env.CHROMIUM_ARGS?JSON.parse(process.env.CHROMIUM_ARGS):['--no-sandbox'];
 const launchOptions={headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,args};
 const reports=[],errors=[],network=[];
 const user={id:'00000000-0000-0000-0000-000000000001',email:'visual-test@example.invalid',app_metadata:{role:'admin'},user_metadata:{full_name:'Visual Test',auryn_onboarded:true},aud:'authenticated',role:'authenticated'};
 const access=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url')+'.'+Buffer.from(JSON.stringify({sub:user.id,exp:Math.floor(Date.now()/1000)+3600,aud:'authenticated'})).toString('base64url')+'.visual';
 const session={access_token:access,refresh_token:'visual-refresh',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user};
 for(const theme of ['light','dark'])for(const width of [390,1440]){
  const browser=await chromium.launch(launchOptions);
  const context=await browser.newContext({viewport:{width,height:900},isMobile:width<641,hasTouch:width<641,locale:'en-US',reducedMotion:'reduce'});
  await context.addCookies([{name:'sb-visual-auth-token',value:'base64-'+Buffer.from(JSON.stringify(session)).toString('base64url'),domain:new URL(base).hostname,path:'/'}]);
  await context.addInitScript(theme=>localStorage.setItem('auryn-theme',theme),theme);
  await context.route('https://visual.supabase.co/**',route=>{const p=new URL(route.request().url()).pathname;let data=[];if(p.includes('/auth/'))data=p.endsWith('/user')?user:session;if(p.includes('profiles'))data={full_name:'Visual Test'};return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});});
  await context.route('https://financialmodelingprep.com/**',route=>route.abort());
  const counts={};let failNextWeek=false;
  await context.route('**/api/**',route=>{
   const url=new URL(route.request().url()),p=url.pathname,key=p+url.search;counts[key]=(counts[key]||0)+1;
   let data={items:[]};
   if(p.includes('/analyze/'))data={...fixture.analysis,marketIntelligence,symbol:'NBIS',name:'Research verification fixture'};
   if(p.includes('/company/'))data=company;
   if(p.includes('/canonical/'))data={market:fixture.market,research:{state:'READY'}};
   if(p.includes('/quote/'))data={...fixture.market,marketTruth:fixture.market,price:fixture.market.displayPrice};
   if(p.includes('/chart/')){
    const range=url.searchParams.get('range');
    if(range==='1W'&&failNextWeek){failNextWeek=false;return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Chart provider rate limit reached. Try again shortly.'})});}
    const intraday=range==='1D'||range==='1W',count=range==='1D'?96:168,step=range==='1D'?900:3600;
    const bars=Array.from({length:count},(_,i)=>({time:Math.floor(Date.now()/1000)-(count-i)*step,open:150+i*.05,high:152+i*.05,low:149+i*.05,close:151+i*.05,volume:100000}));
    data={candles:range==='5Y'?longBars:intraday?bars:fixture.bars,coverage:intraday?(range==='1D'?'Last 24 hours':'Last 7 days'):'Daily history',timeZone:intraday?'UTC':'Exchange dates'};
   }
   if(p.includes('/calibration'))data={outcomes:{},cohorts:[],learning:{maturedOutcomes:0}};
   if(p.includes('/model-health'))data={proof:{grade:'UNPROVEN',exactSampleN:0}};
   if(p.includes('/options/'))data={enabled:false,reason:'Offline verification has no options feed.'};
   return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
  });
  console.log(`Checking ${theme} ${width}`);
  const page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push({theme,width,error:e.message}));
  await page.goto(base+'/stock/NBIS',{waitUntil:'domcontentloaded',timeout:60000});
  await page.addStyleTag({content:'html{scroll-behavior:auto!important}'});
  await page.waitForLoadState('networkidle');await page.locator('.surfaceAnalystSummary').waitFor();
  const plot=page.locator('.researchChart .chartCanvas').first();await plot.scrollIntoViewIfNeeded();const box=await plot.boundingBox();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);const beforeScroll=await page.evaluate(()=>scrollY);await page.mouse.wheel(0,400);
  await page.waitForFunction(y=>scrollY>y+30,beforeScroll,{timeout:2500});
  if(width<641){
   await plot.evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));const touchBox=await plot.boundingBox(),beforeTouch=await page.evaluate(()=>scrollY),x=Math.round(touchBox.x+touchBox.width/2),y=Math.round(touchBox.y+touchBox.height/2);
   const cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,radiusX:2,radiusY:2}]});
   for(let step=1;step<=10;step++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-step*15,radiusX:2,radiusY:2}]});await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(resolve)));}
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   await page.waitForFunction(scroll=>scrollY>scroll+30,beforeTouch,{timeout:3000});await cdp.detach();
  }
  await page.evaluate(()=>scrollTo(0,0));
  const chart=page.locator('.surfaceChart');
  await chart.getByRole('button',{name:'Zoom in chart',exact:true}).click();
  assert.match(await chart.locator('.priceChartNavigation:visible').innerText(),/Zoom 1.3/);
  await chart.getByRole('button',{name:'Reset chart zoom',exact:true}).click();
  assert.match(await chart.locator('.priceChartNavigation:visible').innerText(),/Full range/);
  await chart.getByRole('button',{name:'1D',exact:true}).click();
  await chart.getByText('1D · Last 24 hours · UTC',{exact:true}).waitFor();
  await chart.locator('canvas').first().waitFor();
  failNextWeek=true;
  await chart.getByRole('button',{name:'1W',exact:true}).click();
  await chart.getByText('Chart provider rate limit reached. Try again shortly.',{exact:true}).waitFor();
  assert.equal(await chart.locator('canvas').count(),0,'Failed range must clear earlier bars');
  await chart.getByRole('button',{name:'Retry history',exact:true}).click();
  await chart.getByText('1W · Last 7 days · UTC',{exact:true}).waitFor();
  await chart.locator('canvas').first().waitFor();
  assert.equal(counts['/api/chart/NBIS?range=1W'],2,'Retry must issue a new request');
  await chart.getByRole('button',{name:'3M',exact:true}).click();
  await page.getByRole('tab',{name:'Business',exact:true}).click();
  await page.getByRole('heading',{name:/Moat unassessed/}).waitFor();
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
    const order=await page.evaluate(()=>({decision:document.querySelector('.surfaceAnalystSummary').getBoundingClientRect().top,chart:document.querySelector('.researchChart').getBoundingClientRect().top}));
    assert.ok(order.decision<order.chart,'Canonical decision must appear above the price chart');
   }
   if(tab==='Business'){
    const text=await panel.innerText();assert.ok(text.includes('USD 529.8M'),'Current reported USD revenue must render');
    assert.ok(!text.includes('$800.13B'),'RUB predecessor revenue cannot be relabeled as USD');
    assert.ok(text.includes('Moat unassessed'));
   }
   if(tab==='Valuation'){
    await panel.locator('.valuationWorkbench').waitFor();
    assert.equal(await panel.locator('.valuationAssumptions input').count(),0,'Incomplete NBIS evidence cannot enable a scenario editor');
   }
   if(tab==='Technicals'){
    const study=page.getByRole('region',{name:'Weekly Fibonacci research'});
    await study.locator('canvas').first().waitFor();
    assert.ok((await study.locator('.weeklyChartLegend').innerText()).includes('200-week SMA'));
    assert.ok(!(await study.locator('.weeklyChartLegend').innerText()).includes('Needs 200'));
    assert.equal(await study.locator('.weeklyAnchorSummary').count(),1,'Confirmed swing must render');
    const firstLevel=await study.locator('.weeklyAnchorSummary').innerText();assert.match(firstLevel,/Week of [A-Z][a-z]{2} \d+, \d{4}/);assert.doesNotMatch(firstLevel,/\d{4}-\d{2}-\d{2}/);
    await study.getByLabel('Average calculation',{exact:true}).selectOption('WMA');
    await study.getByLabel('Fibonacci price scale',{exact:true}).selectOption('log');
    await study.getByLabel('Conditional extensions',{exact:true}).check();
    await study.getByLabel('Fibonacci levels',{exact:true}).uncheck();
    await study.getByLabel('Fibonacci levels',{exact:true}).check();
    await study.getByLabel('Weekly averages',{exact:true}).uncheck();
    await study.getByLabel('Weekly averages',{exact:true}).check();
    await study.getByLabel('Swing anchor selection',{exact:true}).selectOption('manual');
    const start=await study.getByLabel('Swing start week',{exact:true}).inputValue();
    const end=await study.getByLabel('Swing end week',{exact:true}).inputValue();
    await study.getByLabel('Swing end week',{exact:true}).selectOption(start);
    assert.equal(await study.locator('.weeklyAnchorSummary').count(),0,'Invalid same-week swing must not create levels');
    await study.getByLabel('Swing end week',{exact:true}).selectOption(end);
    await study.getByLabel('Swing anchor selection',{exact:true}).selectOption('auto');
    assert.equal(await study.locator('.weeklyAnchorSummary').innerText(),firstLevel);
    await study.getByRole('button',{name:'Expand weekly chart',exact:true}).click();
    await page.locator('dialog[open].weeklyExpanded').waitFor();
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('dialog[open].weeklyExpanded').count(),0);
    await study.locator('.weeklyDetails').first().locator('summary').click();
    assert.ok((await study.locator('.weeklyDetails').first().innerText()).includes('127.2%'),'Conditional levels have precise table values');
    assert.ok((await study.locator('.weeklyChartLegend').innerText()).includes('200-week WMA'));
    await page.getByRole('tab',{name:'Overview',exact:true}).click();
    await page.getByText('Weekly structure & supporting evidence',{exact:true}).click();
    await page.getByRole('region',{name:'Weekly Fibonacci research'}).getByLabel('Average calculation',{exact:true}).waitFor();
    assert.equal(await page.getByLabel('Average calculation',{exact:true}).inputValue(),'WMA','Preferences persist between technical and overview study');
    assert.equal(await page.getByLabel('Fibonacci price scale',{exact:true}).inputValue(),'log');
    await page.getByRole('tab',{name:'Technicals',exact:true}).click();
    assert.equal(counts['/api/chart/NBIS?range=5Y'],1,'All research studies share one 5Y request');
    // Return to the calm defaults for visual review.
    await page.getByLabel('Average calculation',{exact:true}).selectOption('SMA');
    await page.getByLabel('Fibonacci price scale',{exact:true}).selectOption('linear');
    await page.getByLabel('Conditional extensions',{exact:true}).uncheck();
    await page.getByText('Daily indicators & execution evidence',{exact:true}).click();
    await page.getByText('Multi-timeframe evidence',{exact:true}).click();
    const spacing=await page.locator('.researchTechnicalDetail').evaluate(el=>{const last=el.lastElementChild,previous=last.previousElementSibling;return{gap:last.getBoundingClientRect().top-previous.getBoundingClientRect().bottom,bottom:el.getBoundingClientRect().bottom-last.getBoundingClientRect().bottom};});
    assert.ok(spacing.gap>=12&&spacing.bottom>=20,'Nested technical evidence must have a visible gap and bottom padding');
   }
   const measure=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
   assert.ok(measure.scroll<=measure.viewport+2,`${tab} document overflows at ${width}`);
   reports.push({theme,width,tab,...measure});
   if(['Overview','Business','Technicals'].includes(tab)&&[390,1440].includes(width)){
    await page.evaluate(()=>{window.scrollTo({top:0,behavior:'instant'});document.activeElement?.blur();});
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    await page.screenshot({path:`verification/screenshots/chart-fix-${theme}-${tab}-${width}.png`,fullPage:true});
   }
  }
  await browser.close();
 }
 const report={scope:'Local production Chromium, intercepted auth/APIs, synthetic price/action fixtures and public SEC company-facts fixture and 263 synthetic weeks. Chart wheel and mobile touch scrolling, explicit zoom/reset, 1D and 1W numeric timestamp bars, failed range clearing and retry, decision order, human-readable dates, nested spacing and weekly controls exercised. Not real-device Safari or live brokerage verification.',reports,network,errors};
 fs.writeFileSync('verification/chart-fix-browser-report.json',JSON.stringify(report,null,2)+'\n');
 assert.equal(errors.length,0,'No browser runtime errors');
 console.log(JSON.stringify({screens:reports.length,networkCases:network.length,runtimeErrors:errors.length}));
})().catch(error=>{console.error(error);process.exit(1);});
