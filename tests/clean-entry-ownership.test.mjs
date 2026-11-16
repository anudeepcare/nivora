import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import postcss from 'postcss';
const read=p=>fs.readFileSync(p,'utf8');
test('public, auth and shell own their presentation without integrated or legacy imports',()=>{
 for(const name of ['PublicLanding','Session','Shell','PasswordRecovery','LaunchScreen']){
  const source=read(`components/${name}.tsx`);
  assert.doesNotMatch(source,/import .*IntegratedExperience|legacy-panels\.css|appearance\.css/);
 }
});
test('entry styles have one declaration owner per selector per responsive context and no important overrides',()=>{
 for(const name of ['PublicLanding','Session','WorkspaceShell','Search','LaunchScreen']){
  const source=read(`components/${name}.module.css`), rules=new Set();
  assert.doesNotMatch(source,/!important|@import/);
  postcss.parse(source).walkRules(rule=>{
   const context=rule.parent.type==='atrule'?`${rule.parent.name} ${rule.parent.params}`:'';
   for(const selector of rule.selectors){const key=context+'|'+selector;assert.ok(selector.trim());assert.ok(!rules.has(key),`${name}: duplicate ${key}`);rules.add(key);}
  });
 }
});
test('shell owns tool dialog, mobile safe area and route feedback without generic styling',()=>{
 const css=read('components/WorkspaceShell.module.css');
 for(const term of ['.toolsDialog','.searchDialog','.dock','.routePending','env(safe-area-inset-bottom)',':global(.dialog-tools)',':global(.account-menu-footer)'])assert.ok(css.includes(term));
});
test('auth owns all missing first-visit primitives and fixed input targets',()=>{
 const css=read('components/Session.module.css');
 for(const term of ['.mp-brand','.mp-form-message.error','.mp-password-field','.mp-form-submit','.mp-auth-disclaimer','min-height: 48px','font-size: 16px'])assert.ok(css.includes(term));
});
