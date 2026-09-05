import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";const read=p=>fs.readFileSync(p,"utf8");
test("stock evidence has a dedicated V3 surface",()=>{assert.match(read("components/stock/StockEvidenceSections.tsx"),/aurynStockEvidenceSurface/);const css=read("app/auryn-product.css");assert.match(css,/\.aurynStockEvidenceSurface/);assert.match(css,/\.aurynStockEvidenceSurface \.v65ResearchTabs|\.aurynStockEvidenceSurface \.v65Evidence/);});
test("stock route remains in shared AppShell",()=>{assert.match(read("app/stock/[symbol]/page.tsx"),/AppShell/);});
