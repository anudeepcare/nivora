import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
test('SVG titles have one meaningful child so SSR text matches hydration',()=>{
 for(const name of fs.readdirSync('components').filter(x=>x.endsWith('.tsx'))){
  const source=ts.createSourceFile(name,fs.readFileSync('components/'+name,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const visit=node=>{if(ts.isJsxElement(node)&&node.openingElement.tagName.getText(source)==='title'){
   const children=node.children.filter(x=>!ts.isJsxText(x)||x.text.trim());
   assert.equal(children.length,1,name+' title must render one string');
  }ts.forEachChild(node,visit)};visit(source);
 }
});
