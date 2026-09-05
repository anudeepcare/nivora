import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const read=p=>fs.readFileSync(p,"utf8");
test("shared product footer exposes core product and legal routes",()=>{const f=read("components/ProductFooter.tsx");for(const href of ["/about","/methodology","/terms","/privacy","/disclaimer"])assert.match(f,new RegExp(`href=["']${href}["']`));});
test("authenticated shell mounts ProductFooter",()=>{assert.match(read("components/AppShell.tsx"),/ProductFooter/);});
test("monitor and lab remain in shared shell and lab remains paper only",()=>{assert.match(read("app/alerts/page.tsx"),/AppShell/);const lab=read("app/trading-lab/page.tsx");assert.match(lab,/AppShell/);assert.match(lab,/PAPER|Paper/);assert.match(lab,/No live money|no live money/);});
