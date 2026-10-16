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
 for(const theme of ['light','dark'])for(const width of [320,390,430]){
  const browser=await chromium.launch(launchOptions);
  const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,locale:'en-US',reducedMotion:'reduce'});
  await context.addCookies([{name:'sb-visual-auth-token',value:'base64-'+Buffer.from(JSON.stringify(session)).toString('base64url'),domain:new URL(base).hostname,path:'/'}]);
  await context.addInitScript(theme=>localStorage.setItem('auryn-theme',theme),theme);
  await context.route('https://visual.supabase.co/**',route=>{const p=new URL(route.request().url()).pathname;let data=[];if(p.includes('/auth/'))data=p.endsWith('/user')?user:session;if(p.includes('profiles'))data={full_name:'Visual Test'};if(p.includes('watchlist_items'))data=['MSFT','APP','BTC/USD','BTC/EUR'].map((symbol,i)=>({id:'watch-'+i,user_id:user.id,symbol,created_at:new Date().toISOString()}));return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});});
  await context.route('https://financialmodelingprep.com/**',route=>route.abort());
  const counts={};
  await context.route('**/api/**',route=>{
   const url=new URL(route.request().url()),p=url.pathname,key=p+url.search;counts[key]=(counts[key]||0)+1;
   let data={items:[]};
   if(p.includes('/trading-lab/status'))data={broker:{connected:false,configured:false},recentEvaluations:[],recentRuns:[],metrics:{trades:0},orders:0};
   if(p.includes('/analyze/'))data={...fixture.analysis,marketIntelligence,symbol:'NBIS',name:'Research verification fixture'};
   if(p.includes('/company/'))data=company;
   if(p==='/api/canonical')data={items:(url.searchParams.get('symbols')||'').split(',').filter(Boolean).map(symbol=>({security:{symbol,name:({'MSFT':'Microsoft','APP':'AppLovin','BTC/USD':'Bitcoin'})[symbol]||symbol},market:{...fixture.market,symbol,currency:symbol==='BTC/EUR'?'EUR':'USD',displayPrice:symbol==='MSFT'?420:symbol==='APP'?278:71000},research:{state:'READY',longTermAction:'HOLD',newMoneyAction:'WAIT',setupState:'BUILDING'}}))};
   if(p.includes('/canonical/'))data={market:fixture.market,research:{state:'READY'}};
   if(p.includes('/quote/'))data={...fixture.market,marketTruth:fixture.market,price:fixture.market.displayPrice};
   if(p.includes('/chart/'))data={candles:url.searchParams.get('range')==='5Y'?longBars:fixture.bars};
   if(p.includes('/calibration'))data={outcomes:{},cohorts:[],learning:{maturedOutcomes:0}};
   if(p.includes('/model-health'))data={proof:{grade:'UNPROVEN',exactSampleN:0}};
   if(p.includes('/options/'))data={enabled:false,reason:'Offline verification has no options feed.'};
   return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
  });
  const page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push({theme,width,error:e.message}));
  console.log(`Mobile menu ${theme} ${width}`);
  await page.goto(base+'/analyze',{waitUntil:'domcontentloaded',timeout:60000});
  const nav=page.getByRole('navigation',{name:'Mobile primary',exact:true});await nav.waitFor();
  const metrics=await nav.evaluate(el=>{const r=el.getBoundingClientRect(),style=getComputedStyle(el);return{left:r.left,right:r.right,width:r.width,height:r.height,bottom:r.bottom,viewport:innerWidth,viewportHeight:innerHeight,paddingTop:style.paddingTop,paddingBottom:style.paddingBottom,background:style.backgroundColor,blur:style.backdropFilter,items:[...el.querySelectorAll('a')].map(a=>{const b=a.getBoundingClientRect(),label=a.querySelector('span');return{width:b.width,height:b.height,labelFits:label.scrollWidth<=b.width};})};});
  assert.ok(metrics.left>=7&&metrics.right<=width-7,'Glass dock stays inset from edges');
  assert.ok(metrics.height<=72,'Safe-area space must not inflate the dock');
  assert.equal(metrics.paddingTop,metrics.paddingBottom,'Icons and labels stay vertically centered');
  assert.ok(metrics.blur.includes('blur'),'Glass blur must be present');
  assert.ok(metrics.items.every(x=>x.width>=44&&x.height>=44&&x.labelFits),'Every item is readable with a 44px touch target');
  assert.ok(Math.max(...metrics.items.map(x=>x.width))-Math.min(...metrics.items.map(x=>x.width))<1,'All four tabs get equal space');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Menu must not cause horizontal scrolling');
  if(width===390)await page.screenshot({path:`verification/screenshots/chart-fix-mobile-menu-${theme}-${width}.png`});
  for(const [label,path] of [['Portfolio','/portfolio'],['Monitor','/alerts'],['Trading Lab','/trading-lab'],['Research','/analyze']]){
   await nav.getByRole('link',{name:label,exact:true}).click();await page.waitForURL('**'+path);
   assert.equal(await nav.locator('[aria-current="page"]').innerText(),label);
   reports.push({theme,width,path});
  }
  await page.getByRole('button',{name:'Account menu',exact:true}).click();
  const menu=page.locator('#account-menu');await menu.waitFor();
  const menuMetrics=await menu.evaluate(el=>{const r=el.getBoundingClientRect();return{left:r.left,right:r.right,blur:getComputedStyle(el).backdropFilter,heights:[...el.querySelectorAll('a,button')].map(a=>a.getBoundingClientRect().height)};});
  assert.ok(menuMetrics.left>=0&&menuMetrics.right<=width,'Account popover fits narrow phones');
  assert.ok(menuMetrics.blur.includes('blur')&&menuMetrics.heights.every(height=>height>=44));
  if(width===390)await page.screenshot({path:`verification/screenshots/chart-fix-account-menu-${theme}-${width}.png`});
  await page.keyboard.press('Escape');assert.equal(await page.locator('#account-menu').count(),0);
  network.push({theme,width,metrics,menuMetrics});
  await browser.close();
 }
 fs.writeFileSync('verification/mobile-menu-browser-report.json',JSON.stringify({scope:'Chromium mobile emulation at 320, 390 and 430 CSS px in light and dark mode. Native iOS Safari and nonzero hardware safe-area insets still require device verification.',reports,measurements:network,errors},null,2)+'\n');
 assert.equal(errors.length,0);console.log(JSON.stringify({navigationTransitions:reports.length,menuConfigurations:network.length,runtimeErrors:errors.length}));
})().catch(error=>{console.error(error);process.exit(1);});
