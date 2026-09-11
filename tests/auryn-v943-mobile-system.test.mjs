import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const css=fs.readFileSync("app/auryn-mobile.css","utf8");
const layout=fs.readFileSync("app/layout.tsx","utf8");
const shell=fs.readFileSync("components/AppShell.tsx","utf8");

test("authoritative mobile stylesheet loads last",()=>{
 assert.match(layout,/import "\.\/auryn-mobile\.css";/);
 assert.ok(layout.indexOf('auryn-mobile.css')>layout.indexOf('auryn-premium.css'));
});

test("mobile shell owns safe areas exactly in final layer",()=>{
 assert.match(css,/\.aurynHeader\{[^}]*padding-top:env\(safe-area-inset-top\)/);
 assert.match(css,/\.aurynBottomNav\{[^}]*padding-bottom:calc\(8px \+ env\(safe-area-inset-bottom\)\)/);
 assert.match(css,/\.aurynAppMain\{[^}]*padding-bottom:calc\(82px \+ env\(safe-area-inset-bottom\)\)/);
});

test("auth shell is standalone mobile composition",()=>{
 assert.match(css,/\.aurynAuthShell\{/);
 assert.match(css,/\.aurynAuthStory\{/);
 assert.match(css,/\.aurynAuthPanel\{/);
});

test("all authenticated route roots are overflow safe",()=>{
 for(const c of ["aurynPortfolioPage","aurynAlertsPage","aurynTradingLab","simplePage"])assert.match(css,new RegExp(`\\.${c}[^}]*overflow-x:hidden`));
});

test("stock shell always displays identity and market",()=>{
 assert.match(css,/\.aurynStockIdentityWrap\{[^}]*display:flex/);
 assert.match(css,/\.aurynStockMarket\{[^}]*display:block/);
});

test("technicals are compact rows on mobile",()=>{
 assert.match(css,/\.v34IndicatorGrid>div\{[^}]*grid-template-columns:minmax\(96px/);
});

test("account menu is fixed viewport overlay",()=>{
 assert.match(css,/\.aurynAccountMenu\{[^}]*position:fixed/);
});

test("shell closes account menu on route changes",()=>{
 assert.match(shell,/useEffect\(\(\)=>\{setOpen\(false\)\},\[path\]\)/);
});
