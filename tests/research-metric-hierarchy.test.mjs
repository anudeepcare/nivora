import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
test('shared company and technical metrics have neutral surfaces and restrained readable values',()=>{
 const company=fs.readFileSync('components/CompanyMetrics.module.css','utf8');
 assert.doesNotMatch(company,/linear-gradient/);assert.match(company,/font-weight: 500/);assert.match(company,/font-size: 13px/);assert.match(company,/metric-tone-caution/);
 const tech=fs.readFileSync('components/ResearchMetrics.module.css','utf8');
 assert.match(tech,/font-weight: 500/);assert.doesNotMatch(tech.slice(tech.indexOf('.panel :global(.financial-detail-groups) > section'),tech.indexOf('.ratioTrack')),/linear-gradient/);
 const panels=fs.readFileSync('components/SentiSensePanels.module.css','utf8');assert.doesNotMatch(panels,/font-size: 10px/);
});
test('remaining active Research tool selectors share nested controls without changing lazy mounting or keyboard tabs',()=>{
 for(const n of ['AdvancedResearch','TargetsEstimates']){const s=fs.readFileSync(`components/${n}.tsx`,'utf8');assert.match(s,/data-nested-navigation/);assert.match(s,/data-nav-icon=\{label\}/);}
 const target=fs.readFileSync('components/TargetsEstimates.tsx','utf8');assert.match(target,/aria-selected=/);assert.match(target,/event.key === "ArrowRight"/);
 assert.match(fs.readFileSync('components/AdvancedResearch.tsx','utf8'),/visited.includes/);
 assert.match(fs.readFileSync('app/core/nested-navigation.css','utf8'),/aria-selected="true"/);
});
