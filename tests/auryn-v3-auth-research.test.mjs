import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read=(p)=>fs.readFileSync(p,"utf8");

for(const page of ["app/login/page.tsx","app/register/page.tsx"]){
 test(`${page} uses AuthShell and no historical auth generations`,()=>{
  const src=read(page);
  assert.match(src,/AuthShell/);
  assert.doesNotMatch(src,/\bosAuth\b|\bv18Auth\b|\bv44Auth\b/);
 });
}

test("research landing has one primary research search and lightweight evidence rail",()=>{
 const src=read("app/analyze/page.tsx");
 assert.match(src,/aurynResearchHero/);
 assert.match(src,/aurynEvidenceRail/);
 assert.equal((src.match(/<SearchBox/g)||[]).length,1);
});
