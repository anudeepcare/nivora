import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import ts from 'typescript';import React from 'react';import {defaultAccessConfig,featureNames} from '../lib/access-policy.ts';
function harness(){
 const ast=ts.createSourceFile('owner.tsx',fs.readFileSync('components/OwnerAccess.tsx','utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);const fn=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='OwnerAccess');
 const js=ts.transpileModule(fn.getText(ast).replace('export default ',''),{compilerOptions:{jsx:ts.JsxEmit.React,module:ts.ModuleKind.CommonJS}}).outputText;
 const state=[],calls=[];let index=0,opened=0,closed=0;
 const data={config:defaultAccessConfig,enabled:true,usage:0,audit:[],grants:[{email:'member@example.invalid',user_id:'member',cohort:'friends',expires_at:'2027-01-01T00:00:00Z',revoked_at:null}]};
 const bindings={React,styles:{},useRef:()=>({current:{showModal:()=>opened++,close:()=>closed++}}),useState:initial=>{const i=index++;if(!(i in state))state[i]=i===0?data:initial;return [state[i],value=>state[i]=value]},useEffect:()=>{},useAccess:()=>({access:{owner:true},refresh:async()=>{}}),api:async(path,body)=>{if(!body)return data;calls.push(body);return {saved:true,grant:data.grants[0]}},defaultAccessConfig,featureNames,dateLabel:x=>x,SupportInbox:()=>null,Users:()=>null,SlidersHorizontal:()=>null,CreditCard:()=>null,Mail:()=>null,Plus:()=>null,X:()=>null};
 const C=new Function(...Object.keys(bindings),js+';return OwnerAccess')(...Object.values(bindings));const render=()=>{index=0;return C()};
 return {render,calls,get opened(){return opened},get closed(){return closed}};
}
function nodes(node){if(!node||typeof node!=='object')return [];return [node,...React.Children.toArray(node.props?.children).flatMap(nodes)]}
const text=node=>typeof node==='string'?node:React.Children.toArray(node?.props?.children).map(text).join('');
test('grant and extend open the same closed dialog; grant submit preserves payload and closes on success',async()=>{
 const h=harness();let tree=h.render();const dialog=nodes(tree).find(n=>n.type==='dialog');assert.equal(dialog.props.open,undefined);assert.equal(dialog.props['aria-labelledby'],'grant-title');
 nodes(tree).find(n=>n.type==='button'&&text(n)==='Grant access').props.onClick();assert.equal(h.opened,1);
 tree=h.render();nodes(tree).find(n=>n.type==='button'&&text(n)==='Extend 30 days').props.onClick();assert.equal(h.opened,2);
 tree=h.render();nodes(tree).find(n=>n.type==='form'&&n.props.className==='owner-grant-form').props.onSubmit({preventDefault(){}});
 await new Promise(r=>setImmediate(r));assert.equal(h.calls[0].action,'grant');assert.equal(h.calls[0].email,'member@example.invalid');assert.equal(h.calls[0].cohort,'friends');assert.ok(Date.parse(h.calls[0].expiresAt)>Date.parse('2027-01-01'));assert.equal(h.closed,1);
});
