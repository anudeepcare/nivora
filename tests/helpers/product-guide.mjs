import fs from 'node:fs';
import ts from 'typescript';
import React from 'react';
import * as jsx from 'react/jsx-runtime';
import * as icons from 'lucide-react';
export function loadGuide(){
 const code=ts.transpileModule(fs.readFileSync('components/ProductGuide.tsx','utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
 const mod={exports:{}};
 new Function('require','module','exports',code)((name)=>{
 if(name==='react')return React;
 if(name==='react/jsx-runtime')return jsx;
 if(name==='lucide-react')return icons;
 if(name==='next/link')return {__esModule:true,default:({children,...props})=>React.createElement('a',props,children)};
 if(name.endsWith('.module.css'))return {__esModule:true,default:new Proxy({},{get:(_,key)=>String(key)})};
 if(name==='./DetailDialog')return {__esModule:true,default:({title,trigger,children})=>React.createElement('section',{'data-dialog-title':title},trigger,children)};
 throw Error(name);
 },mod,mod.exports);return mod.exports.default;
}
