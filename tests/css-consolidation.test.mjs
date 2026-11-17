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
test('reference token delta preserves every other foundation declaration and font registration order', async () => {
  const before = await expanded('docs/archive/styles/foundation.before.css');
  // This reviewed fixture lists exact intentional changes, not an ignored class
  // of properties. Any unlisted change or unexpected old value still fails.
  const changes=JSON.parse(fs.readFileSync('tests/fixtures/reference-token-delta.json','utf8'));
  assert.ok(changes.length > 30);
  for(const change of changes){
    const matches=[];
    before.walkDecls(change.property,d=>{
      const context=d.parent.parent;
      const rightContext=change.media ? context.type==='atrule' && context.name==='media' && context.params===change.media : context.type==='root';
      if(d.parent.selector===change.selector && rightContext)matches.push(d);
    });
    assert.equal(matches.length,1,`Exact token scope: ${change.selector} ${change.property}`);
    assert.equal(matches[0].value,change.from);
    matches[0].value=change.to;
  }
  const root=before.nodes.find(n=>n.type==='rule'&&n.selector===':root');
  root.nodes.find(n=>n.prop==='--app-gutter').cloneAfter({prop:'--font-mono',value:'"DM Mono", "SFMono-Regular", Consolas, monospace'});
  const registrations=[['DM Mono',400,'dm-mono-400'],['DM Mono',500,'dm-mono-500'],... [400,500,600,700,800].map(weight=>['Manrope',weight,`manrope-${weight}`])];
  const fontSource=registrations.map(([family,weight,file])=>`@font-face { font-family: "${family}"; font-style: normal; font-weight: ${weight}; font-display: swap; src: url("/fonts/${file}.ttf") format("truetype"); }`).join('\n');
  const fontRules=postcss.parse(await prettier.format(fontSource,{parser:'css'}));
  before.prepend(fontRules.nodes);
  assert.deepEqual(semantic(await expanded('app/core/foundation.css')),semantic(before));
  for(const [, , file] of registrations){
    const bytes=fs.readFileSync(`public/fonts/${file}.ttf`);
    assert.equal(bytes.subarray(0,4).toString('hex'),'00010000',`${file} is a valid local TrueType font`);
    assert.ok(bytes.length > 10000);
  }
  const foundation = postcss.parse(fs.readFileSync('app/core/foundation.css', 'utf8'));
  assert.equal(foundation.nodes[0].name, 'import');
  assert.equal(foundation.nodes[0].params, '"./tokens.css"');
});
