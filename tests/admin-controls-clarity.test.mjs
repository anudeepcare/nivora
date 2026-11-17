import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import React from 'react';
const source = fs.readFileSync('components/SupportInbox.tsx','utf8');
function nodes(node,predicate) { if (!node || typeof node !== 'object') return []; return [...(predicate(node)?[node]:[]),...React.Children.toArray(node.props?.children).flatMap(child=>nodes(child,predicate))]; }
function inbox() {
 const changes=[];
 const ast=ts.createSourceFile('SupportInbox.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const declaration=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='SupportInbox');
 const code=ts.transpileModule(declaration.getText(ast).replace('export default ',''),{compilerOptions:{jsx:ts.JsxEmit.React,target:ts.ScriptTarget.ES2022}}).outputText;
 const View=new Function('React','useState','useEffect','useRef','s',code+';return SupportInbox;')(React,value=>[value,next=>changes.push(next)],()=>{},value=>({current:value}),{});
 return {tree:View(),changes};
}
test('Inbox exposes read-only refresh separately from sending retry',()=>{
 const {tree,changes}=inbox();
 const buttons=nodes(tree,n=>n.type==='button');
 const refresh=buttons.find(n=>n.props.children==='Refresh inbox');
 assert.ok(refresh);assert.equal(refresh.props.disabled,true,'refresh waits during initial load');
 refresh.props.onClick(); assert.equal(changes[0](3),4);
 const retry=buttons.find(n=>n.props.children==='Retry pending emails');
 assert.match(retry.props.title,/Resubmit pending support receipts/);
 assert.equal(retry.props.disabled,true);
});
test('Admin retains owner gate and resolves handbook navigation target',()=>{
 const owner=fs.readFileSync('components/OwnerAccess.tsx','utf8');
 assert.match(owner,/if \(!access.owner\)/);
 assert.match(owner,/href="\/settings"/);
 assert.match(owner,/id="admin-handbook"/);
});
test('Email UI does not claim mailto sends or provider acceptance equals delivery',()=>{
 assert.match(source,/Replies are not sent or tracked here/);
 assert.match(source,/Receipt accepted by provider/);
 assert.match(source,/Owner email accepted by provider/);
 assert.doesNotMatch(source,/"Owner notified"|"Receipt sent"/);
 assert.match(fs.readFileSync('components/SupportingViews.tsx','utf8'),/Opens your email app/);
});
