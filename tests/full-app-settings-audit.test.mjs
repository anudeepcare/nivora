import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import postcss from 'postcss';

const css = (file) => postcss.parse(fs.readFileSync(file, 'utf8'));
function value(file, selector, property, media = '') {
  let result;
  css(file).walkRules((rule) => {
    const compact = (text) => text.replace(/\s+/g, " ").trim();
    const actual = rule.selectors.map(compact);
    if (!selector.split(",").map(compact).every((s) => actual.includes(s))) return;
    const condition = rule.parent.type === 'atrule' ? rule.parent.params : '';
    if (condition !== media) return;
    rule.walkDecls(property, (decl) => { result = decl.value; });
  });
  return result;
}
const settings = 'components/SettingsPage.module.css';
const owner = 'components/OwnerAccess.module.css';

test('Settings reduce-motion switch keeps a 44px target around its smaller track', () => {
  assert.equal(value(settings, '.page :global(.motion-switch)', 'min-height'), '44px');
  assert.equal(value(settings, '.page :global(.motion-switch)::before', 'display'), 'block');
});
test('Settings feedback has a defined position immediately after its heading', () => {
  assert.equal(value(settings, '.page :global(.settings-feedback)', 'grid-area'), 'feedback');
  assert.match(value(settings, '.page', 'grid-template-areas'), /"heading heading" "feedback feedback"/);
});
test('Settings sections expose headings to assistive navigation', () => {
  const source = fs.readFileSync('components/SupportingViews.tsx', 'utf8').split('export function Compare')[0];
  for (const label of ['Display & reading', 'Research preferences', 'Account & security'])
    assert.match(source, new RegExp(`<h2>${label}</h2>`));
});
test('Settings phone inputs and rows protect their available width and touch area', () => {
  const media = '(max-width: 600px)';
  assert.equal(value(settings, '.page :global(.research-preferences) select,\n.page :global(.password-form) input', 'min-width'), '0');
  assert.equal(value(settings, '.page :global(.research-preferences) fieldset label', 'min-height'), '44px');
  assert.equal(value(settings, '.page :global(.workspace-setting-group)', 'padding', media), '16px 14px');
});
test('Monthly plan uses the live theme palette rather than undefined light fallbacks', () => {
  const source = fs.readFileSync('components/MonthlyPlan.module.css', 'utf8');
  assert.doesNotMatch(source, /var\(--(?:text|surface|border),/);
  assert.match(source, /color: var\(--ink\)/);
  assert.match(source, /background: var\(--card\)/);
});
test('Monthly plan uses a single main landmark supplied by the app shell', () => {
  const source = fs.readFileSync('components/MonthlyPlan.tsx', 'utf8');
  assert.doesNotMatch(source, /<main\b/);
  assert.match(source, /<section className=\{s.page\} aria-labelledby="monthly-plan-title">/);
  assert.match(source, /id="monthly-plan-title"/);
});
test('Admin narrow-screen controls are readable without input zoom and small targets', () => {
  assert.equal(value(owner, '.root input:not([type="checkbox"]),\n  .root select,\n  .root textarea', 'font-size', '(max-width: 700px)'), '16px');
  assert.equal(value(owner, '.members :global(.button)', 'min-height', '(max-width: 700px)'), '44px');
  assert.equal(value(owner, '.root :global(.owner-feature-grid) > label', 'grid-template-columns', '(max-width: 480px)'), 'minmax(0, 1fr)');
});
test('Comparison table is a named keyboard-scrollable region', () => {
  const source = fs.readFileSync('components/SupportingViews.tsx', 'utf8').split('export function Compare')[1].split('export function HelpPage')[0];
  assert.match(source, /className="table-scroll"\s+role="region"\s+aria-label="Company comparison"\s+tabIndex=\{0\}/);
});

test('Owner handbook reference tables remain keyboard reachable', () => {
  const source = fs.readFileSync('components/OwnerHandbook.tsx', 'utf8');
  assert.match(source, /className=\{styles.table\}\s+role="region"\s+aria-label="Handbook reference table"\s+tabIndex=\{0\}/);
});
