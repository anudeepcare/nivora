import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import postcss from 'postcss';
const read=p=>fs.readFileSync(p,'utf8');
test('compact header search rule never constrains a search form',()=>{
 const css=postcss.parse(read('app/signal-system.css'));
 css.walkRules(rule=>{if(rule.nodes.some(d=>d.prop==='max-width'&&d.value==='42px')) assert.ok(!rule.selector.includes('.search-box')||rule.selector.includes('button.search-box'));});
});
test('mobile holdings and search own their width and visibility',()=>{
 const css=read('components/PortfolioWorkspace.module.css');
 assert.match(css,/td\s*\{[^}]*display:\s*block/);
 assert.match(css,/min-width:\s*0/);
 assert.match(read('components/Search.module.css'),/max-width:\s*none/);
});
test('Discover remains in account tools rather than the primary navigation',()=>{
 const shell=read('components/Shell.tsx');
 assert.ok(shell.includes('label: "Discover"'));
 assert.doesNotMatch(shell,/<Link href=\{`\$\{prefix\}\/discover`\}/);
});
