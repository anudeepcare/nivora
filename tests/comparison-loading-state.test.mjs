import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const source = ts.createSourceFile('SupportingViews.tsx', fs.readFileSync('components/SupportingViews.tsx', 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const declaration = source.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === 'Compare');
const code = ts.transpileModule(declaration.getText(source).replace('export ', ''), {compilerOptions:{jsx:ts.JsxEmit.React,module:ts.ModuleKind.CommonJS}}).outputText;
function render({loading = false,error = ''} = {}) {
  const state = ['MSFT,AAPL','MSFT,AAPL',[],'',error,loading];
  let index = 0;
  const empty = () => null;
  const bindings = {React,useState:()=>[state[index++],empty],useEffect:empty,useMemo:f=>f(),useProduct:()=>({}),useResource:()=>({}),comparisonCompatibility:()=>[],PageHeading:empty,Search:empty,PaceHelp:empty,ContributionCompare:empty,Notice:({children})=>React.createElement('p',{role:'alert'},children),Empty:({title,children})=>React.createElement('section',{},title,children)};
  const Component = new Function(...Object.keys(bindings),code+';return Compare;')(...Object.values(bindings));
  return renderToStaticMarkup(React.createElement(Component));
}
test('Comparison loading shows progress rather than an empty result', () => {
  const html = render({loading:true});
  assert.match(html, /role="status"/);
  assert.doesNotMatch(html, /Choose two to four companies to compare/);
});
test('Failed comparison shows its error without unrelated empty guidance', () => {
  const html = render({error:'Comparison unavailable. Try again.'});
  assert.match(html,/Comparison unavailable/);
  assert.doesNotMatch(html,/Choose two to four companies to compare/);
});
test('Initial comparison retains useful empty guidance', () => {
  assert.match(render(),/Choose two to four companies to compare/);
});
