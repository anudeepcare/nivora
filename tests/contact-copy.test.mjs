import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
function renderContact(){
 const ast=ts.createSourceFile('Contact.tsx',fs.readFileSync('components/Contact.tsx','utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const fn=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='Contact');
 const code=ts.transpileModule(fn.getText(ast).replace('export default ',''),{compilerOptions:{jsx:ts.JsxEmit.React,module:ts.ModuleKind.CommonJS}}).outputText;
 const link=({children,...props})=>React.createElement('a',props,children);
 const icon=()=>null;
 const View=new Function('React','styles','APP_VERSION','DocumentBack','ContextLink','newRequestId','SUPPORT_EMAIL','useEffect','useState','Link','CheckCircle2','ShieldCheck','ArrowRight','supportCategories',code+';return Contact;')(React,{},'test',icon,({page,children})=>link({href:`/${page}`,children}),()=>'', 'support@example.com',()=>{},React.useState,link,icon,icon,icon,['General']);
 return renderToStaticMarkup(React.createElement(View));
}
test('Contact has one sensitive-data warning and a discoverable Help route',()=>{
 const html=renderContact();
 assert.equal((html.match(/passwords/g)||[]).length,1);
 assert.match(html,/href="\/help"/);
 assert.match(html,/href="\/privacy"/);
 assert.match(html,/href="mailto:support@example.com"/);
 assert.match(html,/API keys/);
 assert.match(html,/payment/);
 assert.match(html,/No ticker, holdings, notes, URL parameters or account details/);
});
