import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (name) => readFileSync(new URL(`../components/${name}`, import.meta.url), 'utf8');
test('support filters share a single responsive toolbar', () => {
 const source = read('SupportInbox.tsx');
 const form = source.slice(source.indexOf('<form'), source.indexOf('</form>'));
 assert.match(form, /Filter support requests/);
 assert.match(read('SupportInbox.module.css'), /\.search > label,\s*\.search > button\s*\{\s*margin-top: 0;/);
});
test('observation fields use a scoped responsive grid with full-width notes and consent', () => {
 assert.match(read('OwnerValidation.tsx'), /className=\{s\.form\}/);
 assert.match(read('OwnerValidation.tsx'), /className=\{s\.consent\}/);
 const css = read('OwnerValidation.module.css');
 assert.match(css, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
 assert.match(css, /@media \(max-width: 640px\)/);
});
test('handbook short instructions keep compact spacing', () => {
 assert.match(read('OwnerHandbook.module.css'), /\.intro li\s*\{\s*margin: 0;\s*padding: 3px 0;/);
});
