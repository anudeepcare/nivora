import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';

// Prevent historical feature styles from silently returning to the global cascade.
test('every compatibility dependency keeps all declarations inside the named layer',()=>{
 const visited=new Set();
 function inspect(file){
  file=path.resolve(file); if(visited.has(file))return; visited.add(file);
  const root=postcss.parse(fs.readFileSync(file,'utf8'));
  for(const node of root.nodes){
   if(node.type==='comment')continue;
   if(node.type==='atrule'&&node.name==='import'){
    assert.doesNotMatch(node.params,/layer\(/,'Next CSS loader treats import layer() as a media query');
    inspect(path.resolve(path.dirname(file),node.params.match(/["']([^"']+)["']/)[1]));
   }else assert.ok(node.type==='atrule'&&node.name==='layer'&&node.params==='compatibility',`${file}: unisolated ${node.type}`);
  }
 }
 inspect('app/core/compatibility.css');assert.equal(visited.size,2,'Compatibility must load only its entry and consolidated source');
});
test('shared workspace dimensions do not depend on the active research tab',()=>{
 const css=postcss.parse(fs.readFileSync('components/IntegratedExperience.module.css','utf8'));
 const workspace=css.nodes.find(n=>n.type==='rule'&&n.selector==='.workspace');
 const props=Object.fromEntries(workspace.nodes.map(n=>[n.prop,n.value]));
 assert.equal(props.width,'100%');assert.equal(props['max-width'],'var(--app-width)');assert.equal(props['min-width'],'0');
});
