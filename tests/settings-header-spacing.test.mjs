import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import postcss from 'postcss';
const css=postcss.parse(fs.readFileSync('components/SettingsPage.module.css','utf8'));
function headerPadding(first,width){
 let winner={score:-1,order:-1,value:null},order=0;
 css.walkRules(rule=>{
  order++;
  for(let p=rule.parent;p&&p.type!=='root';p=p.parent){
   if(p.type==='atrule'&&p.name==='media'){
    const max=/max-width:\s*(\d+)px/.exec(p.params),min=/min-width:\s*(\d+)px/.exec(p.params);
    if((max&&width>+max[1])||(min&&width<+min[1]))return;
   }
  }
  const selector=rule.selector.replace(/:global\(([^)]+)\)/g,'$1');
  if(!/^\.page \.(workspace-setting-group|settings-signals)(:first-child)? > header$/.test(selector))return;
  if(selector.includes(':first-child')&&!first)return;
  const score=(selector.match(/\.[\w-]+|:first-child/g)||[]).length;
  rule.walkDecls(decl=>{
   if(!['padding','padding-top'].includes(decl.prop))return;
   if(score>winner.score||(score===winner.score&&order>=winner.order))winner={score,order,value:parseFloat(decl.value)};
  });
 });
 return winner.value;
}
test('first Research panels header keeps same breathing room as later settings cards',()=>{
 for(const width of [320,390,768,1168,2048]){
  assert.equal(headerPadding(true,width),headerPadding(false,width),'first header at '+width);
  assert.ok(headerPadding(true,width)>=12,'visible top inset at '+width);
 }
});
function declarations(selector){const out={};css.walkRules(r=>{if(r.selector===selector)r.walkDecls(d=>out[d.prop]=d.value);});return out;}
test('notification copy is not bisected by a header separator',()=>{
 assert.equal(declarations('.page :global(.settings-notifications) > header')['border-bottom'],'0');
});
test('odd final signal occupies same column width as other signal rows',()=>{
 assert.notEqual(declarations('.page :global(.settings-signals) > label:last-of-type')['grid-column'],'1 / -1');
});
test('connected sign-in labels have a body inset below header',()=>{
 assert.ok(parseFloat(declarations('.page :global(#settings-account) :global(.workspace-setting-body)')['padding-top'])>=10);
});
