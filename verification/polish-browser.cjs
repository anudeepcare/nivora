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
 for(const theme of ['light','dark'])for(const width of [320,390,768,1440]){
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
   if(p.includes('/trading-lab/status'))data={broker:{connected:false,configured:false},recentEvaluations:[],recentRuns:[],metrics:{trades:0},orders:0};
   if(p.includes('/analyze/'))data={...fixture.analysis,marketIntelligence,symbol:'NBIS',name:'Research verification fixture'};
   if(p.includes('/company/'))data=company;
   if(p.includes('/canonical/'))data={market:fixture.market,research:{state:'READY'}};
   if(p.includes('/quote/'))data={...fixture.market,marketTruth:fixture.market,price:fixture.market.displayPrice};
   if(p.includes('/chart/'))data={candles:url.searchParams.get('range')==='5Y'?longBars:fixture.bars};
   if(p.includes('/calibration'))data={outcomes:{},cohorts:[],learning:{maturedOutcomes:0}};
   if(p.includes('/model-health'))data={proof:{grade:'UNPROVEN',exactSampleN:0}};
   if(p.includes('/options/'))data={enabled:false,reason:'Offline verification has no options feed.'};
   return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
  });
  console.log(`Global UX ${theme} ${width}`);
  const page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push({theme,width,error:e.message}));
  for(const path of ['/','/login','/register','/forgot-password','/onboarding','/personalization','/analyze','/portfolio','/watchlist','/alerts','/trading-lab','/profile','/faq','/about','/methodology','/terms','/privacy','/disclaimer','/calibration','/research-lab','/stock/NBIS','/reset-password','/auth/callback','/dashboard','/discover','/not-a-real-route']){
   await page.goto(base+path,{waitUntil:'domcontentloaded',timeout:60000});
   await page.locator('h1:visible').first().waitFor();
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   const measure=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,title:document.querySelector('h1')?.textContent,smallInputs:[...document.querySelectorAll('input:not([type=checkbox]):not([type=radio]),select,textarea')].filter(e=>e.getBoundingClientRect().width>0&&parseFloat(getComputedStyle(e).fontSize)<16).map(e=>({name:e.getAttribute('aria-label')||e.name,font:getComputedStyle(e).fontSize})),overflow:[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.right>innerWidth+3&&getComputedStyle(e).position!=='absolute'&&getComputedStyle(e).position!=='fixed'}).slice(0,8).map(e=>({tag:e.tagName,cls:e.className}))}));
   reports.push({theme,width,path,...measure});
   if(measure.scroll>measure.viewport+2)console.log('OVERFLOW',JSON.stringify(reports.at(-1)));
   if([390,1440].includes(width)&&['/','/login','/portfolio','/profile','/personalization','/trading-lab'].includes(path)){
    await page.evaluate(()=>{window.scrollTo({top:0,behavior:'instant'});document.activeElement?.blur();});
    await page.screenshot({path:`verification/screenshots/polish-${theme}-${path==='/'?'home':path.slice(1)}-${width}.png`,fullPage:true});
   }
   if(path==='/faq'){
    const link=page.locator('a[href="/personalization"]').first();await link.click();await page.waitForURL('**/personalization');
   }
  }
  await browser.close();
 }
 const report={scope:'Local production Chromium, mocked auth/service fixtures. Route render/layout and FAQ navigation smoke test; not a claim of every action or live integration certification.',reports,errors};
 fs.writeFileSync('verification/polish-browser-report.json',JSON.stringify(report,null,2)+'\n');
 assert.equal(reports.filter(x=>x.scroll>x.viewport+2).length,0,'No document overflow');
 assert.equal(errors.length,0,'No browser runtime errors');
 console.log(JSON.stringify({screens:reports.length,runtimeErrors:errors.length,smallInputCases:reports.filter(x=>x.width<760&&x.smallInputs.length).map(x=>({path:x.path,width:x.width,inputs:x.smallInputs}))}));
})().catch(error=>{console.error(error);process.exit(1);});
