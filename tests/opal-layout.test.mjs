import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import postcss from 'postcss';
const read = p => fs.readFileSync(p, 'utf8');
const declarations = (path, selector) => {
  const values = {};
  postcss.parse(read(path)).walkRules(selector, rule => {
    if (rule.parent.type === 'root') rule.walkDecls(d => values[d.prop] = d.value);
  });
  return values;
};
test('paired overview panels occupy the same grid row; consensus sits below them', () => {
  const file = 'components/ResearchOverview.module.css';
  assert.equal(declarations(file,'.caseWorkspace')['align-items'], 'stretch');
  assert.equal(declarations(file,'.brief').display, 'grid');
  assert.equal(declarations(file,'.brief > section').margin, '0');
  assert.equal(declarations(file,'.caseWorkspace > .pillars').display, 'contents');
  for (const selector of ['.caseWorkspace > .brief','.caseWorkspace > .pillars > section']) {
    assert.equal(declarations(file,selector)['grid-row'], '1');
  }
  assert.equal(declarations(file,'.caseWorkspace .consensusDetails')['grid-column'], '2');
  assert.match(read(file), /@media \(max-width: 1100px\)[\s\S]*grid-row: auto/);
});
test('primary chrome hover has its own theme-aware iris tint', () => {
  assert.match(read('app/core/tokens.css'), /--interaction-hover: color-mix\(in srgb, var\(--blue\) 11%, var\(--card\)\)/);
  for (const file of ['WorkspaceShell','ResearchNavigation']) assert.match(read(`components/${file}.module.css`), /:hover\s*\{[^}]*background: var\(--interaction-hover\)/);
});
test('dominant brand surfaces no longer restore the rejected lime and forest palette', () => {
  for (const file of ['app/core/tokens.css','app/appearance.css','components/PublicLanding.module.css','components/PaceInstrument.module.css']) {
    assert.doesNotMatch(read(file), /#(?:d6f35a|284c3e|f1f3ee|1b2922)\b/i, file);
    assert.doesNotThrow(() => postcss.parse(read(file)));
  }
});
