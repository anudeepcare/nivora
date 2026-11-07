const {chromium}=await import(process.env.AURYN_PLAYWRIGHT_PATH || 'playwright');
import assert from 'node:assert/strict';import fs from 'node:fs/promises';
const browser=await chromium.launch({executablePath:process.env.AURYN_CHROMIUM_PATH,args:['--no-sandbox','--disable-gpu']});const results=[];
try {for(const width of [320,390,1440])for(const route of ['/about','/track-record','/portfolio-check']){
const page=await browser.newPage({viewport:{width,height:844}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto((process.env.AURYN_BASE_URL || 'http://localhost:3040')+route);await page.getByRole('heading',{level:1}).waitFor();
await page.evaluate(()=>window.dispatchEvent(new Event('auryn:privacy')));const consent=page.getByRole('complementary',{name:'Analytics preferences'});await consent.waitFor();assert.equal(await consent.evaluate(e=>getComputedStyle(e).position),'fixed');await page.getByRole('button',{name:'Decline',exact:true}).click();
if(route==='/portfolio-check'){await page.getByRole('button',{name:'Try an example'}).click();await page.getByText('50.0%',{exact:true}).waitFor();}
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);assert.deepEqual(errors,[]);const css=await page.evaluate(()=>[...document.querySelectorAll('link[rel=stylesheet]')].map(e=>e.href));let bytes=0;for(const url of css)bytes+=(await (await page.request.get(url)).body()).length;
results.push({route,width,passed:true,cssBytes:bytes});await page.close();
}}finally{await browser.close()};await fs.writeFile('verification/performance-first/production-public-browser.json',JSON.stringify(results,null,2));console.log(results);
