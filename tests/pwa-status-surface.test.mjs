import { readCompatCss } from './read-compat-css.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const postcss=require('postcss');
const root=new URL('../',import.meta.url);
test('installed status surface exists before account shell and cannot collapse at a zero safe-area inset',()=>{
 const layout=fs.readFileSync(new URL('app/layout.tsx',root),'utf8');
 assert.ok(layout.indexOf('className="pwa-status-surface"')>layout.indexOf('<body'));
 assert.ok(layout.indexOf('className="pwa-status-surface"')<layout.indexOf('<AppSession>'));
 const css=postcss.parse(readCompatCss('app/pwa-shell.css'));
 let rule; css.walkRules('.pwa-status-surface',n=>{ rule ??= n; });
 assert.ok(rule,'The surface must not depend on a changing route container');
 const d=Object.fromEntries(rule.nodes.filter(n=>n.type==='decl').map(n=>[n.prop,n.value]));
 assert.equal(d.position,'fixed');assert.equal(d.top,'0');assert.equal(d.width,'100%');
 assert.ok(parseFloat(d['min-height'])>10,'WebKit thinBorderWidth rejects boxes 10px high or smaller, including the previous 8px strip');
 assert.equal(d['pointer-events'],'none');assert.match(d.background,/var\(--auryn-mobile-glass, var\(--card\)\)/);
 assert.match(d['-webkit-backdrop-filter'],/blur\(22px\)/);
 assert.equal(d['background-clip'],undefined,'The status area is part of the glass surface, not an empty painted stripe');
 assert.equal(d.transform,undefined,'No transformed containing block for the fixed surface');
 assert.match(readCompatCss('app/pwa-shell.css'),/display:\s*none/,'The overlay must not paint a detached iOS strip');
});

test('current shell reserves notch space and shares browser chrome colors in both themes', () => {
 const read = name => fs.readFileSync(new URL(name,root),'utf8');
 const foundation = postcss.parse(read('app/core/tokens.css'));
 const colors=[];
 foundation.walkDecls('--chrome-surface', d=>colors.push(d.value));
 assert.deepEqual(colors,['#f7f7f5','#080d18']);
 for(const file of ['app/layout.tsx','components/Pwa.tsx','components/Session.tsx']) {
  assert.ok(read(file).includes(colors[0]),`${file} must match light header`);
  assert.ok(read(file).includes(colors[1]),`${file} must match dark header`);
  assert.doesNotMatch(read(file),/#171b24|#f2f4f7/);
 }
 assert.equal(JSON.parse(read('public/manifest.webmanifest')).theme_color,colors[1]);
 const shell=read('components/WorkspaceShell.module.css');
 assert.match(shell,/padding-top:\s*calc\(10px \+ env\(safe-area-inset-top/);
 assert.match(shell,/:global\(\.keyboard-open\) \.dock\s*\{\s*display:\s*none/);
 assert.match(shell,/padding-left:\s*max\(16px,\s*env\(safe-area-inset-left/);
 assert.match(read('app/layout.tsx'),/viewportFit: "cover"/);
});

// Evaluate relevant header declarations in source order, including shorthand resets.
test('final mobile header cascade retains safe-area reservation after reference spacing',()=>{
 const css=postcss.parse(fs.readFileSync(new URL('components/WorkspaceShell.module.css',root),'utf8'));
 let paddingTop, minimum;
 css.walkRules('.shell .header',rule=>{
  const parent=rule.parent;
  if(parent.type==='atrule' && !(parent.name==='media' && parent.params==='(max-width: 767px)')) return;
  for(const d of rule.nodes.filter(n=>n.type==='decl')){
   if(d.prop==='padding'||d.prop==='padding-block') paddingTop=d.value;
   if(d.prop==='padding-top')paddingTop=d.value;
   if(d.prop==='min-height')minimum=d.value;
  }
 });
 assert.equal(paddingTop,'calc(10px + env(safe-area-inset-top, 0px))');
 assert.equal(minimum,'calc(62px + env(safe-area-inset-top, 0px))');
 let research;
 css.walkRules('.shell[data-page="research"] .header',rule=>{
  if(rule.parent.type==='atrule'&&rule.parent.params==='(max-width: 767px)') for(const d of rule.nodes) if(d.prop==='min-height')research=d.value;
 });
 assert.equal(research,minimum);
});
