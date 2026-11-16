import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {demoData} from './fixtures/demo.ts';
import {businessHistory} from '../lib/business-history.ts';
import {advancedDesk} from '../lib/research-desks.ts';
import * as format from '../lib/format.ts';
function render(name, open) {
 const ast=ts.createSourceFile('x.tsx',fs.readFileSync(`components/${name}.tsx`,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const fn=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name);
 const code=ts.transpileModule(fn.getText(ast).replace('export default ',''),{compilerOptions:{jsx:ts.JsxEmit.React,target:ts.ScriptTarget.ES2022}}).outputText;
 const scope={React,useMemo:React.useMemo,businessHistory,advancedDesk,...format,detailStyle:{content:'detail-content'},Help:()=>null,DetailDialog:({title,trigger,children})=>React.createElement(React.Fragment,null,React.createElement('button',{'aria-haspopup':'dialog'},trigger),open?React.createElement('section',{'data-open-dialog':title},children):null)};
 const View=new Function(...Object.keys(scope),code+`;return ${name}`)(...Object.values(scope));
 return renderToStaticMarkup(React.createElement(View,{research:demoData.research.MSFT}));
}
test('business primary metrics remain and historical charts appear only in open detail dialog',()=>{
 const closed=render('BusinessHistory',false), open=render('BusinessHistory',true);
 assert.match(closed,/Profitable years/);assert.match(closed,/Historical charts/);
 assert.doesNotMatch(closed,/aria-label="Revenue history"|Annual reported evidence/);
 assert.match(open,/data-open-dialog="Business history"/);assert.match(open,/aria-label="Revenue history"/);assert.match(open,/Annual reported evidence/);
});
test('advanced primary distribution stays visible while recovery details open separately',()=>{
 const closed=render('AdvancedDashboard',false), open=render('AdvancedDashboard',true);
 assert.match(closed,/Return distribution/);assert.doesNotMatch(closed,/Volatility regime/);
 assert.match(open,/Volatility regime/);assert.match(open,/Price gaps and recovery/);
});
test('technical groups use dialogs and preserve full study rows with scoped portal styles',()=>{
 const s=fs.readFileSync('components/TechnicalDashboard.tsx','utf8');
 assert.match(s,/<DetailDialog[\s\S]*?title=\{g.title\}/);assert.match(s,/g.rows.map/);
 assert.doesNotMatch(s,/<details key=\{g.title\}/);
 assert.match(s,/className=\{detailStyle.content\}/);
 const css=fs.readFileSync('components/ResearchDetailContent.module.css','utf8');assert.match(css,/\.content dl/);assert.match(css,/overflow-x: auto/);
});
