import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=(p)=>fs.readFileSync(p,'utf8');
const search=read('components/SearchBox.tsx');
const profile=read('app/profile/page.tsx');
const theme=read('app/auryn-themes.css');
const layout=read('app/layout.tsx');

test('PWA autocomplete uses isolated CSS module classes',()=>{
  assert.match(search,/import styles from "\.\/SearchBox\.module\.css"/);
  assert.match(search,/className=\{styles\.results\}/);
  assert.match(search,/className=\{styles\.resultRow\}/);
  assert.ok(fs.existsSync('components/SearchBox.module.css'));
});

test('legacy global autocomplete result selectors are removed from theme layer',()=>{
  assert.doesNotMatch(theme,/\.aurynSearchResults/);
  assert.doesNotMatch(theme,/\.aurynSearchResultText/);
  assert.doesNotMatch(theme,/\.aurynSearchOpen/);
});

test('theme selector uses simple clean names',()=>{
  for(const name of ['Classic','Noir','Sapphire','Racing Green','Bordeaux','Arctic','Bronze']) assert.match(profile,new RegExp(`name:"${name}"`));
  for(const old of ['AURYN Classic','Noir Champagne','Midnight Sapphire','British Racing Green','Bordeaux Reserve','Arctic Graphite','Porcelain Bronze']) assert.doesNotMatch(profile,new RegExp(`name:"${old}"`));
});

test('theme is restored before first paint for PWA relaunch',()=>{
  assert.match(layout,/auryn-theme/);
  assert.match(layout,/localStorage\.getItem/);
  assert.match(layout,/document\.documentElement\.dataset\.theme/);
  assert.match(layout,/suppressHydrationWarning/);
});

test('theme contract owns paired surface foreground/background tokens',()=>{
  for(const token of ['--auryn-page-bg:','--auryn-page-ink:','--auryn-card-bg:','--auryn-card-ink:','--auryn-soft-bg:','--auryn-soft-ink:','--auryn-hero-bg-a:','--auryn-hero-ink:','--auryn-chart-bg:','--auryn-chart-ink:']) assert.match(theme,new RegExp(token));
});

test('overview cards explicitly use card ink instead of inheriting page ink',()=>{
  assert.match(theme,/\.v936Metric[^{]*\{[^}]*color:var\(--auryn-card-ink\)/s);
  assert.match(theme,/\.v936ScenarioCard[^{]*\{[^}]*color:var\(--auryn-card-ink\)/s);
  assert.match(theme,/\.v936ExplainCard[^{]*\{[^}]*color:var\(--auryn-card-ink\)/s);
  assert.match(theme,/\.v940PulseGroup[^{]*\{[^}]*color:var\(--auryn-card-ink\)/s);
});

test('obsolete theme aliases are gone to prevent mixed inheritance',()=>{
  for(const x of ['obsidian','ocean','burgundy']) assert.doesNotMatch(theme,new RegExp(`data-theme="${x}"`));
});

test('all seven themes meet readable contrast on page card chrome and hero pairs',()=>{
  const ids=['classic','noir','sapphire','racing','bordeaux','arctic','porcelain'];
  const hex=(block,key)=>{const m=block.match(new RegExp(`${key}:(#[0-9a-fA-F]{6})`));assert.ok(m,`${key} missing`);return m[1]};
  const lum=(h)=>{const xs=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255).map(v=>v<=.03928?v/12.92:((v+.055)/1.055)**2.4);return .2126*xs[0]+.7152*xs[1]+.0722*xs[2]};
  const contrast=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
  for(const id of ids){
    const re=id==='classic'?/:root,\[data-theme="classic"\]\{([\s\S]*?)\n\}/:new RegExp(`\\[data-theme="${id}"\\]\\{([\\s\\S]*?)\\n\\}`);
    const m=theme.match(re);assert.ok(m,`${id} block missing`);const b=m[1];
    const pairs=[['--auryn-page-bg','--auryn-page-ink'],['--auryn-card-bg','--auryn-card-ink'],['--auryn-chrome','--auryn-chrome-ink'],['--auryn-hero-bg-a','--auryn-hero-ink']];
    for(const [bg,fg] of pairs) assert.ok(contrast(hex(b,bg),hex(b,fg))>=4.5,`${id} ${bg}/${fg} contrast`);
  }
});
