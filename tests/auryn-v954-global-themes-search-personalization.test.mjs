import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const profile=fs.readFileSync("app/profile/page.tsx","utf8");
const provider=fs.readFileSync("components/ThemeProvider.tsx","utf8");
const themes=fs.readFileSync("app/auryn-themes.css","utf8");
const search=fs.readFileSync("components/SearchBox.tsx","utf8");

test("seven curated themes and useful personalization controls exist",()=>{
 for(const x of ["classic","midnight","slate","emerald","obsidian","ocean","burgundy"]) assert.match(profile,new RegExp(`value:"${x}"`));
 assert.match(profile,/Density/); assert.match(profile,/Number format/);
 for(const x of ["comfortable","compact"]) assert.match(profile,new RegExp(`"${x}"`));
 for(const x of ["standard","abbreviated"]) assert.match(profile,new RegExp(`"${x}"`));
});
test("appearance provider persists theme text density and number format",()=>{
 for(const x of ["dataset.theme","dataset.textSize","dataset.density","dataset.numberFormat"]) assert.match(provider,new RegExp(x.replace(".","\\.")));
 assert.match(provider,/localStorage/);
});
test("every theme defines readable global tokens",()=>{
 for(const x of ["classic","midnight","slate","emerald","obsidian","ocean","burgundy"]) assert.match(themes,new RegExp(`data-theme="${x}"`));
 for(const token of ["--auryn-bg:","--auryn-surface:","--auryn-ink:","--auryn-muted:","--auryn-chrome:","--auryn-input:"]) assert.match(themes,new RegExp(token));
});
test("all major app surfaces consume theme tokens",()=>{
 for(const x of [".aurynResearchHome",".aurynStockPage",".aurynPortfolioPage",".aurynMonitorPage",".aurynTradingLabPage",".simplePage",".aurynAuthPage"]) assert.match(themes,new RegExp(x.replace(".","\\.")));
});
test("search result has deterministic semantic slots",()=>{
 for(const x of ["aurynSearchTicker","aurynSearchCompany","aurynSearchMeta","aurynSearchOpen"]) assert.match(search,new RegExp(x));
});
test("mobile search uses isolated flex row so legacy span rules cannot collide",()=>{
 assert.match(themes,/\.aurynSearchResults>button>\.aurynSearchResultText\{[^}]*display:flex/);
 assert.match(themes,/\.aurynSearchResults>button>\.aurynSearchOpen\{[^}]*margin-left:auto/);
 assert.match(themes,/max-height:min\(232px,28vh\)/);
});
test("theme cards have structured text rather than concatenated title and note",()=>{
 assert.match(profile,/className="aurynThemeName"/);
 assert.match(profile,/className="aurynThemeNote"/);
});
