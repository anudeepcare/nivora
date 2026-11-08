import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
function load(name, bindings = {}) {
  const file='components/LaunchScreen.tsx';
  const ast=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const declaration=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name);
  const code=ts.transpileModule(declaration.getText(ast).replace('export default ',''),{compilerOptions:{jsx:ts.JsxEmit.React,module:ts.ModuleKind.CommonJS}}).outputText;
  const scope={React,styles:new Proxy({},{get:(_,key)=>key}),useState:()=>[false,()=>{}],useEffect:()=>{},useContext:()=>null,LaunchStartedAt:{},...bindings};
  return new Function(...Object.keys(scope),'const exports={};'+code+`;return ${name}`)(...Object.values(scope));
}
test('launch has one accessible message, a small decorative brand mark and no fabricated progress',()=>{
  const Launch=load('LaunchScreen');
  const html=renderToStaticMarkup(React.createElement(Launch));
  assert.match(html,/Opening your workspace/);
  assert.match(html,/role="status"/);
  assert.match(html,/aria-busy="true"/);
  assert.match(html,/aria-hidden="true"/);
  assert.doesNotMatch(html,/progressbar|spinner|[0-9]+%/);
});
test('failed launch exposes recovery without an indefinite busy announcement',()=>{
  let retry=0;
  const Launch=load('LaunchScreen');
  const tree=Launch({error:'Access could not be checked.',onRetry:()=>retry++});
  const html=renderToStaticMarkup(tree);
  assert.match(html,/role="alert"/);
  assert.match(html,/Access could not be checked/);
  assert.match(html,/Try again/);
  assert.doesNotMatch(html,/aria-busy="true"/);
  const buttons=[];function visit(x){if(!x||typeof x!=='object')return;if(x.type==='button')buttons.push(x);React.Children.forEach(x.props?.children,visit);}visit(tree);
  buttons[0].props.onClick();assert.equal(retry,1);
});
test('slow launch offers recovery without delaying successful content',()=>{
  let delay, cleanup=false;
  const Launch=load('LaunchScreen',{useState:()=>[true,()=>{}],useEffect:fn=>{const dispose=fn();dispose?.();},window:{setTimeout:(_,ms)=>{delay=ms;return 1;},clearTimeout:()=>{cleanup=true;},location:{reload:()=>{}}}});
  const html=renderToStaticMarkup(React.createElement(Launch));
  assert.equal(delay,10000);assert.equal(cleanup,true);
  assert.match(html,/Taking longer than usual/);assert.match(html,/Reload/);
});
test('launch covers safe areas and honors OS and saved reduced-motion settings',()=>{
 const css=fs.readFileSync('components/LaunchScreen.module.css','utf8');
 assert.match(css,/100dvh/);assert.match(css,/safe-area-inset-top/);assert.match(css,/prefers-reduced-motion: reduce/);assert.match(css,/data-motion="reduce"/);assert.match(css,/data-theme="dark"/);
});

test('access and workspace gates share elapsed startup time instead of restarting the slow clock',()=>{
  let delay;
  const now=Date.now();
  const Launch=load('LaunchScreen',{useContext:()=>now-8000,useEffect:fn=>fn(),window:{setTimeout:(_,ms)=>{delay=ms;return 1;},clearTimeout:()=>{}}});
  Launch();
  assert(delay<=2000 && delay>=1900);
});
