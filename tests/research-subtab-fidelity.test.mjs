import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import postcss from 'postcss';
const read = file => fs.readFileSync(`components/${file}`, 'utf8');
function declarations(file, selector) {
 const result = {};
 postcss.parse(read(file)).walkRules(rule => {
  if(rule.selector === selector && rule.parent.type === 'root') rule.walkDecls(d => result[d.prop] = d.value);
 });
 return result;
}
test('research desk rows do not stretch short evidence panels to unrelated tall siblings', () => {
 assert.equal(declarations('ResearchDeskLayout.module.css','.content.content.content')['align-items'],'start');
 assert.notEqual(declarations('ValueStudio.module.css','.root.root.root')['align-items'],'stretch');
});
test('funding measurements target the actual section children and use a compact two-column grid', () => {
 const css = read('ResearchDeskLayout.module.css');
 assert.ok(css.includes(':global(.funding-metrics > section)'));
 assert.equal(declarations('ResearchDeskLayout.module.css','.content.content.content :global(.funding-metrics)')['grid-template-columns'],'repeat(2, minmax(0, 1fr))');
});
test('quick evidence and analyst cards keep semantic color on icons instead of green panel fills', () => {
 const quick = declarations('QuickRead.module.css','.grid article');
 assert.equal(quick.background,'var(--workspace-glass, var(--card))');
 assert.equal(declarations('TargetsEstimates.module.css','.tabs button[aria-selected="true"]')['border-bottom-color'],'var(--blue)');
 assert.equal(declarations('CompanyUpdates.module.css','.next').background,'var(--workspace-glass, var(--card))');
});
test('news and valuation interaction chrome use sapphire without changing semantic case colors', () => {
 assert.equal(declarations('NewsCoverage.module.css','.heading > button').background,'var(--workspace-tile, var(--surface))');
 assert.equal(declarations('SelectedValuation.module.css','.root.root .years button[aria-pressed="true"]').color,'var(--blue)');
 assert.match(read('SelectedValuation.module.css'), /--case-color: var\(--negative\)/);
 assert.match(read('SelectedValuation.module.css'), /--case-color: var\(--positive\)/);
});
test('the news rail can suppress only the duplicate next-report line while retaining earnings results', async () => {
 const ts = await import('typescript');
 const React = await import('react');
 const jsx = await import('react/jsx-runtime');
 const {renderToStaticMarkup} = await import('react-dom/server');
 const code = ts.default.transpileModule(read('EarningsReview.tsx'), {compilerOptions:{jsx:ts.default.JsxEmit.ReactJSX,module:ts.default.ModuleKind.CommonJS}}).outputText;
 const mod={exports:{}};
 const deps={
  'react/jsx-runtime':jsx,
  '@/lib/earnings-review':{earningsReview:()=>({label:'Latest quarter',date:'2026-10-01',actual:2,estimate:1,surprise:100}),annualThesisBridge:()=>null},
  '@/lib/format':{dateLabel:x=>x,percent:x=>`${x}%`},
  '@/lib/financial-catalog':{researchPeriods:()=>[]},
  '@/lib/earnings-calendar':{earningsCalendar:()=>({next:{date:'2027-01-01'}})},
  './Ui':{Source:()=>null},
 };
 new Function('require','module','exports',code)(name=>{assert.ok(name in deps,name);return deps[name]},mod,mod.exports);
 const render=extra=>renderToStaticMarkup(React.createElement(mod.exports.default,{research:{retrievedAt:'2026-11-15'},...extra}));
 assert.match(render({}),/Next report/);
 const embedded=render({hideNextReport:true});
 assert.doesNotMatch(embedded,/Next report/);
 assert.match(embedded,/Latest quarter/);
 assert.match(embedded,/Actual/);
});
test('technical level selection is an interaction state, not a positive investment signal', () => {
 assert.equal(declarations('TechnicalLevelMap.module.css','.levels button[aria-pressed="true"]')['border-color'],'var(--blue)');
 assert.equal(declarations('TechnicalLevelMap.module.css','.detail').background,'var(--workspace-glass, var(--card))');
});
test('disclosures have a single surface, not a second outlined summary', () => {
 const css=read('ResearchDeskLayout.module.css');
 assert.match(css, /:global\(\.research-reference > summary\)[\s\S]*?border: 0;/);
});
test('technical Pace styles target rendered periods and use a compact two-part composition', () => {
 const css=read('ResearchDeskLayout.module.css');
 assert.ok(css.includes(':global(.technical-pace .pace-period)'));
 assert.equal(declarations('ResearchDeskLayout.module.css','.content.content.content :global(.technical-pace)')['grid-template-columns'],'minmax(180px, 0.7fr) minmax(0, 1.3fr)');
});
test('cash bridge has neutral owner surface without changing semantic bar colors', () => {
 assert.equal(declarations('ResearchDeskLayout.module.css','.content.content.content :global(.financial-answer)').background,'var(--workspace-glass, var(--card))');
 assert.match(read('FinancialPicture.tsx'), /data-tone=\{item.tone\}/);
});
test('price reference map uses compact unruled rows and soft channel tiles', () => {
 const row=declarations('ResearchMetrics.module.css','.retracementList > div');
 assert.equal(row['min-height'],'40px');
 assert.equal(row.border,'0');
 assert.equal(declarations('ResearchMetrics.module.css','.channelGrid > div').background,'var(--workspace-tile)');
 assert.equal(declarations('TechnicalLevelMap.module.css','.levels button')['min-height'],'44px');
});
