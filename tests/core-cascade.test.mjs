import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import postcss from 'postcss';
const read = file => fs.readFileSync(file,'utf8');
const parsed = file => postcss.parse(read(file));
function props(file, selector) {
 const rule = parsed(file).nodes.find(n=>n.type==='rule' && n.selectors.includes(selector));
 assert.ok(rule,`${file}: missing ${selector}`);
 return Object.fromEntries(rule.nodes.filter(n=>n.type==='decl').map(n=>[n.prop,n.value]));
}
test('canonical cascade separates tokens, low-specificity shared controls and scoped geometry',()=>{
 const layout=read('app/layout.tsx');
 const imports=[...layout.matchAll(/import "(\.\/[^" ]+\.css)"/g)].map(m=>m[1]);
 assert.deepEqual(imports,['./core/foundation.css','./core/preferences.css','./core/primitives.css']);
 assert.match(read('app/core/foundation.css'),/@import "\.\/tokens.css"/);
 for(const file of ['app/core/foundation.css','app/core/preferences.css','app/core/primitives.css']) {
  const root=parsed(file);
  root.walkDecls(d=>assert.ok(!d.important,`${file}: shared declarations must not override screen owners`));
  root.walkRules(r=>assert.doesNotMatch(r.selector,/approved-product.*(?:input|button)|\.research-detail.*\.card/));
 }
 const controls=props('app/core/primitives.css',':where(input, select, textarea)');
 assert.equal(controls['min-width'],'0');
 assert.equal(controls['max-width'],'100%');
 assert.equal(controls['font-size'],'16px');
 assert.equal(controls['min-height'],'44px');
 assert.equal(controls.color,'var(--control-ink)');
 assert.equal(controls.background,'var(--control-card)');
});
test('shared workspace dimensions are owned by the shell, independent of research tabs',()=>{
 assert.match(read('components/Shell.tsx'),/import experience from "\.\/WorkspaceShell.module.css"/);
 const workspace=props('components/WorkspaceShell.module.css','.workspace');
 assert.equal(workspace.width,'min(1440px, 100%)');
 assert.equal(workspace.margin,'auto');
 assert.equal(props('components/WorkspaceShell.module.css','.content')['min-width'],'0');
 assert.match(read('components/Shell.tsx'),/id="content" className=\{experience.content\}/);
});
