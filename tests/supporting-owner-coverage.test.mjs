import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import postcss from 'postcss';
const read=n=>fs.readFileSync(`components/${n}`,'utf8');
function declaration(file, selector, property){let value;postcss.parse(read(file)).walkRules(r=>{if(r.selector===selector&&r.parent.type==='root')r.walkDecls(property,d=>value=d.value)});return value;}
test('active portfolio evidence renderers import and attach their layout owner',()=>{
 for(const [name,key] of [['AccountBalances','account'],['PortfolioContext','context'],['PortfolioRiskSummary','summary']]){
 const src=read(name+'.tsx');assert.match(src,/import evidence from "\.\/PortfolioEvidence.module.css"/);assert.ok(src.includes(`evidence.${key}`));
 }
 assert.equal(declaration('PortfolioEvidence.module.css','.account :global(.account-equity-breakdown)','display'),'grid');
 assert.equal(declaration('PortfolioEvidence.module.css','.account :global(.account-balance-fields)','display'),'grid');
 assert.equal(declaration('PortfolioEvidence.module.css','.context :global(.exposure-list) > div','display'),'grid');
 assert.equal(declaration('PortfolioEvidence.module.css','.context :global(.exposure-track) i','display'),'block');
});
test('Pace guidance owns stacked decision/contribution and five-stage layout',()=>{
 const src=read('PaceGuidance.tsx');assert.ok(src.includes('styles.root'));
 assert.equal(declaration('PaceGuidance.module.css','.root :global(.pace-action)','display'),'grid');
 assert.equal(declaration('PaceGuidance.module.css','.root :global(.pace-contribution-guide)','display'),'grid');
 assert.match(declaration('PaceGuidance.module.css','.root :global(.signal-pace-scale)','grid-template-columns'),/repeat\(5/);
});
test('supporting metadata cannot collapse to adjacent inline values',()=>{
 assert.equal(declaration('SupportingScreens.module.css','.discover :global(.block)','display'),'block');
 assert.equal(declaration('SettingsPage.module.css','.page :global(.account-identities)','display'),'grid');
 assert.equal(declaration('SettingsPage.module.css','.page :global(.settings-analytics-shortcut)','display'),'grid');
 assert.doesNotMatch(read('HomeWorkspace.tsx'),/className="icon-btn"/);
});
test('active Research summary exports own metric hierarchy and stacked case points',()=>{
 const src=read('ResearchOverview.tsx');assert.ok(src.includes('summaryEvidence.metrics'));assert.ok(src.includes('summaryEvidence.cases'));
 assert.equal(declaration('ResearchSummaryEvidence.module.css','.metrics :global(.metric-meter) i','display'),'block');
 assert.equal(declaration('ResearchSummaryEvidence.module.css','.cases :global(.case-points)','display'),'grid');
 assert.ok(read('ResearchEvidence.tsx').includes('<NewsCoverage'));
 assert.ok(read('NewsCoverage.tsx').includes('import s from "./NewsCoverage.module.css"'));
});
test('supporting dialogs, exposure charts and PWA updates have real scoped owners',()=>{
 for(const [name,moduleName,key] of [['Access','SupportingControls','controls.lock'],['Pwa','SupportingControls','controls.update'],['PaceHelp','SupportingControls','controls.levels'],['SectorBenchmarks','PortfolioEvidence','evidence.sectors'],['PortfolioExposure','PortfolioEvidence','evidence.exposure'],['ApprovedWorkspaceForms','PositionEditor','editor.root']]){const source=read(name+'.tsx');assert.ok(source.includes(moduleName+'.module.css'));assert.ok(source.includes(key));}
 assert.equal(declaration('PortfolioEvidence.module.css','.sectors :global(.sector-performance-axis) i','position'),'absolute');
 assert.equal(declaration('PortfolioEvidence.module.css','.exposure :global(.exposure-groups) b','display'),'block');
 assert.equal(declaration('PositionEditor.module.css','.root form','display'),'grid');
 assert.equal(declaration('SupportingControls.module.css','.update button','min-height'),'44px');
});
