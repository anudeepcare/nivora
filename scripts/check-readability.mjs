import fs from 'node:fs/promises';
const {chromium}=await import(process.env.AURYN_PLAYWRIGHT_PATH || 'playwright');
const browser=await chromium.launch({executablePath:process.env.AURYN_CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage','--no-proxy-server']});
const results=[];
try {
 for(const width of [390,768,1440]) {
  const page=await browser.newPage({viewport:{width,height:1000}});
  const go=async(path)=>{await page.goto('http://127.0.0.1:3010'+path);await page.waitForLoadState('networkidle');};
  await go('/preview/research/MSFT?tab=Financials');
  const periods=page.getByRole('group',{name:'Financial period'});
  const controls=page.locator('[aria-label="Financial period"] button');
  await controls.first().waitFor();
  const tops=await controls.evaluateAll(xs=>xs.map(x=>x.getBoundingClientRect().top));
  if(Math.max(...tops)-Math.min(...tops)>2) throw Error('Financial period controls wrap at '+width);
  for(const label of ['Annual','Quarterly','TTM']) {
   await page.getByRole('button',{name:label,exact:true}).click();
   if(await page.getByRole('button',{name:label,exact:true}).getAttribute('aria-pressed')!=='true') throw Error('period selection failed');
  }
  await go('/preview/research/MSFT?tab=Valuation');
  const input=page.getByRole('spinbutton',{name:'Desired annual price return (%)'}).first();
  await input.waitFor();
  const labels=await page.locator('label').filter({has:input}).evaluateAll(xs=>xs.map(x=>{const y=x.querySelector('span');return y?{width:y.getBoundingClientRect().width,height:y.getBoundingClientRect().height}:null}));
  if(labels.some(x=>x&&(x.width>2||x.height>2)))throw Error('Visible screen reader label at '+width);
  const horizon=page.getByRole('combobox',{name:'Horizon',exact:true}).first();
  const fits=await horizon.evaluate(el=>{const c=document.createElement('canvas').getContext('2d');c.font=getComputedStyle(el).font;return el.clientWidth>=c.measureText(el.selectedOptions[0].text).width+20;});
  if(!fits)throw Error('Selected horizon is clipped at '+width);
  await input.fill('10'); await input.dispatchEvent('change');
  await go('/preview/portfolio');
  await page.getByRole('region',{name:'Your portfolio in 30 seconds'}).waitFor().catch(async()=>{await page.locator('section[aria-label="Your portfolio in 30 seconds"]').waitFor();});
  await page.getByRole('button',{name:'Transactions',exact:true}).click();
  await page.getByRole('heading',{name:'The full picture'}).waitFor();
  await page.getByRole('button',{name:'Close portfolio analysis'}).click();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
  if(overflow) throw Error('Portfolio overflow after closing drawer');
  results.push({width,periodControlRow:true,periodSwitches:true,hiddenSentenceLabels:true,portfolioDrawer:true,overflow:false});
  await page.close();
 }
 await fs.mkdir('verification/readability-20261108',{recursive:true});
 await fs.writeFile('verification/readability-20261108/interactions.json',JSON.stringify(results,null,2)+'\n');
 console.log(JSON.stringify(results));
}finally{await browser.close();}
