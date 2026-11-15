import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

// Removing a scroll-region tab stop or name must fail, even if table content stays intact.
for (const file of ['FinancialDetailTable', 'FinancialExplorer', 'OwnershipPicture', 'ResearchCompare', 'ProfessionalWorkbench', 'TargetsEstimates', 'OptionsDesk', 'OptionsExpiryComparison', 'ResearchWorkbench', 'ResearchEvidence', 'EarningsWorkspace', 'EstimateRevisions']) {
  test(`${file}: wide evidence tables are named keyboard-scroll regions`, () => {
    const source = ts.createSourceFile(file + '.tsx', fs.readFileSync(`components/${file}.tsx`, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    let count = 0;
    function visit(node) {
      if (ts.isJsxOpeningElement(node) && node.tagName.getText(source) === 'div') {
        const attrs = node.attributes.properties;
        const cls = attrs.find(a => a.name?.getText(source) === 'className')?.getText(source) || '';
        if (/table-scroll|tableWrap|options_scroll|s\.scroll|styles\.table/.test(cls)) {
          count++;
          const text = node.getText(source);
          assert.match(text, /tabIndex=\{0\}/, `${file}: missing keyboard access`);
          assert.match(text, /role="region"/, `${file}: missing region role`);
          assert.match(text, /aria-label="[^"]+"/, `${file}: missing accessible name`);
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
    assert.ok(count > 0);
  });
}
test('forecast assumption controls have touch-sized targets and readable phone inputs', () => {
  const css = fs.readFileSync('components/TargetsEstimates.module.css', 'utf8');
  for (const selector of ['.assumptionBar input', '.resetAssumption', '.assumptionHelp summary']) {
    const block = css.slice(css.indexOf(selector));
    assert.match(block.slice(0, block.indexOf('}') + 1), /min-height: 44px/);
  }
  assert.match(css, /@media \(max-width: 650px\)[\s\S]*\.assumptionBar input\s*\{\s*font-size: 16px/);
});
test('financial overview period controls remain one row with 44px targets', () => {
  const css = fs.readFileSync('components/ResearchMetrics.module.css', 'utf8');
  const block = css.slice(css.indexOf('/* Period controls'));
  assert.doesNotMatch(block, /min-height: (40|42)px/);
  assert.match(block, /min-height: 44px/);
  assert.match(block, /repeat\(3, minmax\(0, 1fr\)\)/);
});
test('earnings values use content-aware columns instead of cramped fixed thirds', () => {
  const css = fs.readFileSync('components/ResearchDeskLayout.module.css', 'utf8');
  const start = css.indexOf('.content.content.content :global(.earnings-kpis)');
  const rule = css.slice(start, css.indexOf('}', start));
  assert.match(rule, /repeat\(auto-fit, minmax\(min\(140px, 100%\), 1fr\)\)/);
});
