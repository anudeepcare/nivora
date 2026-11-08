/** Remove an earlier exact duplicate only within the same conditional cascade.
 * Keep the last rule, all nonidentical declarations and layer wrappers in place.
 */
export function deduplicateRules(root) {
  const rules=[];root.walkRules(rule=>rules.push(rule));
  const seen=new Set();let removed=0;
  for(const rule of rules.reverse()){
    let parent=rule.parent;const context=[];let safe=true;
    while(parent&&parent.type!=='root'){
      if(parent.type!=='atrule'||!parent.params||/keyframes/i.test(parent.name)){safe=false;break;}
      context.unshift([parent.name,parent.params]);parent=parent.parent;
    }
    if(!safe||rule.nodes.some(n=>!['decl','comment'].includes(n.type)))continue;
    const signature=JSON.stringify([context,rule.selector,rule.nodes.filter(n=>n.type==='decl').map(n=>[n.prop,n.value,!!n.important])]);
    if(seen.has(signature)){rule.remove();removed++;}else seen.add(signature);
  }
  return removed;
}
