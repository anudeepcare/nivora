import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const source = fs.readFileSync('components/Research.tsx', 'utf8');
const ast = ts.createSourceFile('Research.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const rangeNode = ast.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === 'rangeBars');
const rangeCode = ts.transpileModule(rangeNode.getText(ast), {compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
const selectRange = new Function(rangeCode + ';return rangeBars')();
const history = ['2024-06-01','2025-12-31','2026-01-01','2026-07-31','2026-10-31'].map(time => ({time,open:1,high:2,low:1,close:2,volume:100}));
test('YTD is anchored to the final observation year, not the browser clock', () => {
 assert.deepEqual(selectRange(history,'YTD').map(x=>x.time), ['2026-01-01','2026-07-31','2026-10-31']);
});
test('3M includes the 92-day boundary and ALL preserves available history', () => {
 assert.deepEqual(selectRange(history,'3M').map(x=>x.time), ['2026-07-31','2026-10-31']);
 assert.deepEqual(selectRange(history,'ALL'), history);
 assert.deepEqual(selectRange([],'YTD'), []);
 assert.equal(history.length,5);
});
