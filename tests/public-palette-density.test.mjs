import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css = readFileSync('components/PublicLanding.module.css', 'utf8');
test('closing conversion uses the shared neutral surface, not an isolated green gradient',()=>{
 const closing=css.slice(css.indexOf('.page.page.page .closing {'),css.indexOf('.page.page.page .closing h2'));
 assert.match(closing,/background: var\(--card\)/);
 assert.match(closing,/border: 1px solid var\(--line\)/);
 assert.doesNotMatch(closing,/linear-gradient|#c8e975|#438f86/);
});
test('question icons share the reference accent and adaptive surface',()=>{
 const icon=css.slice(css.indexOf('.workflowRows article > span svg {'),css.indexOf('.workflow {',css.indexOf('.workflowRows article > span svg {')));
 assert.match(icon,/color: var\(--landing-accent\)/);
 assert.match(icon,/background: var\(--surface\)/);
 assert.doesNotMatch(icon,/#648842|#d6f35a/);
});
test('question titles and descriptions have content-sized gaps and matching muted copy',()=>{
 assert.match(css,/\.page\.page\.page \.workflowRows h3\s*\{\s*min-height: 0;\s*margin: 0 0 10px;/);
 assert.match(css,/\.page\.page\.page \.workflowRows article > div\s*\{\s*flex: 0 1 auto;\s*gap: 0;/);
 assert.match(css,/\.page\.page\.page \.workflowRows article > span\s*\{\s*flex-direction: row;/);
 assert.match(css,/\.page\.page\.page \.workflowRows article:last-child p\s*\{\s*color: var\(--muted\)/);
});
