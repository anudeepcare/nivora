import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import postcss from 'postcss';
function decl(file,selector){const result={};postcss.parse(readFileSync(`components/${file}`,'utf8')).walkRules(r=>{if(r.selector===selector && r.parent.type==='root')r.walkDecls(d=>result[d.prop]=d.value)});return result}
test('decision keeps an opaque navy gradient and legible selected context independent of theme',()=>{
 assert.equal(decl('ResearchOverview.module.css','.paceColumn').background,'linear-gradient(145deg, #182a49, #101b30 70%)');
 assert.equal(decl('ResearchOverview.module.css','.paceColumn').color,'#f8fafc');
 const active=decl('ResearchOverview.module.css','.context button[aria-pressed="true"]');
 assert.equal(active.background,'#edf3ff');assert.equal(active.color,'#142746');
 assert.equal(decl('PaceInstrument.module.css','.title h2').color,'#fff');
});
test('Pace retains five distinct depth swatches and dialogs keep independent theme colors',()=>{
 const css=readFileSync('components/PaceInstrument.module.css','utf8');
 for(const color of ['#e8eef6','#d3e6f8','#a9cee9','#579de0','#2260b6'])assert.ok(css.includes(color));
 assert.match(css,/box-shadow: inset 0 0 0 1px #c8f43d/);
 assert.doesNotMatch(css,/--ink:|--card:/);
 assert.equal(decl('PaceInstrument.module.css','.stageDialog').background,'var(--card)');
 assert.equal(decl('PaceInstrument.module.css','.stageDialog').color,'var(--ink)');
});
