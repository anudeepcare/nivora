import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=p=>readFileSync(new URL('../components/'+p,import.meta.url),'utf8');
test('events and indicators expose core content without workspace navigation',()=>{
 assert.ok(existsSync('components/DirectResearchLenses.tsx'));
 const s=read('DirectResearchLenses.tsx');
 assert.match(s,/<CompanyEventCalendar research=\{research\}/);
 assert.match(s,/<IndicatorOverview research=\{research\}/);
 assert.doesNotMatch(s,/ResearchWorkspace/);
 assert.doesNotMatch(s, /MoreEvidence|<details|opened && children/);
 for(const name of ['CompanyUpdates','EarningsWorkspace','AdvancedResearch','SentiSensePanels'])assert.ok(s.includes('<'+name));
});
test('wall keeps reporting basis with each metric and uses one continuous grid',()=>{
 const s=read('IndicatorOverview.tsx');
 assert.match(s,/group\.label/);
 assert.match(s,/wall\.grid/);
 assert.match(read('DirectResearchLenses.module.css'),/repeat\(4, minmax\(0, 1fr\)\)/);
});
test('event stream avoids unsupported impact claims',()=>{
 const s=read('CompanyEventCalendar.tsx');
 assert.match(s,/Chronological stream/);
 assert.match(s,/Impact rankings are not supplied/);
});
test('initial lens render mounts high-value evidence without an opening action', async()=>{
 const React=await import('react');
 const {renderToStaticMarkup}=await import('react-dom/server');
 const ts=(await import('typescript')).default;
 const source=read('DirectResearchLenses.tsx');
 const ast=ts.createSourceFile('lens.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const names=['EntityMetricHistory','StockSentiment','EconomicContext','CompanyEventCalendar','CompanyUpdates','EarningsWorkspace','EarningsReview','SentiSensePanels','IndicatorOverview','AdvancedResearch'];
 const children=names.map(name=>props=>React.createElement('div',{'data-evidence':name,'data-group':props.group},name));
 for(const [name,expected] of [
  ['EventsLens',['CompanyEventCalendar','CompanyUpdates','EarningsWorkspace','EarningsReview','SentiSensePanels']],
  ['IndicatorsLens',['IndicatorOverview','EntityMetricHistory','StockSentiment','AdvancedResearch','SentiSensePanels']]
 ]){
  const node=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name.text===name);
  const code=ts.transpileModule(node.getText(ast).replace('export function','function'),{compilerOptions:{jsx:ts.JsxEmit.React,target:ts.ScriptTarget.ES2022}}).outputText;
  const Component=new Function('React','s',...names,code+`;return ${name};`)(React,{},...children);
  const html=renderToStaticMarkup(React.createElement(Component,{research:{company:{symbol:'TEST'}},preview:true}));
  for(const child of expected)assert.equal((html.match(new RegExp(`data-evidence="${child}"`,'g'))??[]).length,1,child+' visible exactly once');
  assert.doesNotMatch(html,/<details| hidden=/);
 }
});
