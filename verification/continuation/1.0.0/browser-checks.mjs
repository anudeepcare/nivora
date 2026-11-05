import {chromium} from '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const runtime=(await import('/tmp/auryn-browser-runtime/package/build/index.js')).default;
const browser=await chromium.launch({headless:true,executablePath:'/tmp/auryn-browser-runtime/chromium',args:runtime.args});
const page=await browser.newPage();const checks=[];const errors=[];page.on('pageerror',e=>errors.push(e.message));
const out='/workspace/scratch/d415f9dfd397/visual-1.0.0';fs.mkdirSync(out,{recursive:true});
for(const width of [1440,390]){
 await page.setViewportSize({width,height:1000});
 await page.goto('http://127.0.0.1:3100/',{waitUntil:'networkidle'});
 await page.locator('footer').last().screenshot({path:`${out}/footer-${width}.png`});
 checks.push({check:'footer no overflow',width,passed:await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)});
 await page.getByRole('button',{name:'Analytics preferences',exact:true}).click();
 checks.push({check:'footer privacy action',width,passed:await page.locator('.analytics-consent').isVisible()});
 await page.goto('http://127.0.0.1:3100/preview/research/MSFT?tab=Snapshot',{waitUntil:'networkidle'});
 checks.push({check:'removed confusing banners',width,passed:!(await page.getByText('Data coverage & definitions',{exact:true}).count())&&!(await page.getByText('Since your previous saved view',{exact:true}).count())});
 if(width===1440){
 const overview=page.locator('[class*="_overview_"]').filter({has:page.locator('[class*="_chart_"]')}).first();
 const chart=await overview.locator(':scope > [class*="_chart_"]').boundingBox();const pace=await overview.locator(':scope > section').first().boundingBox();
 checks.push({check:'chart and Pace equal height',passed:Math.abs(chart.height-pace.height)<2,chart:chart.height,pace:pace.height});
 await overview.screenshot({path:`${out}/research-grid.png`});
 const bottom=page.locator('[class*="_bottom_"]').filter({hasText:'What changes the view'}).first();
 await bottom.locator(':scope > section').first().evaluate(el=>{const stress=document.createElement('div');stress.style.height='220px';stress.textContent='Layout stress fixture: extra analyst evidence';el.prepend(stress)});
 const heights=await bottom.locator(':scope > section').evaluateAll(els=>els.map(el=>el.getBoundingClientRect().height));checks.push({check:'uneven content keeps paired cards equal',passed:Math.abs(heights[0]-heights[1])<2,heights});
 }
 const help=page.getByRole('button',{name:/^About /}).first();await help.click();checks.push({check:'metric help opens',width,passed:await page.locator('dialog[open]').count()===1});await page.keyboard.press('Escape');checks.push({check:'metric help closes',width,passed:await page.locator('dialog[open]').count()===0});
 await page.getByText('Reasons, risks & next steps',{exact:true}).click();const actions=page.locator('[class*="_evidenceActions_"]');checks.push({check:'actions separated',width,passed:await actions.locator('a').count()===1&&await actions.locator('button').count()===1});
 checks.push({check:'research no overflow',width,passed:await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)});
 await page.goto('http://127.0.0.1:3100/preview/settings',{waitUntil:'networkidle'});checks.push({check:'version 1.0.0',width,passed:await page.getByText('What’s new · 1.0.0',{exact:true}).count()===1});
}
checks.push({check:'no browser errors',passed:errors.length===0,errors});fs.writeFileSync(out+'/checks.json',JSON.stringify(checks,null,2));console.log(JSON.stringify(checks,null,2));await browser.close();if(checks.some(x=>!x.passed))process.exitCode=1;
