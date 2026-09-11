import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=(p)=>fs.readFileSync(p,'utf8');
const search=read('components/SearchBox.tsx');
const moduleCss=read('components/SearchBox.module.css');
const product=read('app/auryn-product.css');
const profile=read('app/profile/page.tsx');
const provider=read('components/ThemeProvider.tsx');
const layout=read('app/layout.tsx');
const themes=read('app/auryn-themes.css');

test('autocomplete results are navigation links, never buttons',()=>{
  assert.match(search,/import Link from "next\/link"/);
  assert.match(search,/<Link className=\{styles\.resultRow\}/);
  assert.doesNotMatch(search,/<button className=\{styles\.resultRow\}/);
});

test('global search rules target only the analyze form action button',()=>{
  assert.doesNotMatch(product,/\.aurynSearch button\{/);
  assert.doesNotMatch(product,/\.aurynSearch\.large button\{/);
  assert.match(product,/\.aurynSearch form>button\{/);
  assert.match(product,/\.aurynSearch\.large form>button\{/);
});

test('isolated result row cannot collapse to analyze button width',()=>{
  assert.match(moduleCss,/\.resultRow\{[^}]*width:100%!important/s);
  assert.match(moduleCss,/\.resultRow\{[^}]*text-decoration:none/s);
  assert.match(moduleCss,/\.resultRow\{[^}]*grid-template-columns:minmax\(0,1fr\) auto/s);
});

test('appearance studio offers live preview and useful preferences',()=>{
  assert.match(profile,/Appearance Studio/);
  assert.match(profile,/aurynAppearancePreview/);
  assert.match(profile,/Motion/);
  assert.match(profile,/Reduced/);
  assert.match(profile,/Standard motion/);
  assert.match(profile,/Number format/);
  assert.match(profile,/Density/);
});

test('motion preference persists and restores before paint',()=>{
  assert.match(provider,/MOTIONS/);
  assert.match(provider,/auryn-motion/);
  assert.match(provider,/dataset\.motion/);
  assert.match(layout,/auryn-motion/);
  assert.match(layout,/dataset\.motion/);
});

test('appearance studio theme names remain simple',()=>{
  for(const name of ['Classic','Noir','Sapphire','Racing Green','Bordeaux','Arctic','Bronze']) assert.match(profile,new RegExp(`name:"${name}"`));
  for(const phrase of ['Midnight Sapphire','British Racing Green','Noir Champagne','Porcelain Bronze']) assert.doesNotMatch(profile,new RegExp(phrase));
});

test('theme surface contract covers common evidence and thesis cards',()=>{
  for(const selector of ['.v936Metric','.v936ScenarioCard','.v936ExplainCard','.v940PulseGroup','.v34IndicatorGrid','.aurynCapitalQueueRow','.profileCard']) assert.match(themes,new RegExp(selector.replace('.','\\.')));
  assert.match(themes,/\[data-motion="reduced"\]/);
});
