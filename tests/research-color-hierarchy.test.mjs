import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8');
test('observed price uses a theme-aware blue, not neutral ink or a directional verdict',()=>{
 const s=read('components/Charts.tsx');
 assert.match(s,/theme === "dark" \? "#75a7ff" : "#3268c8"/);
 assert.doesNotMatch(s,/const accent = palette.getPropertyValue\("--ink"\)/);
});
test('technical categories have distinct categorical accents and compact legible values',()=>{
 const s=read('components/ResearchMetrics.module.css').split('/* Categorical study')[1];
 for(const tone of ['blue','violet','amber','teal']) assert.ok(s.includes(`data-tone="${tone}"`));
 assert.match(s,/font-weight: 500/); assert.match(s,/minmax\(0, 1fr\)/);
 assert.match(s,/max-width: 650px/);
});
test('institutional map uses a readable responsive grid, without fabricated weighting',()=>{
 const s=read('components/ResearchVisualEvidence.module.css').split('/* Ownership reading')[1];
 assert.match(s,/repeat\(2, minmax\(0, 1fr\)\)/);
 assert.match(s,/font-size: 13px/); assert.match(s,/min-height: 44px/);
 assert.match(s,/max-width: 650px/);
 assert.match(read('components/OwnershipEvidenceMap.tsx'),/Equal links indicate reported holdings/);
});
test('radar categories match row bars and preserve missing scores',()=>{
 const s=read('components/DecisionWorkspace.tsx');
 assert.match(s,/fill=\{lensColors\[l.id\]\}/);
 assert.match(s,/background: lensColors\[l.id\]/);
 assert.match(s,/l.score != null &&/);
 assert.match(s,/l.score == null \? "Unscored"/);
});
test('primary research lenses use flat icon and text tabs with selection and keyboard focus',()=>{
 const source=read('components/Research.tsx');
 assert.match(source,/data-active-lens=/);
 assert.match(source,/ResearchTabIcon section=\{lens.sections\[0\]\}/);
 const css=read('components/ReferenceCockpit.module.css');
 assert.match(css,/font-weight: 500/);assert.match(css,/min-height: 44px/);
 assert.match(css,/button\[aria-current="page"\]::after/);assert.match(css,/outline: 2px/);
 assert.doesNotMatch(css,/--tab-accent/);
});
test('metric and event cards have no decorative colored top rails; chart legends retain their keys',()=>{
 for(const name of ['DirectResearchLenses','ExposureBoard','ResearchMetrics','WorkspacePace','AnalystTargets']) {
  const css=read(`components/${name}.module.css`);
  assert.doesNotMatch(css,/border-top: [234]px/);
  for(const match of css.matchAll(/border-top(?:-color)?: ([^;]+);/g)) assert.ok(match[1].includes('var(--line)')||match[1]==='0',`${name}: ${match[0]}`);
 }
 assert.match(read('components/DirectResearchLenses.module.css'),/stroke: var\(--metric-accent\)/);
 assert.match(read('components/AccountHistory.module.css'),/border-top: 3px solid var\(--blue\)/);
});
test('legacy card rails are neutral without changing the Pace scale or loading spinner',()=>{
 const css=read('app/core/legacy-panels.css');
 assert.doesNotMatch(css,/border-top: 3px solid/);
 assert.match(css,/\.au-dca-scale span\.active\s*\{\s*border-top-color: var\(--green\)/);
 assert.match(css,/border: 2px solid var\(--line\);\s*border-top-color: var\(--blue\)/);
});
test('reference polish uses neutral evidence surfaces and legible metadata without decorative rails',()=>{
 const metric=read('components/ResearchMetrics.module.css').split('/* Quiet reference surfaces')[1];assert.match(metric,/background: transparent/);assert.match(metric,/font-weight: 500/);
 const map=read('components/TechnicalLevelMap.module.css').split('/* Reference-aligned level')[1];assert.match(map,/border-color: var\(--blue\)/);assert.doesNotMatch(map,/var\(--green\)/);
 const events=read('components/DirectResearchLenses.module.css').split('/* Reference evidence rhythm')[1];assert.match(events,/min-height: 44px/);assert.match(events,/font-size: 12px/);assert.doesNotMatch(events,/border-top: 3px/);
});

test("research readability uses categorical icons and explicit dark-theme contrast without changing readings", () => {
  const options = readFileSync("components/OptionsPositioningOverview.tsx", "utf8");
  const styles = readFileSync("components/OptionsPositioningOverview.module.css", "utf8");
  assert.match(options, /data-family=\{family\}/);
  assert.match(options, /<Icon size=\{16\} aria-hidden="true"/);
  assert.match(options, /\{number\(value\)\}/);
  assert.match(options, /not executable prices/);
  assert.match(styles, /data-theme="dark"/);
  assert.match(styles, /font-size: 13px/);
  assert.doesNotMatch(styles, /border-top:\s*[3-9]px/);
});
