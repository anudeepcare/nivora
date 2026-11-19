import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import postcss from 'postcss';
const source=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const declarations=(css,selector)=>{let out={};postcss.parse(css).walkRules(rule=>{if(rule.selector===selector)rule.walkDecls(d=>out[d.prop]=d.value);});return out;};
test('research owns one inner pane while footer and evidence retain natural height',()=>{
 const shell=source('components/WorkspaceShell.module.css');
 const root=declarations(shell,'.shell[data-page="research"]');
 assert.equal(root.position,'relative');assert.notEqual(root.overflow,'hidden');
 const main=declarations(shell,'.shell[data-page="research"] .content');
 assert.equal(main.overflow,'auto');assert.equal(main['min-height'],'0');assert.equal(main.display,'block');
 const footer=declarations(shell,'.shell[data-page="research"] .content > :global(.product-footer)');
 assert.equal(footer.position,'static');
 const cockpit=source('components/ReferenceCockpit.module.css');
 assert.equal(declarations(cockpit,'.root').height,'auto');
 assert.doesNotMatch(cockpit,/overflow:\s*hidden/);
 assert.match(source('components/Shell.tsx'),/data-workspace-scroll=/);
 assert.match(source('components/Research.tsx'),/content\.scrollTo/);
});
test('public reference composition overrides legacy split hero and green accents',()=>{
 const css=source('components/PublicLanding.module.css');
 const hero=declarations(css,'.page.page.page .hero');
 assert.equal(hero.display,'block');
 assert.equal(declarations(css,'.page.page')['--landing-accent'],'#5367f2');
 assert.match(css,/\.referenceBrief > footer/);
 assert.match(css,/grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
});
