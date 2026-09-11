import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const css=fs.readFileSync(new URL('../app/auryn-themes.css',import.meta.url),'utf8');
test('every evidence tab surface owns background and foreground',()=>{
 for(const cls of ['v65Evidence','v12Fund','v34InstitutionsPage','v12Technical','v26Technical','gammaPanel','v12News','v12Earnings']){
  assert.match(css,new RegExp(`aurynStockEvidenceSurface[^\\n]*${cls}`),`missing ${cls} evidence surface contract`);
 }
 assert.match(css,/\.aurynStockEvidenceSurface[^\{]*\{[^}]*background:var\(--auryn-card-bg\)!important;[^}]*color:var\(--auryn-card-ink\)!important/s);
});
test('technicals owns all three visual layers',()=>{
 assert.match(css,/\.v34TechnicalHero[^\{]*\{[^}]*background:var\(--auryn-card-bg\)!important;[^}]*color:var\(--auryn-card-ink\)!important/s);
 assert.match(css,/\.v383TechnicalStateGrid>\*[^\{]*\{[^}]*background:var\(--auryn-soft-bg\)!important/s);
 assert.match(css,/\.v34IndicatorGrid>div[^\{]*\{[^}]*background:var\(--auryn-card-bg\)!important/s);
});
test('large text is a meaningful app-wide readability mode',()=>{
 assert.match(css,/data-text-size="large"[^\{]*\{[^}]*--auryn-readable-scale:1\.18/);
 assert.match(css,/data-text-size="large"[^\n]*aurynAppMain[^\n]*p[^\{]*\{[^}]*font-size:118%!important/s);
 assert.match(css,/data-text-size="large"[^\n]*aurynAppMain[^\n]*small[^\{]*\{[^}]*font-size:118%!important/s);
});
test('dark editions use calm light reading surfaces rather than translucent gray overlays',()=>{
 for(const theme of ['noir','sapphire','racing']){
  const block=css.match(new RegExp(`\\[data-theme="${theme}"\\]\\{([^}]*)\\}`))?.[1]||'';
  assert.match(block,/--auryn-card-bg:#f/i,`${theme} card surface must be light/readable`);
  assert.match(block,/--auryn-card-ink:#(?:1|2|3)/i,`${theme} card ink must be dark`);
 }
});
