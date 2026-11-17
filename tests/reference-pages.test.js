import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { referencePage } from '../src/public/reference-pages.js';

test('each published-reference primary page has an honest standalone body', () => {
  const expectations = {
    today: 'Three things matter today.',
    research: 'Research a company.',
    discover: 'Find a reason to look closer.',
    compare: 'Three companies. One next dollar.',
    watchlist: 'Your companies, ranked by what changed.',
  };
  for (const [id, heading] of Object.entries(expectations)) {
    const html = referencePage(id);
    assert.match(html, new RegExp(heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(html, /PROVIDER-GATED|OFFLINE REFERENCE FIXTURE/);
    assert.doesNotMatch(html, /\bLIVE\b|DATA COMPLETE/);
  }
  assert.equal(referencePage('portfolio'), null);
});

test('research empty state inventories all published-reference evidence tabs', () => {
  const html = referencePage('research');
  for (const tab of ['Atlas','Scenarios','Technicals','Ownership','Events','Indicators','Pace','Options']) {
    assert.match(html, new RegExp(`>${tab}<`));
  }
});
test('top-level pages preserve observed decision grids and controls',()=>{const expected={today:['CONTRIBUTION RANKING','MARKET SNAPSHOT','EARNINGS RADAR','IMPACT EVENTS'],discover:['QUALITY','VALUE','CHANGE','PACE','OPPORTUNITY MAP'],compare:['THREE-COMPANY MATRIX','PORTFOLIO CAPACITY','CONTRIBUTION ALLOCATION'],watchlist:['DECISION QUEUE','WHAT CHANGED','NEXT REVIEW']};for(const [page,terms] of Object.entries(expected)){const html=referencePage(page);for(const term of terms)assert.match(html,new RegExp(term));assert.doesNotMatch(html,/LIVE/)}});
test('Discover and Compare use fixed provider routes with stale-response guards',async()=>{const js=await fs.readFile(new URL('../src/public/app.js',import.meta.url),'utf8');for(const term of ['discover-form','compare-form',"'/api/search?q='","'/api/research/'","route!=='discover'||version!==requestVersion","route!=='compare'||version!==requestVersion"])assert.match(js,new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));assert.doesNotMatch(js,/provider-catalog.*compare|endpoint=.*compare/)});
test('active research restoration is symbol-bound and intelligence loads with race guards',async()=>{const js=await fs.readFile(new URL('../src/public/app.js',import.meta.url),'utf8');for(const term of ['researchState.resultSymbol===researchState.current',"version!==requestVersion||route!=='research'||researchState.current!==symbol",'researchState.isCurrentView(token)','currentModelAnalytics={...currentModelAnalytics,intelligence}'])assert.match(js,new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')))});
test('failed intelligence has an explicit guarded retry that preserves prior evidence on failure',async()=>{const js=await fs.readFile(new URL('../src/public/app.js',import.meta.url),'utf8');for(const term of ['data-retry-intelligence','Retrying verified providers','Retry failed; no prior evidence was replaced.',"version!==requestVersion||route!=='research'||researchState.current!==symbol",'researchState.isCurrentView(token)'])assert.match(js,new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')))});
test('Technicals selects calendar windows before first render and reports incomplete coverage',async()=>{const js=await fs.readFile(new URL('../src/public/app.js',import.meta.url),'utf8');assert.match(js,/selectTechnicalWindow\(analytics\.history,selectedRange\)/);assert.match(js,/validated coverage begins.*requested/)});
test('background research restoration redraws the selected view without synthetic clicks',async()=>{const js=await fs.readFile(new URL('../src/public/app.js',import.meta.url),'utf8');assert.match(js,/bindResearchCockpit\(currentModelAnalytics,selected&&selected!=='intelligence'\?selected:'atlas'\)/);assert.match(js,/bindResearchCockpit\(currentModelAnalytics,tab\)/);assert.doesNotMatch(js,/querySelector\(`\[data-reference-tab="\$\{(?:selected|tab)\}"\]`\)\?\.click\(\)/)});
test('Escape invalidates and aborts pending provider search before clearing suggestions',async()=>{const js=await fs.readFile(new URL('../src/public/app.js',import.meta.url),'utf8');const escapeBlock=js.match(/if\(event\.key==='Escape'\)\{([^}]*)\}/)?.[1]||'';assert.match(escapeBlock,/clearTimeout\(searchTimer\)/);assert.match(escapeBlock,/searchController\?\.abort\(\)/);assert.match(escapeBlock,/searchLookupVersion\+\+/)});
test('superseded search failures cannot overwrite newer canonical results',async()=>{const js=await fs.readFile(new URL('../src/public/app.js',import.meta.url),'utf8'),catchPath=js.match(/catch\(error\)\{([^}]*)Search unavailable/)?.[1]||'';assert.match(catchPath,/version===searchLookupVersion/)});
test('Technicals loads only the fixed benchmark history with research race guards',async()=>{const js=await fs.readFile(new URL('../src/public/app.js',import.meta.url),'utf8');assert.match(js,/\/api\/research\/benchmark/);assert.match(js,/benchmarkHistory/);assert.match(js,/version!==requestVersion\|\|route!=='research'\|\|researchState\.current!==symbol/);assert.doesNotMatch(js,/benchmark=.*searchParams|data-benchmark-symbol/)});
test('new symbol submission invalidates prior analytics before any provider await',async()=>{const js=await fs.readFile(new URL('../src/public/app.js',import.meta.url),'utf8');assert.match(js,/addEventListener\('submit',\(\)=>\{currentModelAnalytics=null;currentModelSymbol=null\},\{capture:true\}\)/)});
test('first intelligence failure commits retryable section states for the active tab',async()=>{const js=await fs.readFile(new URL('../src/public/app.js',import.meta.url),'utf8');for(const term of ["reason:'request-failed'","earnings:{status:'unavailable'}",'researchState.commitResult(symbol,currentModelAnalytics);draw(tab,currentModelAnalytics)'])assert.match(js,new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')))});
