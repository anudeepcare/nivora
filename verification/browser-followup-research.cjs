const {chromium}=require('playwright');
const fs=require('fs');
const fixture=JSON.parse(fs.readFileSync('verification/research-fixture.json')); 
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.AURYN_CHROMIUM_EXECUTABLE?{executablePath:process.env.AURYN_CHROMIUM_EXECUTABLE}:{}),args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer']});const context=await browser.newContext({locale:"en-US"});
 const user={id:'00000000-0000-0000-0000-000000000001',email:'visual-test@example.invalid',app_metadata:{role:'admin'},user_metadata:{full_name:'Visual Test',auryn_onboarded:true},aud:'authenticated',role:'authenticated'};
 const access=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url')+'.'+Buffer.from(JSON.stringify({sub:user.id,exp:Math.floor(Date.now()/1000)+3600,aud:'authenticated'})).toString('base64url')+'.visual';
 const session={access_token:access,refresh_token:'visual-refresh',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user};
 await context.addCookies([{name:'sb-visual-auth-token',value:'base64-'+Buffer.from(JSON.stringify(session)).toString('base64url'),domain:'127.0.0.1',path:'/'}]);
 await context.route('https://visual.supabase.co/**',async route=>{const u=new URL(route.request().url());let data=[];if(u.pathname.includes('/auth/'))data=u.pathname.endsWith('/user')?user:session;if(u.pathname.includes('profiles'))data={full_name:'Visual Test'};await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)})});
 await context.route('https://financialmodelingprep.com/**',route=>route.abort());
 await context.route('**/api/**',async route=>{const p=new URL(route.request().url()).pathname;console.log('API',p);let data={items:[]};if(p.includes('/trading-lab/status'))data={broker:{connected:false,configured:false},recentEvaluations:[],recentRuns:[],metrics:{trades:0},orders:0};if(p.includes('/calibration'))data={outcomes:{},cohorts:[],learning:{maturedOutcomes:0}};if(p.includes('/model-health'))data={proof:{grade:'UNPROVEN',exactSampleN:0}};if(p.includes('/analyze/'))data=fixture.analysis;if(p.includes('/canonical/'))data={market:fixture.market,research:{state:'READY'}};if(p.includes('/quote/'))data={...fixture.market,marketTruth:fixture.market,price:fixture.market.displayPrice};if(p.includes('/chart/'))data={candles:fixture.bars};if(p.includes('/options/'))data={enabled:false,reason:'Options data not provided by offline fixture.'};await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)})});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.log('PAGEERROR',e.message)});page.on('requestfailed',r=>console.log('FAILED',r.url(),r.failure()));const reports=[];
 for(const theme of ['light','dark'])for(const width of [390,1440]){
 await page.setViewportSize({width,height:1000});
 await page.goto('http://127.0.0.1:3101/stock/IREN',{waitUntil:'domcontentloaded',timeout:60000});
 await page.evaluate(theme=>{localStorage.setItem('auryn-theme',theme);document.documentElement.dataset.theme=theme},theme);
 await page.waitForTimeout(1500);
 for(const tab of ['Overview','Business','Earnings','Financials','Valuation','Ownership','Catalysts','Options','News','Technicals','Risk']){
 const button=page.getByRole('tab',{name:tab,exact:true});if(await button.count()===0){console.log(JSON.stringify({errors,body:await page.locator('body').innerText()}));await page.screenshot({path:'verification/screenshots/research-debug.png',fullPage:true});throw Error('Missing research tabs');}await button.click();await page.waitForTimeout(200);if(tab==='Overview'&&width===390){await page.getByLabel('Chart indicators',{exact:true}).selectOption('moving');await page.getByRole('button',{name:'Expand price chart',exact:true}).click();await page.getByRole('dialog',{name:'Expanded price chart',exact:true}).waitFor();await page.getByRole('button',{name:'Close expanded chart',exact:true}).click();await page.getByLabel('Chart indicators',{exact:true}).selectOption('none');}
 const measure=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,text:document.querySelector('[role=tabpanel]')?.textContent?.slice(0,180)}));reports.push({theme,tab,width,...measure});
 await page.evaluate(()=>{window.scrollTo({top:0,behavior:'instant'});document.activeElement?.blur()});if([390,1440].includes(width))await page.screenshot({path:`verification/screenshots/research-${theme}-${tab}-${width}.png`,fullPage:true});
 }
 }

 fs.writeFileSync('verification/followup-research-report.json',JSON.stringify({fixture:'Synthetic offline research fixture, not real investment data or live integration validation',reports,errors},null,2));console.log(JSON.stringify({screens:reports.length,overflow:reports.filter(x=>x.scroll>x.width+2),errors},null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
