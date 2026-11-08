import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';
import prettier from 'prettier';

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
test('consolidated compatibility preserves every ordered rule and declaration', async () => {
  const before = await expanded('docs/archive/styles/app/core/compatibility.css');
  const after = await expanded('app/core/compatibility.css');
  // Consent is now owned by its scoped component; the obsolete global rules
  // were deliberately removed in the preceding theme cleanup.
  before.walkRules(rule => {
    if (/^\.(analytics-consent|consent-actions)(?:[ .:]|$)/.test(rule.selector)) rule.remove();
  });
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
test('token extraction preserves the complete foundation cascade and font registration order', async () => {
  assert.deepEqual(
    semantic(await expanded('app/core/foundation.css')),
    semantic(await expanded('docs/archive/styles/foundation.before.css')),
  );
  const foundation = postcss.parse(fs.readFileSync('app/core/foundation.css', 'utf8'));
  assert.equal(foundation.nodes[0].name, 'import');
  assert.equal(foundation.nodes[0].params, '"./tokens.css"');
});
