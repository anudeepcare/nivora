import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import ts from 'typescript';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
import {resolveAccess,featureNames,defaultAccessConfig} from '../lib/access-policy.ts';
function render(name,access,loaded=false){
 const file=`components/${name==="AccessBoundary"?"Access":name}.tsx`,ast=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),node=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name);
 const code=ts.transpileModule(node.getText(ast).replace('export default ',''),{compilerOptions:{jsx:ts.JsxEmit.React,module:ts.ModuleKind.CommonJS}}).outputText;
 let first=true;const bindings={React,useAccess:()=>({access,refresh:()=>{}}),useCallback:x=>x,usePathname:()=>"/overview",useState:x=>{const v=name==="AccessBoundary"&&first?access:loaded&&first?{config:defaultAccessConfig,grants:[],audit:[],usage:0,enabled:true}:x;first=false;return[v,()=>{}]},useEffect:()=>{},featureNames,defaultAccessConfig,dateLabel:x=>x,Link:({children,...p})=>React.createElement('a',p,children)};
 const Component=new Function(...Object.keys(bindings),'const exports={};'+code+`;return ${name}`)(...Object.values(bindings));return renderToStaticMarkup(React.createElement(Component));
}
const input={enabled:true,owner:false,licensed:false,now:'2026-10-23T12:00:00Z',config:{mode:'beta'}};
test('compact plan summary distinguishes sample access and links directly to plans',()=>{const html=render('PlanPanel',resolveAccess(input));assert.match(html,/AURYN Free/);assert.match(html,/Sample beta/);assert.match(html,/href="\/plans"/);assert.doesNotMatch(html,/Owner controls|href="\/owner"/);});
test('Pro cannot render the owner console; actual owner gets invitation and feature controls',()=>{const pro=resolveAccess({...input,grant:{expiresAt:'2026-11-01'}});const denied=render('OwnerAccess',pro,true);assert.match(denied,/configured workspace owner/);assert.doesNotMatch(denied,/<form|<select/);const owner=render('OwnerAccess',resolveAccess({...input,owner:true}),true);assert.match(owner,/Grant complimentary Pro/);assert.match(owner,/Feature access/);assert.match(owner,/Preview access/);assert.doesNotMatch(owner,/No billing|Real charges remain/);});

