import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=p=>readFileSync(new URL('../components/'+p,import.meta.url),'utf8');
test('events and indicators expose core content without workspace navigation',()=>{
 assert.ok(existsSync('components/DirectResearchLenses.tsx'));
 const s=read('DirectResearchLenses.tsx');
 assert.match(s,/<CompanyEventCalendar research=\{research\}/);
 assert.match(s,/<IndicatorOverview research=\{research\}/);
 assert.doesNotMatch(s,/ResearchWorkspace/);
 assert.match(s,/opened && children/);
 for(const name of ['CompanyUpdates','EarningsWorkspace','AdvancedResearch','SentiSensePanels'])assert.ok(s.includes('<'+name));
});
test('wall keeps reporting basis with each metric and uses one continuous grid',()=>{
 const s=read('IndicatorOverview.tsx');
 assert.match(s,/group\.label/);
 assert.match(s,/wall\.grid/);
 assert.match(read('DirectResearchLenses.module.css'),/repeat\(4, minmax\(0, 1fr\)\)/);
});
test('event stream avoids unsupported impact claims',()=>{
 const s=read('CompanyEventCalendar.tsx');
 assert.match(s,/Chronological stream/);
 assert.match(s,/Impact rankings are not supplied/);
});
