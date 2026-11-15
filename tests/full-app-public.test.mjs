import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import postcss from 'postcss';
const read = file => fs.readFileSync(`components/${file}`, 'utf8');
function styles(file, selector, width = 320) {
  const found = {};
  postcss.parse(read(file)).walkRules(rule => {
    if (!rule.selectors.includes(selector)) return;
    for (let p = rule.parent; p; p = p.parent) {
      if (p.type !== 'atrule' || p.name !== 'media') continue;
      const max = p.params.match(/max-width:\s*(\d+)px/), min = p.params.match(/min-width:\s*(\d+)px/);
      if ((max && width > +max[1]) || (min && width < +min[1])) return;
    }
    rule.walkDecls(d => found[d.prop] = d.value);
  });
  return found;
}
test('help search announces result count and offers a clear action without trimming document text', () => {
  const source = read('LegalDocument.tsx');
  assert.match(source, /query\.trim\(\)/);
  assert.match(source, /role="status"[\s\S]*sections.length/);
  assert.match(source, /onClick=\{\(\) => setQuery\(""\)\}[\s\S]*Clear search/);
  assert.match(source, /<p>\{s.text\}<\/p>/);
});
test('public concentration labels wrap without displacing their meters', () => {
  const row = styles('PublicFrame.module.css', '.weights li');
  const label = styles('PublicFrame.module.css', '.weights li strong');
  assert.match(row['grid-template-columns'], /minmax\(0, 1fr\)/);
  assert.equal(label['overflow-wrap'], 'anywhere');
});
test('narrow phone plan features remain one readable column', () => {
  assert.equal(styles('Plans.module.css', '.page .cards ul')['grid-template-columns'], 'minmax(0, 1fr)');
});
test('legal navigation and privacy controls provide 44px targets', () => {
  const file = 'LegalDocument.module.css';
  for (const width of [320, 768, 1280]) {
    assert.ok(parseFloat(styles(file, '.document.document.document :global(.document-layout) > nav a', width)['min-height']) >= 44);
    assert.ok(parseFloat(styles(file, '.document > footer button', width)['min-height']) >= 44);
  }
});
