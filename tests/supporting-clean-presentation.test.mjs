import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import crypto from 'node:crypto';
const contracts=JSON.parse(fs.readFileSync('tests/fixtures/supporting-controls.json','utf8'));
for(const [name, expected] of Object.entries(contracts)) test(`${name} preserves pre-rebuild actions, validation and accessibility controls`,()=>{
 const src=fs.readFileSync(`components/${name}.tsx`,'utf8');
 // Help search moved into ProductGuide; check the retained controls and the
 // extracted search contract rather than treating relocation as deletion.
 if(name==='LegalDocument'){
  assert.match(src, /<PrivacyChoices/);
  assert.match(src, /<DocumentBack/);
  assert.match(src, /aria-label="Help and legal documents"/);
  assert.match(src, /<ProductGuide topics=\{d.sections\}/);
  const guide=fs.readFileSync('components/ProductGuide.tsx','utf8');
  assert.match(guide, /type="search"/);
  assert.match(guide, /onChange=\{\(event\) => setQuery\(event.target.value\)\}/);
  assert.match(guide, /role="status"/);
  assert.match(guide, /<DetailDialog/);
  return;
 }
 const ast=ts.createSourceFile(name+'.tsx',src,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),arr=[];
 function walk(n){if(ts.isJsxAttribute(n)&& /^(on[A-Z]|disabled$|required$|min$|max$|minLength$|maxLength$|type$|accept$|aria-|role$)/.test(n.name.getText(ast)))arr.push(n.getText(ast).replace(/\s+/g,' '));ts.forEachChild(n,walk)}walk(ast);
 assert.equal(crypto.createHash('sha256').update(arr.join('\n')).digest('hex'),expected);
});
test('supporting interactive routes have explicit scoped layout roots',()=>{
 for(const name of ['Discover','AlertCenter','ResearchLab','Trading','OwnerValidation','OwnerEvidenceTools'])assert.match(fs.readFileSync(`components/${name}.tsx`,'utf8'),/className=\{support\./);
});
test('contact honeypot remains hidden after legacy retirement and its form owns grid layout',()=>{
 const css=fs.readFileSync('components/Contact.module.css','utf8');
 assert.match(css,/:global\(\.contact-honeypot\)\s*\{\s*display: none/);
 assert.match(css,/\.page form\s*\{\s*display: grid/);
});
test('supporting modules avoid cascade escalation and deprecated imports',()=>{
 for(const name of ['SupportingScreens','PublicFrame','Contact','LegalDocument','Plans','MonthlyPlan','ReleaseNotes']){
 const css=fs.readFileSync(`components/${name}.module.css`,'utf8');assert.doesNotMatch(css,/!important|legacy-panels|@import|\.page\.page|\.document\.document/);
 }
});
