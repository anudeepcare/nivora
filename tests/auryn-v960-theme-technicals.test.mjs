import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const css=fs.readFileSync(new URL("../app/auryn-themes.css",import.meta.url),"utf8");
const profile=fs.readFileSync(new URL("../app/profile/page.tsx",import.meta.url),"utf8");
const provider=fs.readFileSync(new URL("../components/ThemeProvider.tsx",import.meta.url),"utf8");

test("V9.6 keeps exactly seven simple theme names",()=>{
 for(const name of ["Classic","Noir","Sapphire","Racing Green","Bordeaux","Arctic","Bronze"]) assert.match(profile,new RegExp(`name:"${name}"`));
 assert.match(provider,/THEMES=\["classic","noir","sapphire","racing","bordeaux","arctic","porcelain"\]/);
});

test("V9.6 is a single semantic theme contract",()=>{
 assert.match(css,/AURYN V9\.6 — SINGLE SEMANTIC THEME CONTRACT/);
 for(const token of ["--auryn-page-bg","--auryn-page-ink","--auryn-card-bg","--auryn-card-ink","--auryn-soft-bg","--auryn-soft-ink","--auryn-chrome","--auryn-chrome-ink","--auryn-hero-bg-a","--auryn-hero-ink","--auryn-footer-bg","--auryn-footer-ink"]) assert.ok(css.includes(token),token);
 assert.ok(!css.includes("V9.5.8 — ROOT THEME SURFACE CONTRACT"));
});

test("every edition uses a readable editorial canvas",()=>{
 for(const theme of ["noir","sapphire","racing"]){
   const block=css.match(new RegExp(`\\[data-theme="${theme}"\\]\\{([^}]+)\\}`))?.[1]||"";
   assert.match(block,/--auryn-page-bg:#f/i);
   assert.match(block,/--auryn-page-ink:#[123]/i);
 }
});

test("Technicals owns four premium visual levels",()=>{
 for(const marker of [".v934TechnicalCore",".v34TechnicalHero",".v383TechnicalStateGrid",".v34IndicatorGrid"]) assert.ok(css.includes(marker),marker);
 assert.match(css,/grid-template-columns:repeat\(6,minmax\(0,1fr\)\)/);
 assert.match(css,/grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
 assert.match(css,/TECHNICALS — V9\.6/);
});

test("stock tabs, navigation and footer explicitly own foreground",()=>{
 for(const marker of [".aurynEvidenceNav",".aurynStockTabPage",".aurynProductFooter",".aurynProductFooterBrand",".aurynProductFooter nav"]) assert.ok(css.includes(marker),marker);
 assert.match(css,/\.aurynProductFooter\{[^}]*background:var\(--auryn-footer-bg\)[^}]*color:var\(--auryn-footer-ink\)/s);
});

test("Large readability is strong without shrinking or resizing core surfaces",()=>{
 assert.match(css,/\[data-text-size="large"\]\{--auryn-readable-scale:1\.18/);
 assert.ok(css.includes(".aurynSupportText"));
 assert.ok(css.includes(".aurynProductFooter"));
 assert.ok(!css.includes('[data-text-size="large"] .aurynAppMain p'));
});
