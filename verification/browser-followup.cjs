const {chromium}=require('playwright');
const fs=require('fs');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.AURYN_CHROMIUM_EXECUTABLE?{executablePath:process.env.AURYN_CHROMIUM_EXECUTABLE}:{}),args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer']});const context=await browser.newContext({locale:"en-US"});
 const user={id:'00000000-0000-0000-0000-000000000001',email:'visual-test@example.invalid',app_metadata:{role:'admin'},user_metadata:{full_name:'Visual Test',auryn_onboarded:true},aud:'authenticated',role:'authenticated'};
 const access=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url')+'.'+Buffer.from(JSON.stringify({sub:user.id,exp:Math.floor(Date.now()/1000)+3600,aud:'authenticated'})).toString('base64url')+'.visual';
 const session={access_token:access,refresh_token:'visual-refresh',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user};
 await context.addCookies([{name:'sb-visual-auth-token',value:'base64-'+Buffer.from(JSON.stringify(session)).toString('base64url'),domain:'127.0.0.1',path:'/'}]);
 const db={portfolio_positions:[],watchlists:[{id:'list-1',user_id:user.id}],watchlist_items:[],alerts:[]};const writes=[];
 await context.route('https://visual.supabase.co/**',async route=>{const req=route.request(),u=new URL(req.url()),method=req.method();let data=[];
 if(u.pathname.includes('/auth/')){if(method==='PUT'){Object.assign(user.user_metadata,req.postDataJSON()?.data||{});writes.push({table:'user',data:user.user_metadata});}data=u.pathname.endsWith('/user')?user:session;}
 else {const table=u.pathname.split('/').at(-1);if(table in db){
 if(method==='POST'){const payload=req.postDataJSON();if(table==='watchlist_items'&&!payload.watchlist_id)return route.fulfill({status:400,contentType:'application/json',body:JSON.stringify({message:'watchlist_id is required'})});const row={id:table+'-'+Date.now(),created_at:new Date().toISOString(),...payload};db[table].push(row);writes.push({table,method,payload});data=row;}
 else if(method==='PATCH'){const id=u.searchParams.get('id')?.replace('eq.','');const row=db[table].find(x=>x.id===id);if(row)Object.assign(row,req.postDataJSON());writes.push({table,method,payload:req.postDataJSON()});data=row;}
 else if(method==='DELETE'){const id=u.searchParams.get('id')?.replace('eq.','');db[table]=db[table].filter(x=>x.id!==id);writes.push({table,method});}
 else {data=db[table].filter(x=>!u.searchParams.get('symbol')||x.symbol===u.searchParams.get('symbol').replace('eq.',''));if(req.headers()['accept']?.includes('object'))data=data[0]||null;}
 }}await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)})});
 await context.route('**/api/**',async route=>{const p=new URL(route.request().url()).pathname;let data={items:[]};if(p.includes('/trading-lab/manual')&&route.request().method()==='POST'){const b=route.request().postDataJSON();data=b.preview&&!b.confirmed?{preview:{...b,notional:b.quantity*b.limitPrice,quoteAsOf:new Date().toISOString(),userId:user.id}}:{order:{status:'accepted'}};}if(p==='/api/canonical')data={items:(new URL(route.request().url()).searchParams.get('symbols')||'').split(',').map(symbol=>({security:{symbol},market:{displayPrice:symbol==='BTC/USD'?65000:25,priceState:'OFFICIAL_CLOSE',session:'CLOSED',regularCloseAsOf:'2026-10-15T20:00:00Z',sources:[{provider:'OFFLINE FIXTURE'}]},research:{state:'STALE_VERIFIED',action:'WATCH',ownerAction:'HOLD',longTermAction:'SELECTIVE',setupState:'WATCH',observedAt:'2026-09-15T20:00:00Z'}}))};if(p==='/api/portfolio/pulse')data={items:[{asOf:'2026-09-01T20:00:00Z',totalValue:20000},{asOf:'2026-09-15T20:00:00Z',totalValue:23000},{asOf:'2026-10-01T20:00:00Z',totalValue:22000},{asOf:'2026-10-15T20:00:00Z',totalValue:29000}]};if(p.includes('/trading-lab/status'))data={broker:{connected:true,configured:true,equity:100000,cash:50000,positions:2,clock:{isOpen:true}},recentEvaluations:[],recentRuns:[],metrics:{trades:0},orders:0};if(p.includes('/calibration'))data={outcomes:{},cohorts:[],learning:{maturedOutcomes:0}};if(p.includes('/model-health'))data={proof:{grade:'UNPROVEN',exactSampleN:0}};if(p.includes('/analyze/'))return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Market data unavailable in offline verification fixture'})});await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)})});


 db.watchlist_items.push({id:'w1',user_id:user.id,watchlist_id:'list-1',symbol:'AAPL'});
 db.portfolio_positions.push({id:'p1',user_id:user.id,symbol:'AAPL',shares:10,avg_cost:200,asset_type:'EQUITY',horizon:'long'});
 db.alerts.push({id:'a1',user_id:user.id,symbol:'AAPL',alert_type:'price',target_price:400,is_active:true});
 const page=await context.newPage(),reports=[],errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const width of [390,1440]){
 await page.setViewportSize({width,height:1000});
 for(const path of ['/watchlist','/portfolio','/alerts','/trading-lab','/calibration']){
 await page.goto('http://127.0.0.1:3101'+path,{waitUntil:'domcontentloaded'});
 if(['/watchlist','/portfolio','/alerts'].includes(path))await page.getByText('Research is stale — refresh analysis before using this call.',{exact:true}).waitFor({timeout:10000});
 if(path==='/trading-lab'){
  await page.getByRole('tab',{name:'Paper check',exact:true}).click();
  await page.getByText('Automatic runner health',{exact:true}).waitFor();
  for(const summary of await page.locator('summary').all())await summary.click();
 }
 if(path==='/calibration')await page.getByRole('heading',{name:'Action ladder',exact:true}).waitFor();
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth);
 if(overflow)throw Error('Overflow '+path+' '+width);
 const filename='followup-'+path.slice(1)+'-'+width+'.png';
 await page.evaluate(()=>{window.scrollTo({top:0,behavior:'instant'});document.activeElement?.blur()});await page.screenshot({path:'verification/screenshots/'+filename,fullPage:true});reports.push({path,width,overflow:false});
 }}
 fs.writeFileSync('verification/followup-browser-report.json',JSON.stringify({checks:reports,errors,fixtureOnly:true},null,2));
 if(errors.length)throw Error(errors.join('; '));
 console.log('PASS: '+reports.length+' affected page/width checks, zero runtime errors');
 await browser.close();
})().catch(e=>{console.error(e.message);process.exit(1)});
