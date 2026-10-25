import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import ts from 'typescript';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
test('public Contact stays reachable without account or membership checks',()=>{
 const ast=ts.createSourceFile('AppSession.tsx',fs.readFileSync('components/AppSession.tsx','utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);const fn=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='AppSession');const code=ts.transpileModule(fn.getText(ast).replace('export default ',''),{compilerOptions:{jsx:ts.JsxEmit.React,module:ts.ModuleKind.CommonJS}}).outputText;
 const View=new Function('React','usePathname','ProductSession','AccessBoundary','Shell',code+';return AppSession;')(React,()=>'/contact',()=>React.createElement('p',null,'Account gate'),()=>null,()=>null);
 assert.match(renderToStaticMarkup(React.createElement(View,null,'Contact form')),/Contact form/);
});
