import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';
import prettier from 'prettier';
import {deduplicateRules} from '../scripts/lib/css-deduplicate.mjs';

// Compare the complete ordered AST, including duplicate declarations, importance,
// media conditions and layer boundaries. Formatting and source comments are inert.
async function expanded(file, stack = []) {
  file = path.resolve(file);
  assert.ok(!stack.includes(file), `Circular CSS import: ${file}`);
  const root = postcss.parse(await prettier.format(fs.readFileSync(file, 'utf8'), {parser:'css'}));
  for (const node of root.nodes.filter(n => n.type === 'atrule' && n.name === 'import')) {
    assert.equal(node.parent, root, 'Only top-level imports can be inlined');
    assert.match(node.params, /^["'][^"']+["']$/);
    const dependency = path.resolve(path.dirname(file), node.params.slice(1, -1));
    node.replaceWith((await expanded(dependency, [...stack, file])).nodes);
  }
  return root;
}
function semantic(node) {
  if (node.type === 'comment') return null;
  const value = { type: node.type };
  for (const key of ['selector', 'name', 'params', 'prop', 'value', 'important']) {
    if (node[key] !== undefined) value[key] = node[key];
  }
  if (node.nodes) value.nodes = node.nodes.map(semantic).filter(Boolean);
  return value;
}
test('consolidated compatibility preserves the ordered cascade after exact duplicate removal', async () => {
  const before = await expanded('docs/archive/styles/app/core/compatibility.css');
  const after = await expanded('app/core/compatibility.css');
  // Consent is now owned by its scoped component; the obsolete global rules
  // were deliberately removed in the preceding theme cleanup.
  before.walkRules(rule => {
    if (/^\.(analytics-consent|consent-actions)(?:[ .:]|$)/.test(rule.selector)) rule.remove();
  });
  // Company metrics are now visible by default at every viewport width.
  // Remove only the deliberately retired disclosure selectors from the archive;
  // every other historical selector and declaration remains order-equivalent.
  const retiredMetricSelectors = new Set([
    '.company-metrics .company-metrics-toggle',
    '.company-metrics:not(.company-metrics-expanded) > div:nth-child(n + 5)',
  ]);
  before.walkRules(rule => {
    if (retiredMetricSelectors.has(rule.selector)) rule.remove();
  });
  deduplicateRules(before);
  assert.deepEqual(semantic(after), semantic(before));
  let rules = 0;
  after.walkRules(() => rules++);
  assert.ok(rules > 3000, 'The comparison must cover the complete historical cascade');
  after.walkAtRules('import', () => assert.fail('Active compatibility must have no nested imports'));
  // Moving the sources one directory deeper must not change asset resolution.
  const source = fs.readFileSync('app/core/legacy-panels.css', 'utf8');
  for (const match of source.matchAll(/url\(\s*['"]?([^)'"\s]+)/g)) {
    assert.match(match[1], /^(\/|data:|https?:|#)/, `Relative asset URL: ${match[1]}`);
  }
});
test('foundation preserves geometry and font cascade while the shared palette evolves', async () => {
  const before = await expanded('docs/archive/styles/foundation.before.css');
  const after = await expanded('app/core/foundation.css');
  // The owner's new glass revision changes shared colors (including semantics),
  // surfaces and chrome, never layout, font loading or financial calculations.
  // coherent-glass tests separately verify semantic mappings and contrast.
  const neutral = new Set([
    '--bg', '--app-background', '--glass', '--ink', '--text', '--muted',
    '--chrome-surface', '--panel-shadow', '--paper', '--card', '--surface', '--surface-2',
    '--control-ink', '--control-muted', '--control-card', '--control-surface', '--control-line',
    '--line', '--border', '--positive', '--negative', '--neutral', '--warning',
    '--green', '--green-soft', '--red', '--red-soft', '--amber', '--amber-soft', '--cyan', '--cyan-soft',
    '--blue', '--blue-soft', '--accent-solid', '--business-icon', '--financial-icon', '--valuation-icon', '--ownership-icon',
    '--business-fill', '--financial-fill', '--valuation-fill', '--ownership-fill'
  ]);
  for (const root of [before, after]) {
    root.walkDecls(decl => {
      if (neutral.has(decl.prop) || decl.prop.startsWith('--workspace-')) decl.remove();
    });
    root.walkRules(rule => { if (!rule.nodes.length) rule.remove(); });
    root.walkAtRules(rule => { if (rule.nodes && !rule.nodes.length) rule.remove(); });
  }
  assert.deepEqual(semantic(after), semantic(before));
  const foundation = postcss.parse(fs.readFileSync('app/core/foundation.css', 'utf8'));
  assert.equal(foundation.nodes[0].name, 'import');
  assert.equal(foundation.nodes[0].params, '"./tokens.css"');
});
