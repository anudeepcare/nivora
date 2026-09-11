import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const premium=fs.readFileSync("app/auryn-premium.css","utf8");
const product=fs.readFileSync("app/auryn-product.css","utf8");
const shell=fs.readFileSync("components/AppShell.tsx","utf8");
const auth=fs.readFileSync("components/auth/AuthShell.tsx","utf8");

test("standalone mobile shell has a single safe-area header/search/content stack",()=>{
 assert.match(premium,/\.aurynHeader\{[^}]*position:sticky!important/);
 assert.match(premium,/\.aurynMobileSearch\{[^}]*position:relative!important/);
 assert.match(premium,/\.aurynAppMain\{[^}]*padding-top:8px!important/);
});

test("account menu closes on navigation and is viewport safe",()=>{
 assert.match(shell,/useEffect\(\(\)=>\{setOpen\(false\)\},\[path\]\)/);
 assert.match(premium,/\.aurynAccountMenu\{[^}]*position:fixed!important/);
});

test("auth screens have one compact mobile brand area and no duplicated footer links",()=>{
 assert.match(auth,/aurynAuthMobileBrand/);
 assert.match(premium,/\.aurynAuthProductLinks\{[^}]*display:none!important/);
 assert.match(premium,/\.aurynAuthPanel\{[^}]*padding:24px 20px/);
});

test("research home has compact PWA first viewport",()=>{
 assert.match(premium,/\.aurynResearchHero\{[^}]*padding-top:18px!important/);
 assert.match(premium,/\.aurynResearchHero h1\{[^}]*font-size:48px!important/);
});

test("portfolio mobile intro never renders under search/menu and uses one column",()=>{
 assert.match(product,/\.aurynPortfolioIntro\{[^}]*grid-template-columns:1fr!important/);
 assert.match(product,/\.aurynPortfolioIntro h1\{[^}]*font-size:32px!important/);
});

test("mobile technicals are sequential compact evidence rows",()=>{
 assert.match(premium,/\.v34IndicatorGrid\{[^}]*grid-template-columns:1fr!important/);
 assert.match(premium,/\.v34IndicatorGrid>div\{[^}]*min-height:0!important/);
});

test("bottom nav respects standalone safe area and never covers content",()=>{
 assert.match(product,/\.aurynBottomNav\{[^}]*padding-bottom:calc\(8px \+ env\(safe-area-inset-bottom\)\)!important/);
 assert.match(premium,/\.aurynAppMain\{[^}]*padding-bottom:calc\(92px \+ env\(safe-area-inset-bottom\)\)!important/);
});
