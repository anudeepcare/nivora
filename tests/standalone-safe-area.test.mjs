import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import postcss from 'postcss';
const read=p=>fs.readFileSync(p,'utf8');
const safe=value=>['top','right','bottom','left'].every(edge=>value.includes(`safe-area-inset-${edge}`));
for(const [file,selector] of [['Contact','.page.page.page'],['ReleaseNotes','.page'],['LegalDocument','.document.document.document']]) {
 test(`${file} standalone padding protects all screen edges at every breakpoint`,()=>{
  const root=postcss.parse(read(`components/${file}.module.css`));let count=0;
  root.walkRules(selector,rule=>rule.walkDecls('padding',d=>{count++;assert.ok(safe(d.value),`${file}: ${d.value}`);}));
  assert.ok(count>0);
 });
}
test('only public Plans receives viewport safe-area padding',()=>{
 const css=read('components/Plans.module.css');
 const root=postcss.parse(css);let rule;
 root.walkRules('.page:global(.plans-public)',r=>rule=r);
 assert.ok(rule,'public-only guard');
 assert.ok(safe(rule.nodes.find(d=>d.prop==='padding')?.value || ''));
});
test('auth padding protects all screen edges after responsive overrides',()=>{
 const css=read('components/Session.module.css');
 for(const selector of ['.auth .main','.auth .story']) {
   let rule; postcss.parse(css).walkRules(selector,r=>{if(r.nodes.some(d=>d.prop==='padding'))rule=r;});
   assert.ok(safe(rule.nodes.find(d=>d.prop==='padding').value),selector);
 }
});
test('password recovery keeps its existing theme while adding only scoped safe-area padding',()=>{
 const src=read('components/PasswordRecovery.tsx');
 assert.doesNotMatch(src,/Session.module.css/);
 const css=postcss.parse(read('app/core/readability.css')); let count=0;
 css.walkRules(rule=>{
   if(!rule.selector.includes('[data-auth-mode="recovery"]')) return;
   rule.walkDecls(d=>{assert.equal(d.prop,'padding');assert.ok(safe(d.value));count++;});
 });
 assert.ok(count>=3,'recovery story, main and mobile main reserve insets');
 assert.match(src,/fetch\("\/api\/auth\/recovery"/);
});
test('release heading uses theme-aware foreground gradient colors',()=>{
 assert.match(read('components/ReleaseNotes.module.css'),/\.page > h1[^}]+linear-gradient\(105deg, var\(--blue\), var\(--green\)\)/);
});
