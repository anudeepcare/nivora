const {chromium}=await import(process.env.AURYN_PLAYWRIGHT_PATH || 'playwright');
import fs from 'node:fs/promises';
const browser=await chromium.launch({executablePath:process.env.AURYN_CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage','--no-proxy-server']});
const report=[];await fs.mkdir('/tmp/auryn-canvas',{recursive:true});
try{for(const width of [1440,390])for(const theme of ['light','dark'])for(const route of ['/preview/overview','/preview/watchlist','/preview/portfolio','/preview/research/MSFT','/preview/research/MSFT?tab=Valuation','/preview/research/MSFT?tab=Financials','/preview/research/MSFT?tab=Technicals','/preview/research/MSFT?tab=Analysts','/preview/research/MSFT?tab=News','/preview/research/MSFT?tab=Options']){
 const page=await browser.newPage({viewport:{width,height:1000}});const errors=[];page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(theme=>{localStorage.setItem('auryn-product-theme',theme);if(document.documentElement)document.documentElement.dataset.theme=theme;},theme);
 const response=await page.goto('http://127.0.0.1:3010'+route,{timeout:120000,waitUntil:'domcontentloaded'});
 await page.waitForLoadState('networkidle',{timeout:60000});await page.locator('main h1').first().waitFor({timeout:120000});
 await page.locator('[aria-busy="true"]').first().waitFor({state:'hidden',timeout:60000}).catch(()=>{});
 await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;},theme);
 await page.evaluate(()=>document.fonts.ready);
 if(route.includes('/research/')&&!route.includes('?')){await page.locator('.plot-section canvas').first().waitFor({state:'visible',timeout:60000});await page.getByRole('button',{name:'Explore P3: Gradual'}).waitFor({timeout:60000});}
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 const result=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,heading:document.querySelector('main h1')?.textContent,tab:document.querySelector('[data-research-section]')?.getAttribute('data-research-section'),text:document.querySelector('main')?.innerText.slice(0,180)}));
 const name=route.replace('/preview/','').replaceAll('/','-').replace('?tab=','-');
 await page.screenshot({path:`/tmp/auryn-canvas/${name}-${width}-${theme}.png`,fullPage:true,caret:'initial'});
 if(response.status()!==200||result.overflow||errors.length)throw Error(JSON.stringify({route,width,theme,status:response.status(),...result,errors}));report.push({route,width,theme,status:response.status(),...result,errors});console.log(JSON.stringify(report.at(-1)));await page.close();
}}finally{await browser.close();await fs.mkdir('verification/cohesive-workspace-20261108',{recursive:true});await fs.writeFile('verification/cohesive-workspace-20261108/routes.json',JSON.stringify(report,null,2));}
