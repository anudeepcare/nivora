import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const home=readFileSync('components/HomeWorkspace.tsx','utf8');
test('Today leads with actual portfolio and followed price graphs before editorial priorities',()=>{
 assert.ok(home.indexOf('<PortfolioDay')<home.indexOf('<HomeMarketCards'));
 assert.ok(home.indexOf('<HomeMarketCards')<home.indexOf('<TodaySequence'));
 assert.equal((home.match(/<Coverage state=/g)||[]).length,1);
 assert.ok(home.indexOf('<Coverage')<home.indexOf('<HomeMarketCards'));
});
test('loaded breadth and rotation metrics open by default without removing collapse controls',()=>{
 assert.match(home,/\[radarOpen, setRadarOpen\] = useState\(true\)/);
 assert.match(home,/onToggle=\{\(event\) => setRadarOpen\(event.currentTarget.open\)\}/);
 assert.match(home,/<OpportunityMap/); assert.match(home,/<MarketRadar/);
});
test('public Product navigation targets the actual connected tour, without repeating the same three questions',()=>{
 const source=readFileSync('components/PublicLanding.tsx','utf8');
 assert.equal((source.match(/id="how-it-works"/g)||[]).length,1);
 assert.match(source,/className=\{landing.referenceStory\}\s+id="how-it-works"/);
 assert.doesNotMatch(source,/ap-workflow-heading|Three questions before every contribution/);
 for(const section of ['ReferenceProductTour','pace-public','use-cases','id="pricing"']) assert.ok(source.includes(section));
});
test('exposure highlights the existing actual portfolio weight, never a synthetic score',()=>{
 const source=readFileSync('components/TodaySequence.tsx','utf8');
 assert.match(source,/className=\{styles.exposureMetric\}[\s\S]*?concentration.weight.toFixed\(1\)/);
 assert.match(source,/Of the priced portfolio/);
});
