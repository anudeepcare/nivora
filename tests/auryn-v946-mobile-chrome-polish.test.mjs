import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const css=fs.readFileSync("app/auryn-mobile-v946.css","utf8");
const layout=fs.readFileSync("app/layout.tsx","utf8");

test("v946 is final loaded mobile layer",()=>{
 assert.match(layout,/import "\.\/auryn-mobile-v946\.css";/);
 assert.ok(layout.indexOf("auryn-mobile-v946.css")>layout.indexOf("auryn-mobile-v945.css"));
});
test("mobile header is optically compact",()=>{
 assert.match(css,/\.aurynHeader\{[^}]*height:calc\(50px \+ env\(safe-area-inset-top\)\)/);
 assert.match(css,/\.aurynHeader \.aurynBrand\{[^}]*gap:8px/);
});
test("search is shorter and closer to company identity",()=>{
 assert.match(css,/\.aurynMobileSearch form\{[^}]*height:44px/);
 assert.match(css,/\.aurynMobileSearch\{[^}]*padding:7px 16px 6px/);
});
test("security masthead is denser and aligned",()=>{
 assert.match(css,/\.aurynStockMasthead\{[^}]*padding:6px 0 8px/);
 assert.match(css,/\.aurynSecurityLogo\{[^}]*width:42px/);
 assert.match(css,/\.aurynStockIdentity h1\{[^}]*font-size:27px/);
});
test("position chip is visually secondary",()=>{
 assert.match(css,/\.aurynOwnChip\{[^}]*font-size:7px/);
});
test("facts and evidence tabs are compact",()=>{
 assert.match(css,/\.aurynSecurityFacts\{[^}]*padding:8px 0/);
 assert.match(css,/\.aurynEvidenceNav button,.aurynEvidenceNav a\{[^}]*font-size:10px/);
});
test("bottom nav active treatment is lighter",()=>{
 assert.match(css,/\.aurynBottomNav a\{[^}]*min-height:48px/);
});
