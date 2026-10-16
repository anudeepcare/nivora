// Run against a production build with matching public Supabase origin.
// All browser service traffic is intercepted. No real order, auth or database write occurs.
const fs=require('node:fs');
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
const base=process.env.AURYN_TEST_BASE_URL||'http://127.0.0.1:3105';
const origin=process.env.E2E_SUPABASE_ORIGIN||'https://visual.supabase.co';
const out=process.env.AURYN_VERIFICATION_DIR||'verification';
const user={id:'00000000-0000-0000-0000-000000000001',email:'verification@example.invalid',app_metadata:{role:'admin'},user_metadata:{full_name:'Verification',auryn_onboarded:true},aud:'authenticated',role:'authenticated'};
const token=Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url')+'.'+Buffer.from(JSON.stringify({sub:user.id,exp:Math.floor(Date.now()/1000)+3600,aud:'authenticated'})).toString('base64url')+'.fixture';
const session={access_token:token,refresh_token:'fixture',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user};
const id='11111111-1111-4111-8111-111111111111';
const results=[],errors=[];
function assert(ok,msg){if(!ok)throw Error(msg)}
async function shot(page,name){assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Document overflow: '+name);await page.screenshot({path:out+'/screenshots/'+name+'.png',fullPage:true});}
(async()=>{
 fs.mkdirSync(out+'/screenshots',{recursive:true});
 const launchOptions={headless:true,...(process.env.AURYN_CHROMIUM_EXECUTABLE?{executablePath:process.env.AURYN_CHROMIUM_EXECUTABLE}:{}),args:JSON.parse(process.env.AURYN_CHROMIUM_ARGS||'[]')};let browser=await chromium.launch(launchOptions);
 for(const width of [390,1440]){
  for(const mode of ['email-only','enabled','unavailable']){
   const ctx=await browser.newContext({viewport:{width,height:1000}});
   await ctx.route(origin+'/**',async route=>route.fulfill({status:mode==='unavailable'?503:200,contentType:'application/json',body:JSON.stringify({external:{email:true,google:mode==='enabled',apple:mode==='enabled'}})}));
   const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/login');
   await page.getByRole('button',{name:'Sign in',exact:true}).waitFor();
   if(mode==='enabled'){await page.getByRole('button',{name:'Continue with Google'}).waitFor();assert(await page.getByRole('button',{name:'Continue with Apple'}).count()===1,'Apple enabled');}
   else if(mode==='unavailable')await page.getByRole('status').filter({hasText:'Please continue with email'}).waitFor();
   else await page.waitForFunction(()=>performance.getEntriesByType('resource').some(e=>e.name.includes('/auth/v1/settings')));
   if(mode!=='enabled')assert(await page.getByRole('button',{name:/Continue with (Google|Apple)/}).count()===0,'Unavailable provider offered');
   assert(await page.getByLabel('Email',{exact:true}).count()===1,'Email unavailable');
   await shot(page,`readiness-auth-${mode}-${width}`);results.push({flow:'auth-provider-capability',mode,width,passed:true});await browser.close();browser=await chromium.launch(launchOptions);
  }
  for(const flow of ['cancel','uncertain']){
   const ctx=await browser.newContext({viewport:{width,height:1000},locale:'en-US'});
   await ctx.addCookies([{name:'sb-'+new URL(origin).hostname.split('.')[0]+'-auth-token',value:'base64-'+Buffer.from(JSON.stringify(session)).toString('base64url'),url:base}]);
   if(flow==='uncertain')await ctx.addInitScript(({id,userId})=>localStorage.setItem('auryn-pending-paper-request:'+userId,JSON.stringify({requestId:id,userId,symbol:'AAPL',side:'BUY',quantity:10,limitPrice:25,notional:250,quoteAsOf:'2026-10-15T18:00:00Z'})),{id,userId:user.id});
   await ctx.route(origin+'/**',async route=>{const u=new URL(route.request().url());await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(u.pathname.endsWith('/user')?user:u.pathname.includes('/auth/')?session:[])});});
   let deletes=0,posts=0,targetReads=0;
   let order={id,symbol:'AAPL',side:'BUY',quantity:10,limit_price:25,status:'partially_filled',filled_quantity:4,filled_avg_price:24.9,broker_order_id:'fixture-order',broker_checked_at:'2026-10-15T18:01:00Z',created_at:'2026-10-15T18:00:00Z',canCancel:true,reconciliation:'verified',reconciliationNote:'Verified against Alpaca Paper.',detail:'Offline lifecycle fixture.'};
   await ctx.route('**/api/**',async route=>{
    const req=route.request(),u=new URL(req.url());let body={items:[]},status=200;
    if(u.pathname==='/api/trading-lab/status')body={broker:{connected:true,configured:true,equity:100000,cash:50000,clock:{isOpen:true}},recentEvaluations:[],recentRuns:[],metrics:{trades:0},orders:0};
    if(u.pathname==='/api/trading-lab/manual'){
     if(req.method()==='DELETE'){deletes++;const b=req.postDataJSON();assert(b.confirmed===true&&b.requestId===id,'Cancellation not reviewed');order={...order,status:'canceled',canCancel:false,cancel_requested_at:'2026-10-15T18:02:00Z',cancel_status:'REQUESTED'};body={order,message:'Cancellation requested. The order may still fill until Alpaca confirms it is canceled.'};status=202;}
     else if(req.method()==='POST'){posts++;body={error:'Unexpected submit in lifecycle verification'};status=500;}
     else{if(u.searchParams.has('requestId'))targetReads++;body={items:[order]};}
    }
    await route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
   });
   const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/trading-lab');await page.getByText('4 / 10 filled',{exact:true}).waitFor();
   if(flow==='cancel'){
    await page.getByRole('button',{name:'Review cancellation',exact:true}).click();await page.getByRole('heading',{name:'Cancel the remaining paper order?'}).waitFor();
    await page.getByRole('button',{name:'Keep order',exact:true}).click();assert(deletes===0,'Keep order canceled');
    await page.getByRole('button',{name:'Review cancellation',exact:true}).click();await shot(page,`readiness-paper-review-${width}`);
    await page.getByRole('button',{name:'Confirm cancellation',exact:true}).click();await page.getByText('canceled',{exact:true}).waitFor();
    assert(deletes===1&&posts===0,'Unexpected broker action count');assert(await page.getByRole('button',{name:'Review cancellation',exact:true}).count()===0,'Canceled order actionable');assert(await page.getByText('4 / 10 filled',{exact:true}).count()===1,'Cancellation reversed fills');
   }else{
    await page.getByRole('button',{name:'Reconcile order status',exact:true}).waitFor();assert(await page.getByRole('button',{name:'Confirm paper order',exact:true}).isDisabled(),'Uncertain order allowed submit');
    await page.getByRole('button',{name:'Reconcile order status',exact:true}).click();await page.getByRole('status').filter({hasText:'Verified paper status'}).waitFor();
    assert(targetReads===1&&posts===0&&deletes===0,'Reconciliation transmitted order');assert(await page.evaluate(id=>localStorage.getItem('auryn-pending-paper-request:'+id),user.id)===null,'Pending identity retained after verification');
    await shot(page,`readiness-paper-reconciled-${width}`);
   }
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Lifecycle document overflow');results.push({flow,width,deletes,posts,targetReads,passed:true});await browser.close();browser=await chromium.launch(launchOptions);
  }
 }
 await browser.close();assert(errors.length===0,errors.join('; '));fs.writeFileSync(out+'/production-followup-browser-report.json',JSON.stringify({fixtureOnly:true,checks:results,errors},null,2));console.log(`PASS ${results.length} production-followup flows; no runtime errors or document overflow.`);
})().catch(e=>{console.error(e.message);process.exit(1)});
