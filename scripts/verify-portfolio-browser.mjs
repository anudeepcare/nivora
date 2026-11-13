// Local automated regression fixture only. Never deploys, uses real accounts or calls data providers.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
const { chromium } = await import(process.env.AURYN_PLAYWRIGHT_PATH || 'playwright');
const directory = 'app/preview/portfolio-review';
const out = 'verification/portfolio-refinement-20261113';
const port = Number(process.env.AURYN_QA_PORT || 3192);
const base = `http://127.0.0.1:${port}`;
const fixture = `import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import Product from '@/components/Product';
import { allowedPreview } from '@/lib/presentation/preview';
import { demoData } from '@/tests/fixtures/demo';
export const dynamic = 'force-dynamic';
export default async function Page({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  if (process.env.NODE_ENV === 'production' || !allowedPreview((await headers()).get('host') || '', process.env.AURYN_ENABLE_PREVIEW)) notFound();
  const state = (await searchParams).state || 'complete';
  const demo = structuredClone(demoData);
  if (state !== 'missing') for (const [symbol, scale] of [['SPY', 0.8], ['QQQ', 1.4]] as const) {
    const reference = structuredClone(demo.research.MSFT);
    reference.company.symbol = symbol;
    reference.historySource = 'Synthetic automated QA fixture, not market data';
    reference.history = reference.history.map((bar, i, all) => { const close = 200 * (1 + i / all.length * 0.3 * scale + Math.sin(i * 0.13) * 0.006); return {...bar, open: close, high: close, low: close, close}; });
    demo.research[symbol] = reference;
  }
  if (state === 'partial') demo.research.AAPL.history = [];
  if (state === 'empty') demo.workspace.positions = [];
  if (state === 'short') for (const data of Object.values(demo.research)) data.history = data.history.slice(-1);
  return <><div style={{padding: '5px 12px', fontSize: 12, textAlign: 'center', background: '#233e39', color: '#fff'}}>Synthetic QA preview · not market data or investment performance</div><Product route={['portfolio']} demo={demo} /></>;
}`;
await fs.mkdir(out, {recursive: true});
try { await fs.access(directory); throw Error('QA route already exists; refusing to overwrite'); } catch(e) { if(e.code !== 'ENOENT') throw e; }
await fs.mkdir(directory, {recursive: true});
await fs.writeFile(`${directory}/page.tsx`, fixture);
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1', '--port', String(port)], {env:{...process.env, AURYN_ENABLE_PREVIEW:'true', NEXT_TELEMETRY_DISABLED:'1'}, stdio:['ignore','pipe','pipe']});
let serverLog = '';
server.stdout.on('data', b => serverLog += b);
server.stderr.on('data', b => serverLog += b);
let browser;
const report = [];
try {
  for (let i = 0; i < 120; i++) {
    try { if ((await fetch(base)).ok) break; } catch {}
    if (i === 119) throw Error('Local test server did not start');
    await new Promise(r => setTimeout(r, 500));
  }
  browser = await chromium.launch({headless:true, executablePath:process.env.AURYN_CHROMIUM_PATH || '/usr/bin/chromium', args:['--no-sandbox','--disable-dev-shm-usage']});
  for (const [width, theme, state] of [[1440,'light','complete'],[1440,'dark','complete'],[390,'light','complete'],[320,'dark','complete'],[768,'light','complete'],[1440,'light','missing'],[390,'dark','partial'],[390,'light','short'],[390,'light','empty']]) {
    const context = await browser.newContext({viewport:{width,height:width > 900 ? 1050 : 900}, deviceScaleFactor:1});
    await context.addInitScript(theme => { localStorage.setItem('auryn-product-theme', theme); localStorage.setItem('auryn-product-motion', 'reduce'); }, theme);
    await context.route('**/*', route => route.request().url().startsWith(base) ? route.continue() : route.abort());
    const page = await context.newPage();
    const errors=[];
    page.on('pageerror', e=>errors.push(e.message));
    await page.goto(`${base}/preview/portfolio-review?state=${state}`, {waitUntil:'networkidle'});
    await page.getByRole('heading',{name:'Holdings vs. the market'}).waitFor();
    const chart = page.locator('.portfolio-trend-panel');
    const range = page.locator('.portfolio-range-panel');
    await range.waitFor();
    const slider = chart.getByRole('slider');
    const before = await chart.innerText();
    if (['complete','partial','missing'].includes(state)) {
      await slider.waitFor();
      assert.equal(await slider.getAttribute('aria-valuenow'), await slider.getAttribute('aria-valuemax'));
      await slider.focus();
      await slider.press('Home');
      assert.equal(await slider.getAttribute('aria-valuenow'), '0');
      await slider.press('ArrowRight');
      assert.equal(await slider.getAttribute('aria-valuenow'), '1');
      await slider.press('End');
      await chart.getByRole('button',{name:'1M',exact:true}).click();
      const month = Number(await slider.getAttribute('aria-valuemax'));
      await chart.getByRole('button',{name:'6M',exact:true}).click();
      assert.ok(Number(await slider.getAttribute('aria-valuemax')) > month);
      await chart.getByRole('button',{name:'Value $',exact:true}).click();
      assert.match(await slider.getAttribute('aria-valuetext'), /\$/);
      await chart.getByRole('button',{name:'Compare %',exact:true}).click();
      await chart.getByRole('button',{name:'3M',exact:true}).click();
      await chart.getByRole('combobox',{name:'Market benchmark'}).selectOption('QQQ');
      await page.waitForFunction(()=>document.querySelector('.portfolio-trend-panel [data-series="market"]')?.textContent?.includes('QQQ') ?? false);
      if(state !== 'missing') assert.doesNotMatch(await chart.innerText(), /QQQ comparison is unavailable/);
      await chart.getByRole('combobox',{name:'Market benchmark'}).selectOption('SPY');
      await chart.locator('summary').click();
      assert.ok(await chart.getByRole('table').isVisible());
      await chart.locator('summary').click();
    } else {
      assert.equal(await slider.count(), 0);
      assert.match(await range.innerText(), /Bear[\s\S]*Base[\s\S]*Bull/);
    }
    if (state === 'missing') assert.match(before, /SPY comparison is unavailable/);
    if (state === 'partial') assert.match(before, /2 of 3 holdings included/);
    const layout = await page.evaluate(() => {
      const rect = selector => {const r=document.querySelector(selector).getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom};};
      return {overflow:document.documentElement.scrollWidth > innerWidth + 1, chart:rect('.portfolio-trend-panel'), sidebar:rect('.portfolio-sidebar'), range:rect('.portfolio-range-panel'), holdings:rect('.portfolio-holdings-panel')};
    });
    assert.equal(layout.overflow,false,`${width} ${theme} ${state}: horizontal overflow`);
    if(width > 900) {
      assert.ok(layout.range.width > layout.chart.width);
      assert.ok(layout.holdings.y >= layout.range.bottom - 1);
    }
    assert.deepEqual(errors,[], `${width} ${theme} ${state}: browser errors`);
    const file = `${out}/${state}-${width}-${theme}.png`;
    await page.screenshot({path:file,fullPage:true});
    report.push({width,theme,state,layout,errors,screenshot:file});
    console.log(`PASS ${width} ${theme} ${state}`);
    await context.close();
  }
  await fs.writeFile(`${out}/browser-report.json`, JSON.stringify(report,null,2));
} finally {
  await browser?.close();
  server.kill('SIGTERM');
  await fs.rm(directory,{recursive:true,force:true});
  await fs.writeFile(`${out}/browser-server.log`,serverLog);
}
