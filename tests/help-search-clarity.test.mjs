import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import React from 'react';
function nodes(node,predicate) { if (!node || typeof node!=='object') return [];return [...(predicate(node)?[node]:[]),...React.Children.toArray(node.props?.children).flatMap(child=>nodes(child,predicate))]; }
test('Help search trims input and offers a working reset without changing legal content',()=>{
 const ast=ts.createSourceFile('LegalDocument.tsx',fs.readFileSync('components/LegalDocument.tsx','utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const declaration=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='LegalDocument');
 const code=ts.transpileModule(declaration.getText(ast).replace('export default ',''),{compilerOptions:{jsx:ts.JsxEmit.React,target:ts.ScriptTarget.ES2022}}).outputText;
 let saved;const noop=()=>null;
 const bindings={useState:()=>[' Pace ',v=>saved=v],documents:{help:{title:'Help',intro:'Guide',sections:[{title:'Pace',text:'Price context'},{title:'Portfolio',text:'Holdings'}]}},legalConfiguration:{version:'1',updated:'Today',operator:'Operator',contact:'support@example.com'},styles:{document:'document'},Link:noop,ContextLink:noop,DocumentBack:noop,PrivacyChoices:noop};
 const View=new Function('React',...Object.keys(bindings),code+';return LegalDocument;')(React,...Object.values(bindings));
 const tree=View({id:'help'});assert.equal(tree.props['data-document'],'help');
 const topics=nodes(tree,n=>n.type==='details');assert.equal(topics.length,1);assert.equal(topics[0].props.open,true);assert.equal(nodes(topics[0],n=>n.type==='summary')[0].props.children,'Pace');
 const reset=nodes(tree,n=>n.type==='button')[0];assert.equal(reset.props.children,'Clear search');reset.props.onClick();assert.equal(saved,'');
});
