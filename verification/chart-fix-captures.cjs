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
  const page=await context.newPage();page.setDefaultTimeout(15000);
  await page.goto(base+'/stock/NBIS',{waitUntil:'networkidle',timeout:60000});await page.locator('.surfaceAnalystSummary').waitFor();
  for(const tab of ['Overview','Business','Technicals']){
   await page.getByRole('tab',{name:tab,exact:true}).click();
   if(tab==='Technicals'){
    await page.locator('.weeklyStudy canvas').first().waitFor();
    await page.locator('.researchTechnicalDetail').evaluate(el=>{el.open=true;});
    await page.getByText('Multi-timeframe evidence',{exact:true}).evaluate(el=>{el.parentElement.open=true;});
   }
   await page.evaluate(()=>{document.activeElement?.blur();window.scrollTo({top:0,behavior:'instant'});});
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   await page.screenshot({path:`verification/screenshots/chart-fix-${theme}-${tab}-${width}.png`,fullPage:true});
  }
  await browser.close();console.log(`Captured fresh page ${theme} ${width}`);
 }
})().catch(error=>{console.error(error);process.exit(1);});
