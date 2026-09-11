import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const premium=fs.readFileSync("app/auryn-premium.css","utf8");
const product=fs.readFileSync("app/auryn-product.css","utf8");
const shell=fs.readFileSync("components/AppShell.tsx","utf8");

test("PWA header owns iOS safe area and stays visible",()=>{
 assert.match(premium,/\.aurynHeader\{[^}]*position:sticky!important[^}]*top:0!important/);
 assert.match(premium,/padding-top:env\(safe-area-inset-top\)!important/);
 assert.match(premium,/height:calc\(58px \+ env\(safe-area-inset-top\)\)!important/);
});

test("mobile search is normal flow below sticky header, not a floating overlap",()=>{
 assert.match(premium,/\.aurynMobileSearch\{[^}]*position:relative!important[^}]*top:auto!important/);
});

test("mobile security masthead forces identity and market price visible",()=>{
 assert.match(premium,/\.aurynStockIdentityWrap\{[^}]*display:flex!important[^}]*visibility:visible!important/);
 assert.match(premium,/\.aurynStockMarket\{[^}]*display:block!important[^}]*visibility:visible!important/);
});

test("mobile technical evidence uses compact single-column rows to avoid grid row whitespace",()=>{
 assert.match(premium,/\.v34IndicatorGrid\{[^}]*grid-template-columns:1fr!important/);
 assert.match(premium,/\.v34IndicatorGrid>div\{[^}]*min-height:0!important[^}]*grid-template-columns/);
});

test("desktop technical evidence is compact and aligned",()=>{
 assert.match(premium,/@media\(min-width:901px\)/);
 assert.match(premium,/\.v34IndicatorGrid>div\{[^}]*min-height:96px!important/);
});

test("mobile portfolio hero cannot exceed viewport width",()=>{
 assert.match(product,/\.aurynPortfolioPage \.aurynPortfolioIntro/);
 assert.match(product,/\.aurynPortfolioPage \.aurynPortfolioIntro h1\{[^}]*overflow-wrap:anywhere/);
});

test("account popover has explicit mobile viewport-safe geometry",()=>{
 assert.match(premium,/\.aurynAccountMenu\{[^}]*position:fixed!important[^}]*right:12px!important/);
 assert.match(premium,/max-width:calc\(100vw - 24px\)/);
});

test("route changes close account menu",()=>{
 assert.match(shell,/useEffect\(\(\)=>\{setOpen\(false\)\},\[path\]\)/);
});
