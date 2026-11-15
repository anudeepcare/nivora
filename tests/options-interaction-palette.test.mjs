import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import postcss from 'postcss';
test('options interactions use sapphire, not positive-signal green',()=>{
 for(const file of ['OptionsDesk','OptionsExpiryComparison','ExposureBoard']) {
 const css=postcss.parse(fs.readFileSync(`components/${file}.module.css`,'utf8'));
 css.walkRules(rule=>{ if(/aria-pressed|focus-visible|orientation/.test(rule.selector)) assert.doesNotMatch(rule.toString(),/var\(--green\)/,rule.selector); });
 }
});
