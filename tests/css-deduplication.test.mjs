import test from 'node:test';
import assert from 'node:assert/strict';
import postcss from 'postcss';
import {deduplicateRules} from '../scripts/lib/css-deduplicate.mjs';
const clean=css=>{const root=postcss.parse(css);deduplicateRules(root);return root.toString()};
test('removes only earlier identical rules and keeps the final cascade order',()=>{
 assert.equal(clean('.a{color:red}.b{color:blue}.a{color:red}'),'.b{color:blue}.a{color:red}');
 assert.equal(clean('.a{color:red}.a{color:blue}'),'.a{color:red}.a{color:blue}');
});
test('does not cross media conditions, layers, anonymous scopes or keyframes',()=>{
 const css='@layer x{.a{color:red}}@layer y{.a{color:red}}@media(min-width:1px){.a{color:red}}@media(min-width:2px){.a{color:red}}@layer{.a{color:red}}@layer{.a{color:red}}@keyframes a{0%{opacity:0}100%{opacity:0}}';assert.equal(clean(css),css);
});
test('preserves fallback declaration order and importance',()=>{
 const css='.a{display:block;display:grid}.a{display:grid;display:block}.a{color:red!important}.a{color:red}';assert.equal(clean(css),css);
});
