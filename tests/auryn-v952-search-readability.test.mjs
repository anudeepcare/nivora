import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const box=fs.readFileSync("components/SearchBox.tsx","utf8");
const css=fs.readFileSync("app/auryn-themes.css","utf8");

test("search results lead with ticker and show company plus market metadata",()=>{
 assert.match(box,/className="aurynSearchTicker"/);
 assert.match(box,/className="aurynSearchCompany"/);
 assert.match(box,/className="aurynSearchMeta"/);
 assert.match(box,/className="aurynSearchOpen"/);
});
test("search rows are compact and readable",()=>{
 assert.match(css,/\.aurynSearchResults>button\{[^}]*min-height:58px/);
 assert.match(css,/\.aurynSearchTicker\{[^}]*font-size:16px/);
 assert.match(css,/\.aurynSearchCompany\{[^}]*font-size:13px/);
 assert.match(css,/\.aurynSearchMeta\{[^}]*font-size:10px/);
});
test("search input gets stronger contrast without layout change",()=>{
 assert.match(css,/\.aurynSearch input\{[^}]*color:/);
 assert.match(css,/\.aurynSearch input::placeholder\{[^}]*color:/);
});
