import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import ts from 'typescript';
test('preview resources return supplied data without a state-effect render loop',()=>{
 const ast=ts.createSourceFile('Session.tsx',fs.readFileSync('components/Session.tsx','utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),fn=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='useResource');const code=ts.transpileModule(fn.getText(ast).replace('export ',''),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 let writes=0;const useResource=new Function('useProduct','useState','useEffect',code+';return useResource;')(()=>({demo:{},cache:new Map()}),initial=>[typeof initial==='function'?initial():initial,()=>writes++],effect=>effect());
 for(let i=0;i<3;i++){const supplied={value:i};assert.deepEqual(useResource('quotes',supplied).data,supplied);}
 assert.equal(writes,0);
});
