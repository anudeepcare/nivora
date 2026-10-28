import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import ts from 'typescript';
test('chart pins a valid locale instead of inheriting malformed browser locale information',()=>{
 const ast=ts.createSourceFile('Charts.tsx',fs.readFileSync('components/Charts.tsx','utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const fn=ast.statements.find(x=>ts.isFunctionDeclaration(x)&&x.name?.text==='PriceChart');
 const code=ts.transpileModule(fn.getText(ast).replace('export ',''),{compilerOptions:{jsx:ts.JsxEmit.React,module:ts.ModuleKind.CommonJS}}).outputText;
 const effects=[];let refs=0,options;
 const bindings={React:{createElement:()=>null},EMPTY_COLORS:{},EMPTY_LEVELS:[],useRef:()=>({current:refs++===0?{}:null}),useProduct:()=>({theme:'light'}),useEffect:fn=>effects.push(fn),getComputedStyle:()=>({getPropertyValue:()=>''}),createChart:(_,o)=>{options=o;return{addSeries:()=>({}),remove(){}};},AreaSeries:{},CandlestickSeries:{},ColorType:{Solid:'solid'}};
 const View=new Function(...Object.keys(bindings),code+';return PriceChart;')(...Object.values(bindings));View({bars:[],range:'1Y'});effects[0]();assert.equal(new Intl.DateTimeFormat(options.localization.locale).resolvedOptions().locale,'en-US');
});
