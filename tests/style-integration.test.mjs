import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import postcss from 'postcss';
const read = file => fs.readFileSync(file,'utf8');
function rules(file) {
 const result=new Map();
 postcss.parse(read(file)).walkRules(r=>r.selectors.forEach(s=>result.set(s,r)));
 return result;
}
function declarations(rule) {return Object.fromEntries(rule.nodes.filter(n=>n.type==='decl').map(n=>[n.prop,n.value]));}
test('current React shell and home feed import their actual layout owners',()=>{
 for(const [component,alias,css,classes] of [
  ['Shell','experience','WorkspaceShell',['shell','workspace','content','nav','brand','skip','dock']],
  ['HomeWorkspace','homeStyles','HomeWorkspace',['home','greeting','quickLinks']],
 ]) {
  const source=read(`components/${component}.tsx`);
  assert.ok(source.includes(`import ${alias} from "./${css}.module.css"`));
  const selectors=rules(`components/${css}.module.css`);
  for(const name of classes){
   assert.ok(source.includes(`${alias}.${name}`),`${component} must use ${name}`);
   assert.ok([...selectors.keys()].some(selector=>selector === `.${name}` || selector.startsWith(`.${name} `)),`${css} must own ${name}`);
  }
 }
 const shell=rules('components/WorkspaceShell.module.css');
 assert.equal(declarations(shell.get('.skip:focus')).transform,'none');
 assert.ok(shell.has('.nav a[aria-current="page"]'));
 assert.ok(shell.has('.dock a'));
});
test('authentication owns readable responsive controls without a legacy ancestor stylesheet',()=>{
 const source=read('components/Session.tsx');
 assert.match(source,/import experience from "\.\/Session.module.css"/);
 assert.match(source,/experience.auth/);
 const auth=rules('components/Session.module.css');
 const inputs=declarations(auth.get('.auth .main :global(.mp-form-field input)'));
 assert.equal(inputs.width,'100%');
 assert.equal(inputs['min-width'],'0');
 assert.equal(inputs['min-height'],'48px');
 assert.equal(inputs['font-size'],'16px');
 assert.equal(inputs.color,'var(--ink)');
 assert.equal(inputs.background,'var(--card)');
 assert.ok(auth.has('.auth .main :global(.mp-social-button)'));
});
test('light and dark controls resolve to explicit readable semantic colors',()=>{
 const themes=new Map();
 postcss.parse(read('app/core/tokens.css')).nodes.filter(n=>n.type==='rule').forEach(r=>r.selectors.forEach(selector=>themes.set(selector,r)));
 for(const theme of ['light','dark']) {
  const d=declarations(themes.get(`:root[data-theme="${theme}"]`));
  for(const token of ['--control-ink','--control-card','--ink','--card']) assert.match(d[token],/^#[0-9a-f]{6}$/i);
  assert.notEqual(d['--control-ink'],d['--control-card']);
  assert.notEqual(d['--ink'],d['--card']);
  assert.equal(d['color-scheme'],theme);
 }
});
